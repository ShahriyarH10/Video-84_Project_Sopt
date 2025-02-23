console.log("Let's start JavaScript");

let currentSong = new Audio();
let songs = []; // Store the list of songs globally
let currFolder;

// Utility function to convert seconds to "mm:ss" format
function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(remainingSeconds).padStart(2, "0");

  return `${formattedMinutes}:${formattedSeconds}`;
}

// Fetch songs from the server
async function getSongs(folder) {
  currFolder = folder;
  try {
    let response = await fetch(`http://127.0.0.1:3000/${folder}/`);
    if (!response.ok) throw new Error("Network response was not ok");

    let text = await response.text();
    let div = document.createElement("div");
    div.innerHTML = text;
    let as = div.getElementsByTagName("a");
    let songs = [];

    for (let element of as) {
      if (element.href.endsWith(".mp3")) {
        let songName = decodeURIComponent(element.href.split(`/${folder}/`)[1]);
        songs.push({ name: songName, artist: "Loading..." });
      }
    }

    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";
    for (const song of songs) {
      let li = document.createElement("li");
      li.innerHTML = `
        <img class="invert" src="img/music.svg" alt="Music Icon" />
        <div class="info">
          <div>${song.name}</div>
          <div class="artist">${song.artist}</div>
          <div class="playnow">
            <span>Play Now</span>
            <i class="fa-regular fa-circle-play fa-beat fa-2x"></i>
          </div>
        </div>
      `;
      songUL.appendChild(li);

      // Fetch metadata dynamically
      jsmediatags.read(`http://127.0.0.1:3000/${folder}/${song.name}`, {
        onSuccess: function (tag) {
          let artist = tag.tags.artist || "Unknown Artist";
          li.querySelector(".artist").innerText = artist;
        },
        onError: function () {
          li.querySelector(".artist").innerText = "Unknown Artist";
        },
      });

      // Attach event listener
      li.addEventListener("click", () => {
        console.log("Playing:", song.name);
        playMusic(song.name);
      });
    }
  } catch (error) {
    alert("Failed to fetch songs. Please try again later.");
  }
}

// Play or pause a song
function playMusic(track, pause = false) {
  currentSong.src = `/${currFolder}/` + track;
  if (!pause) {
    currentSong.play();
    document.querySelector("#play").src = "img/pause.svg";
  }
  document.querySelector(".songinfo").innerHTML = decodeURIComponent(
    track.replaceAll("%20", " ")
  );
  document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

  let songUL = document.querySelector(".songList ul");
  if (!songUL) {
    console.error("Song list UL element not found");
    return;
  }

  // Handle error if the song file is missing
  currentSong.onerror = () => {
    alert("Error playing the song. File might be missing or corrupted.");
  };

  // Ensure the seekbar updates when playing a song
  currentSong.addEventListener("timeupdate", updateSeekbar);
}

// Update seekbar circle position
function updateSeekbar() {
  const seekbar = document.querySelector(".seekbar");
  const circle = document.querySelector(".circle");
  if (seekbar && circle) {
    const progress = (currentSong.currentTime / currentSong.duration) * 100;
    circle.style.left = `${progress}%`;
  }
}

// Fetch and display albums
async function displayAlbums() {
  let a = await fetch(`http://127.0.0.1:3000/songs/`);
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;
  let anchors = div.getElementsByTagName("a");
  let cardContainer = document.querySelector(".cardContainer");
  cardContainer.innerHTML = "";

  let array = Array.from(anchors);
  for (let i = 0; i < array.length; i++) {
    if (array[i].href.includes("/songs")) {
      let folder = array[i].href.split("/").slice(-2)[0];
      let a = await fetch(`http://127.0.0.1:3000/songs/${folder}/info.json`);
      let response = await a.json();
      cardContainer.innerHTML += `
      <div data-folder="${folder}" class="card">
        <div class="play">
          <i class="fa-solid fa-circle-play" style="color: #01cb29; font-size: 30px"></i>
        </div>
        <img src="/songs/${folder}/cover.jpg" alt=""/>
        <h2>${response.title}</h2>
        <p>${response.description}</p>
      </div>`;

      // Load the playlist whenever a card is clicked
      document.querySelectorAll(".card").forEach((card) => {
        card.addEventListener("click", async () => {
          await getSongs(`songs/${card.dataset.folder}`);
        });
      });
    }
  }
}

// Play/Pause button event listener
const play = document.querySelector("#play");
if (play) {
  play.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      play.src = "img/pause.svg";
    } else {
      currentSong.pause();
      play.src = "img/play.svg";
    }
  });
}

// Main function
async function main() {
  await getSongs("songs/cs");
  if (songs.length > 0) {
    playMusic(songs[0], true); // Load the first song but don't play it
  }
  await displayAlbums();
}

// Update song time and seekbar position
currentSong.addEventListener("timeupdate", () => {
  document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(
    currentSong.currentTime
  )} / ${secondsToMinutesSeconds(currentSong.duration)}`;
  updateSeekbar();
});

// Add event listener to seekbar
const seekbar = document.querySelector(".seekbar");
if (seekbar) {
  seekbar.addEventListener("click", (e) => {
    const seekbarWidth = e.target.getBoundingClientRect().width;
    const clickPosition = e.offsetX;
    const progress = (clickPosition / seekbarWidth) * 100;
    currentSong.currentTime = (progress / 100) * currentSong.duration;
    updateSeekbar();
  });
}

// Event listener for hamburger
document.querySelector(".hamburger").addEventListener("click", () => {
  document.querySelector(".left").style.left = "0";
});

// Event listener for close button
document.querySelector(".close").addEventListener("click", () => {
  document.querySelector(".left").style.left = "-110%";
});

// Event listener for previous button
document.querySelector("#previous").addEventListener("click", () => {
  let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
  if (index - 1 >= 0) {
    playMusic(songs[index - 1]);
  }
});

// Event listener for next button
document.querySelector("#next").addEventListener("click", () => {
  let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
  if (index + 1 < songs.length) {
    playMusic(songs[index + 1]);
  }
});

// Add an event to volume control
document.querySelector(".range input").addEventListener("change", (e) => {
  currentSong.volume = parseInt(e.target.value) / 100;
});

// Add event listener to mute the track
document.querySelector(".volume>img").addEventListener("click", (e) => {
  console.log(e.target);
  if (e.target.src.includes("img/volume.svg")) {
    e.target.src = e.target.src.replace("img/volume.svg", "img/mute.svg");
    currentSong.volume = 0;
  } else {
    e.target.src = e.target.src.replace("img/mute.svg", "img/volume.svg");
    currentSong.volume = 0.1;
  }
});
// Initialize the app
main();
