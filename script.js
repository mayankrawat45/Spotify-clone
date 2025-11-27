let currentSong = new Audio();
let songs;
let currentfolder;

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

async function getSongs(folder) {
  currentfolder = folder;

  // FETCH USING RELATIVE PATH (GitHub Pages)
  let a = await fetch(`${currentfolder}/`);
  let response = await a.text();

  let div = document.createElement("div");
  div.innerHTML = response;

  let as = div.getElementsByTagName("a");
  songs = [];

  for (let index = 0; index < as.length; index++) {
    const element = as[index];

    if (element.href.endsWith(".mp3")) {
      fixed = decodeURI(element.href);
      fixed = fixed.replace(/\\/g, "/");
      fixed = fixed.replace(window.location.origin + "/", "");

      songs.push(fixed.split(`${currentfolder}/`)[1]);
    }
  }

  // Display songs in playlist
  let songUl = document.querySelector(".songlisting ul");
  songUl.innerHTML = "";

  for (const song of songs) {
    songUl.innerHTML += `
      <li>
        <div>
          <img class="invert" src="img/music.svg" alt="">
          <div class="info">
            <div style="font-weight:bold;">${song.replaceAll("%20", " ")}</div>
            <div>Mayank</div>
          </div>
        </div>
        <img class="invert" src="img/play.svg" alt="">
      </li>
    `;
  }

  // Add song click listeners
  Array.from(songUl.getElementsByTagName("li")).forEach((e) => {
    e.addEventListener("click", () => {
      playmusic(e.querySelector(".info div:first-child").innerHTML);
    });
  });

  return songs;
}

const playmusic = (track, pause = false) => {
  // Relative path for GitHub Pages
  currentSong.src = `${currentfolder}/` + track;

  if (!pause) {
    currentSong.play();
    play.src = "img/pause.svg";
  }

  document.querySelector(".songtime").innerHTML = `00:00 / 00:00`;
  document.querySelector(".songinfo").innerHTML = decodeURI(
    track.replace(".mp3", "")
  );
};

async function main() {
  await getSongs("songs/ncs");
  playmusic(songs[0], true);

  play.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      play.src = "img/pause.svg";
    } else {
      currentSong.pause();
      play.src = "img/play.svg";
    }
  });

  currentSong.addEventListener("timeupdate", () => {
    const duration = isNaN(currentSong.duration) ? 0 : currentSong.duration;
    document.querySelector(".songtime").innerHTML = `${formatTime(
      currentSong.currentTime
    )} / ${formatTime(duration)}`;

    document.querySelector(".circle").style.left =
      (currentSong.currentTime / duration) * 100 + "%";
  });

  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentSong.currentTime = (currentSong.duration * percent) / 100;
  });

  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = 0;
  });

  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-140%";
  });

  previous.addEventListener("click", () => {
    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if (index - 1 >= 0) playmusic(songs[index - 1]);
  });

  next.addEventListener("click", () => {
    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if (index + 1 < songs.length) playmusic(songs[index + 1]);
  });

  document.querySelector(".range").addEventListener("change", (e) => {
    currentSong.volume = parseInt(e.target.value) / 100;

    if (currentSong.volume > 0) {
      document.querySelector(".soundtime img").src =
        "img/volume.svg";
    } else {
      document.querySelector(".soundtime img").src =
        "img/mute.svg";
    }
  });
}

async function displayAlbums() {
  // Relative path
  let a = await fetch(`songs`);
  let response = await a.text();

  let div = document.createElement("div");
  div.innerHTML = response;

  let anchors = div.getElementsByTagName("a");
  let cardContainer = document.querySelector(".cardContainer");

  let array = Array.from(anchors);

  for (let index = 0; index < array.length; index++) {
    let e = array[index];

    let uri = decodeURI(e.href);
    fixeded = uri.replace(/\\/g, "/");

    if (fixeded.includes("/songs")) {
      let folder = fixeded.split("/").slice(-2)[0];

      // Fetch metadata
      let a = await fetch(`songs/${folder}/info.json`);
      let albumInfo = await a.json();

      cardContainer.innerHTML += `
        <div data-folder="${folder}" class="card">
          <div class="play">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40">
              <circle cx="12" cy="12" r="12" fill="green" />
              <polygon points="10,8 16,12 10,16" fill="black" />
            </svg>
          </div>
          <img src="songs/${folder}/cover.jpeg" alt="">
          <h2>${albumInfo.title}</h2>
          <p>${albumInfo.description}</p>
        </div>`;
    }
  }

  // Card click event
  Array.from(document.getElementsByClassName("card")).forEach((e) => {
    e.addEventListener("click", async (item) => {
      songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
      playmusic(songs[0]);
    });
  });

  // Volume icon
  document.querySelector(".soundtime img").addEventListener("click", (e) => {
    if (e.target.src.includes("volume.svg")) {
      e.target.src = "img/mute.svg";
      currentSong.volume = 0;
      document.querySelector(".range").value = 0;
    } else {
      e.target.src = "img/volume.svg";
      currentSong.volume = 0.1;
      document.querySelector(".range").value = 10;
    }
  });
}

displayAlbums();
main();
