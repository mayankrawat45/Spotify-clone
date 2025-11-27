let currentSong = new Audio();
let songs;
let currentfolder;

function formatTime(seconds) {
  // Ensure it's an integer
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  // Add leading zero if needed
  const formattedMins = String(mins).padStart(2, "0");
  const formattedSecs = String(secs).padStart(2, "0");

  return `${formattedMins}:${formattedSecs}`;
}

async function getSongs(folder) {
  currentfolder=folder
  let a = await fetch(`http://192.168.29.42:3000/video84/${currentfolder}/`);
  let response = await a.text();
  // console.log(response)
  let div = document.createElement("div");
  div.innerHTML = response;
  let as = div.getElementsByTagName("a");
  songs = [];
  for (let index = 0; index < as.length; index++) {
    const element = as[index];
    if (element.href.endsWith(".mp3")) {
      fixed =decodeURI(element.href)
      fixed = fixed.replace(/\\/g, "/");
      fixed = fixed.replace("video84/", "");
      // console.log(fixed)
      songs.push(fixed.split(`${currentfolder}/`)[1]);
      // console.log(fixed.split(`${currentfolder}/`)[1])
    }
  }


  // show all the songs in the playlist
  let songUl = document
    .querySelector(".songlisting")
    .getElementsByTagName("ul")[0];

    songUl.innerHTML=""
  for (const song of songs) {
    songUl.innerHTML =
      songUl.innerHTML +
      `
        
        <li>
                            <div>

                                <img class="invert" src="img/music.svg" alt="">
                                <div class="info">
                                    <div  style="font-weight:bold;">${song.replaceAll(
                                      "%20",
                                      " "
                                    )}</div>
                                    <div>Mayank</div>
                                </div>
                            </div>
                            <img class="invert" src="img/play.svg" alt="">
        </li>
        
        `;
  }

  // attach an event listner to all the left songlist
  Array.from(
    document.querySelector(".songlisting").getElementsByTagName("li")
  ).forEach((e) => {
    e.addEventListener("click", () => {
      playmusic(e.querySelector(".info").firstElementChild.innerHTML);
      // console.log(e.querySelector(".info").firstElementChild.innerHTML)
    });
  });
  return songs
}

const playmusic = (track, pause = false) => {
  currentSong.src = `/video84/${currentfolder}/` + track;
  if (!pause) {
    currentSong.play();
    play.src = "img/pause.svg";
  }

  // adding songinfo and songduration to seekbar
  document.querySelector(".songtime").innerHTML = `00:00 / 00:00`;
  document.querySelector(".songinfo").innerHTML = decodeURI(
    track.replace(".mp3", "")
  );
  // document.querySelector(".songtime").innerHTML=currentSong.duration
};

async function main() {
  await getSongs("songs/ncs");
  

  // load first song
  playmusic(songs[0], true);

  

  //Attach an event listner to play next and previous
  play.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      play.src = "img/pause.svg";
    } else {
      currentSong.pause();
      play.src = "img/play.svg";
    }
  });

  // listen for timeupdate event
  currentSong.addEventListener("timeupdate", () => {
    const duration = isNaN(currentSong.duration) ? 0 : currentSong.duration;
    document.querySelector(".songtime").innerHTML = `${formatTime(
      currentSong.currentTime
    )} / ${formatTime(duration)}`;
    document.querySelector(".circle").style.left =
      (currentSong.currentTime / duration) * 100 + "%";
  });

  // Add an event listner to the seekbar
  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentSong.currentTime = (currentSong.duration * percent) / 100;
  });

  // Add an event listner to hamburger
  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = 0;
  });
  // closing hamburger
  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-140%";
  });

  // add an event listner to the previous
  previous.addEventListener("click", () => {
    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if (index-1 >= 0) {
      playmusic(songs[index - 1]);
    }
  });

  // add an event listner to the next
  next.addEventListener("click", () => {
    // console.log(currentSong.src.split('/').splice(-1))

    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    // console.log(songs,index)
    if (index+1 < songs.length) {
      playmusic(songs[index + 1]);
    }
  });

  document.querySelector(".range").addEventListener("change",(e)=>{
      console.log(e.target.value)
      currentSong.volume=parseInt(e.target.value)/100;
      if(currentSong.volume>0){
        document.querySelector(".soundtime>img").src=document.querySelector(".soundtime>img").src.replace("mute.svg","volume.svg")
        console.log( document.querySelector(".soundtime>img").src.replace("mute.svg","volume.svg")
      )
    }else if(currentSong.volume==0){
        document.querySelector(".soundtime>img").src=document.querySelector(".soundtime>img").src.replace("volume.svg","mute.svg")

      }
  })

 
}

//display all the albums on the page
async function displayAlbums() {
  let a = await fetch(`http://192.168.29.42:3000/video84/songs`);
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;
  console.log(div)
  let anchors=div.getElementsByTagName("a")
  console.log(anchors)
  let cardContainer=document.querySelector(".cardContainer")



  let array=Array.from(anchors)

  for (let index = 0; index < array.length; index++) {
    let e= array[index];
    
  
    let uri=decodeURI(e.href)
    fixeded = uri.replace(/\\/g, "/");
    if(fixeded.includes('/songs')){
      // console.log(fixeded.split('/').slice(-2)[0])
      let folder=fixeded.split('/').slice(-2)[0]
      //get the metadata of the folder
      let a = await fetch(`http://192.168.29.42:3000/video84/songs/${folder}/info.json`);
      let response = await a.json();
      cardContainer.innerHTML=cardContainer.innerHTML+` <div data-folder="${folder}" class="card">
                        <div  class="play">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40">
                            <circle cx="12" cy="12" r="12" fill="green" />
                            <polygon points="10,8 16,12 10,16" fill="black" />
                        </svg>
                        </div>



                        <img src="songs/${folder}/cover.jpeg" alt="">
                        <h2>${response.title}</h2>
                        <p>${response.description}</p>
                    </div>`
    }
  }
   //load the list whenever card is clicked
  Array.from(document.getElementsByClassName("card")).forEach(e=>{
    e.addEventListener("click",async(item)=>{
      songs=await getSongs(`songs/${item.currentTarget.dataset.folder}`)
      playmusic(songs[0])
    })
  })


  //Add an event listner to the volumesvg
  document.querySelector('.soundtime>img').addEventListener("click",(e)=>{
    console.log(e.target)
    if(e.target.src.includes("volume.svg")){
      e.target.src=e.target.src.replace("volume.svg","mute.svg")
      currentSong.volume=0
      document.querySelector(".range").value=0
    }else{
      e.target.src=e.target.src.replace("mute.svg","volume.svg")
      currentSong.volume=0.10
      document.querySelector(".range").value=10

    }
  })
}

displayAlbums()
main();
