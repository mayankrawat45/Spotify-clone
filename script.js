/* script.js - GitHub Pages friendly and robust version */

/*
  Requirements for GitHub Pages:
  - Each album folder should contain info.json with a "tracks" array.
    Example: songs/ncs/info.json -> { "title": "...", "description": "...", "tracks": ["1.mp3","2.mp3"] }

  - Optionally, songs/index.json can list album folder names:
    ["ncs","album2"]
*/

let currentSong = new Audio();
let songs = [];
let currentfolder = "";
// Query these once (defensive)
const playBtn = document.querySelector("#play") || document.querySelector(".play-button") || null;
const previousBtn = document.querySelector("#previous") || document.querySelector(".previous") || null;
const nextBtn = document.querySelector("#next") || document.querySelector(".next") || null;

function formatTime(seconds) {
  if (isNaN(seconds) || seconds === Infinity) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Try to get songs for a folder.
 * First, try folder/info.json (recommended for GitHub Pages).
 * If that fails, try to fetch the folder root and parse anchor tags (works on local dev).
 * @param {string} folder e.g. "songs/ncs"
 * @returns {Promise<Array<string>>}
 */
async function getSongs(folder) {
  currentfolder = folder.replace(/\/$/u, ""); // remove trailing slash
  songs = [];

  // 1) Preferred: fetch info.json inside the folder
  try {
    const infoRes = await fetch(`${currentfolder}/info.json`);
    if (infoRes.ok) {
      const info = await infoRes.json();
      if (Array.isArray(info.tracks) && info.tracks.length > 0) {
        songs = info.tracks.map((t) => String(t));
        console.log(`Loaded ${songs.length} tracks from ${currentfolder}/info.json`);
      } else {
        console.warn(`${currentfolder}/info.json found but has no "tracks" array.`);
      }
    } else {
      // not ok → will fallback to directory scraping
      console.info(`${currentfolder}/info.json not found (status ${infoRes.status}). Trying fallback.`);
    }
  } catch (err) {
    console.info(`Couldn't fetch ${currentfolder}/info.json — trying fallback.`, err);
  }

  // 2) Fallback: try to fetch the folder root and parse anchors (works for local servers that allow directory listing)
  if (songs.length === 0) {
    try {
      const a = await fetch(`${currentfolder}/`);
      if (a.ok) {
        const response = await a.text();
        const div = document.createElement("div");
        div.innerHTML = response;
        const as = div.getElementsByTagName("a");
        for (let i = 0; i < as.length; i++) {
          const el = as[i];
          // anchor href might be absolute or relative - decode and normalize
          const href = decodeURI(el.getAttribute("href") || el.href || "");
          if (href && href.toLowerCase().endsWith(".mp3")) {
            // get filename only
            const parts = href.split("/").filter(Boolean);
            const filename = parts[parts.length - 1];
            songs.push(filename);
          }
        }
        if (songs.length > 0) {
          console.log(`Loaded ${songs.length} tracks by parsing directory listing for ${currentfolder}/`);
        } else {
          console.warn(`Directory parsing succeeded but no .mp3 anchors found in ${currentfolder}/`);
        }
      } else {
        console.warn(`Failed to fetch ${currentfolder}/ (status ${a.status}). Directory listing probably unavailable (GitHub Pages).`);
      }
    } catch (err) {
      console.warn(`Error while attempting to parse directory listing for ${currentfolder}/`, err);
    }
  }

  // Populate the playlist UI (defensive checks)
  const songUl = document.querySelector(".songlisting ul");
  if (songUl) {
    songUl.innerHTML = "";
    for (const song of songs) {
      const displayName = song.replaceAll("%20", " ");
      songUl.innerHTML += `
        <li>
          <div>
            <img class="invert" src="img/music.svg" alt="">
            <div class="info">
              <div style="font-weight:bold;">${displayName}</div>
              <div>Mayank</div>
            </div>
          </div>
          <img class="invert play-btn-small" src="img/play.svg" alt="">
        </li>
      `;
    }

    // Attach listeners to list items
    Array.from(songUl.getElementsByTagName("li")).forEach((li) => {
      li.addEventListener("click", () => {
        const titleDiv = li.querySelector(".info > div");
        const trackName = titleDiv ? titleDiv.innerText : null;
        if (trackName) playmusic(trackName);
      });
    });
  } else {
    console.warn(".songlisting ul not found in DOM — playlist UI won't render.");
  }

  return songs;
}

/**
 * Play a track (track is the filename string like "01 - track.mp3")
 * pause param allows setting src without auto-playing
 */
const playmusic = (track, pause = false) => {
  if (!track) {
    console.warn("playmusic called with empty track; aborting.");
    return;
  }

  // Build path carefully (avoid double slashes)
  const folderPath = currentfolder.replace(/\/$/u, "");
  const src = `${folderPath}/${track}`;

  currentSong.src = src;

  // Update UI elements (defensive)
  const songInfoEl = document.querySelector(".songinfo");
  if (songInfoEl) songInfoEl.innerHTML = decodeURI(track.replace(".mp3", ""));

  const songTimeEl = document.querySelector(".songtime");
  if (songTimeEl) songTimeEl.innerHTML = `00:00 / 00:00`;

  if (!pause) {
    // play button might be an <img id="play"> as in old code
    if (currentSong.paused) {
      currentSong.play().catch((err) => {
        console.warn("Autoplay prevented or playback error:", err);
      });
    } else {
      // restart if something else
      currentSong.play().catch((err) => {
        console.warn("Playback error:", err);
      });
    }
    if (playBtn && playBtn.tagName === "IMG") {
      playBtn.src = "img/pause.svg";
    } else if (playBtn) {
      // if button element, toggle class or text
      playBtn.classList.add("playing");
    }
  }
};

// MAIN: wire up controls
async function main() {
  // Try to load a sensible default folder. If you want a different default, change this.
  const defaultFolder = "songs/ncs";

  const loadedSongs = await getSongs(defaultFolder);

  if (Array.isArray(loadedSongs) && loadedSongs.length > 0) {
    // load first song but don't autoplay (so browsers don't block)
    playmusic(loadedSongs[0], true);
  } else {
    console.warn(`No songs found in ${defaultFolder}. Ensure ${defaultFolder}/info.json exists or directory listing is available.`);
  }

  // Play/pause toggle (defensive)
  if (playBtn) {
    playBtn.addEventListener("click", () => {
      if (currentSong.paused) {
        currentSong.play().catch((err) => console.warn(err));
        if (playBtn.tagName === "IMG") playBtn.src = "img/pause.svg";
        else playBtn.classList.add("playing");
      } else {
        currentSong.pause();
        if (playBtn.tagName === "IMG") playBtn.src = "img/play.svg";
        else playBtn.classList.remove("playing");
      }
    });
  } else {
    console.warn("Play button not found (#play or .play-button).");
  }

  // timeupdate
  currentSong.addEventListener("timeupdate", () => {
    const duration = isNaN(currentSong.duration) ? 0 : currentSong.duration;
    const timeEl = document.querySelector(".songtime");
    if (timeEl) timeEl.innerHTML = `${formatTime(currentSong.currentTime)} / ${formatTime(duration)}`;

    const circle = document.querySelector(".circle");
    if (circle && duration > 0) {
      const leftPercent = (currentSong.currentTime / duration) * 100;
      circle.style.left = `${Math.min(Math.max(leftPercent, 0), 100)}%`;
    }
  });

  // seekbar click
  const seekbar = document.querySelector(".seekbar");
  if (seekbar) {
    seekbar.addEventListener("click", (e) => {
      const w = e.target.getBoundingClientRect().width;
      const offsetX = e.offsetX || (e.clientX - e.target.getBoundingClientRect().left);
      const percent = offsetX / w;
      const duration = isNaN(currentSong.duration) ? 0 : currentSong.duration;
      currentSong.currentTime = duration * percent;
      const circle = document.querySelector(".circle");
      if (circle) circle.style.left = `${percent * 100}%`;
    });
  }

  // hamburger open/close
  const hamburger = document.querySelector(".hamburger");
  const leftPanel = document.querySelector(".left");
  const closeBtn = document.querySelector(".close");
  if (hamburger && leftPanel) {
    hamburger.addEventListener("click", () => {
      leftPanel.style.left = "0";
    });
  }
  if (closeBtn && leftPanel) {
    closeBtn.addEventListener("click", () => {
      leftPanel.style.left = "-140%";
    });
  }

  // previous / next
  if (previousBtn) {
    previousBtn.addEventListener("click", () => {
      if (!songs || songs.length === 0) return;
      const currentFile = currentSong.src.split("/").slice(-1)[0];
      let index = songs.indexOf(currentFile);
      if (index === -1) {
        // maybe current file is URL encoded or not matching; try decode
        index = songs.findIndex((s) => decodeURI(s) === decodeURI(currentFile));
      }
      if (index > 0) playmusic(songs[index - 1]);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (!songs || songs.length === 0) return;
      const currentFile = currentSong.src.split("/").slice(-1)[0];
      let index = songs.indexOf(currentFile);
      if (index === -1) {
        index = songs.findIndex((s) => decodeURI(s) === decodeURI(currentFile));
      }
      if (index + 1 < songs.length) playmusic(songs[index + 1]);
    });
  }

  // volume range
  const range = document.querySelector(".range");
  const soundImg = document.querySelector(".soundtime img");
  if (range) {
    range.addEventListener("change", (e) => {
      const vol = parseInt(e.target.value, 10) / 100;
      currentSong.volume = isNaN(vol) ? 0 : vol;
      if (soundImg) {
        if (currentSong.volume > 0) soundImg.src = soundImg.src.replace("mute.svg", "volume.svg");
        else soundImg.src = soundImg.src.replace("volume.svg", "mute.svg");
      }
    });
  }

  // volume icon click
  if (soundImg) {
    soundImg.addEventListener("click", (e) => {
      const src = e.target.src || "";
      if (src.includes("volume.svg")) {
        e.target.src = src.replace("volume.svg", "mute.svg");
        currentSong.volume = 0;
        if (range) range.value = 0;
      } else {
        e.target.src = src.replace("mute.svg", "volume.svg");
        currentSong.volume = 0.1;
        if (range) range.value = 10;
      }
    });
  }
}

// Display albums: prefer songs/index.json; fallback to directory listing parsing
async function displayAlbums() {
  const cardContainer = document.querySelector(".cardContainer");
  if (!cardContainer) {
    console.warn(".cardContainer not found in DOM — albums won't be displayed.");
    return;
  }

  let albumFolders = [];

  // 1) try songs/index.json
  try {
    const idxRes = await fetch("songs/index.json");
    if (idxRes.ok) {
      const idx = await idxRes.json();
      if (Array.isArray(idx) && idx.length > 0) {
        albumFolders = idx.map((s) => String(s));
        console.log("Loaded album list from songs/index.json");
      } else {
        console.warn("songs/index.json found but empty or not an array.");
      }
    } else {
      console.info(`songs/index.json not found (status ${idxRes.status}). Trying fallback.`);
    }
  } catch (err) {
    console.info("Could not fetch songs/index.json; trying fallback.", err);
  }

  // 2) fallback: try to fetch songs/ and parse anchors (works for local servers)
  if (albumFolders.length === 0) {
    try {
      const a = await fetch("songs/");
      if (a.ok) {
        const response = await a.text();
        const div = document.createElement("div");
        div.innerHTML = response;
        const anchors = div.getElementsByTagName("a");
        const arr = Array.from(anchors);
        for (const aEl of arr) {
          const uri = decodeURI(aEl.getAttribute("href") || aEl.href || "");
          const fixed = uri.replace(/\\/g, "/");
          // Only include folders (heuristic: href ends with '/')
          if (fixed.endsWith("/")) {
            const parts = fixed.split("/").filter(Boolean);
            const folder = parts[parts.length - 1];
            if (folder && !albumFolders.includes(folder)) albumFolders.push(folder);
          }
        }
        console.log("Loaded album list by parsing directory listing (local dev).");
      } else {
        console.warn(`Failed to fetch songs/ (status ${a.status}). Directory listing unavailable on GitHub Pages.`);
      }
    } catch (err) {
      console.warn("Fallback fetch for songs/ failed.", err);
    }
  }

  if (albumFolders.length === 0) {
    cardContainer.innerHTML = `<p>No albums found. Ensure songs/index.json exists or upload folders directly. See console for details.</p>`;
    return;
  }

  // Build cards
  cardContainer.innerHTML = "";
  for (const folder of albumFolders) {
    // Try to fetch album info.json to get title/description, else fallback to folder name
    let albumTitle = folder;
    let albumDesc = "";
    try {
      const infoRes = await fetch(`songs/${folder}/info.json`);
      if (infoRes.ok) {
        const info = await infoRes.json();
        albumTitle = info.title || folder;
        albumDesc = info.description || "";
      }
    } catch (err) {
      // ignore, we'll use folder name
    }

    // Use cover.jpeg if present (GitHub Pages will serve it if in repo)
    const coverPath = `songs/${folder}/cover.jpeg`;

    cardContainer.innerHTML += `
      <div data-folder="${folder}" class="card">
        <div class="play">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40">
            <circle cx="12" cy="12" r="12" fill="green" />
            <polygon points="10,8 16,12 10,16" fill="black" />
          </svg>
        </div>
        <img src="${coverPath}" alt="${albumTitle} cover" onerror="this.style.opacity=0.3;">
        <h2>${albumTitle}</h2>
        <p>${albumDesc}</p>
      </div>
    `;
  }

  // Card click events (delegate)
  Array.from(document.getElementsByClassName("card")).forEach((el) => {
    el.addEventListener("click", async (ev) => {
      const folder = ev.currentTarget.dataset.folder;
      if (!folder) return;
      const folderPath = `songs/${folder}`;
      const loaded = await getSongs(folderPath);
      if (Array.isArray(loaded) && loaded.length > 0) {
        playmusic(loaded[0]);
      } else {
        alert(`No tracks found in songs/${folder}. Make sure songs/${folder}/info.json exists and contains a "tracks" array.`);
      }
    });
  });
}

// Run
displayAlbums();
main();
