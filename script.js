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
    let a = await fetch(`/${folder}/`);
    if (!a.ok) {
      throw new Error("Network response was not ok");
    }
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = [];

    for (let element of as) {
      if (element.href.endsWith(".mp3")) {
        songs.push(decodeURIComponent(element.href.split(`/${folder}/`)[1]));
      }
    }

    // Display songs in the list
    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";
    for (const song of songs) {
      songUL.innerHTML += `
      <li>
        <img class="invert" src="img/music.svg" alt="Music Icon" />
        <div class="info">
          <div>${song}</div>
          <div>Song Artist</div>
          <div class="playnow">
            <span>Play Now</span>
            <i class="fa-regular fa-circle-play fa-1x"></i>
          </div>
        </div>
      </li>`;
    }

    // Attach event listeners to each song
    Array.from(songUL.getElementsByTagName("li")).forEach((e) => {
      e.addEventListener("click", () => {
        let songName = e.querySelector(".info div").innerHTML.trim();
        console.log("Playing:", songName);
        playMusic(songName);
      });
    });
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
  let a = await fetch(`/songs`);
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
      let a = await fetch(`/songs/${folder}/info.json`);
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

// const mute = document.querySelector(".volume>img");
// if (mute) {
//   mute.addEventListener("click", (e) => {
//     if (e.target.src.includes("img/volume.svg")) {
//       e.target.src.replace("img/volume.svg", "img/mute.svg");
//       currentSong.volume = 0;
//     } else {
//       e.target.src.replace("img/mute.svg", "img/volume.svg");
//       currentSong.volume = 0.1;
//     }
//   });
// }

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
