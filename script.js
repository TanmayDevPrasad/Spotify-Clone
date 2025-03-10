//AUTHOR : TANMAY DEV PRASAD
//DATE : 06 MARCH 2025
var songs;                                              //global array to store all fetched songs
var currentFolder;                                      //global variable to store current playlist album
var CurrentSong = new Audio();                          //global variable to store current playing song
const seekbar = document.getElementById("seekBar")      //variable to select seekbar
const playBtn = document.getElementById("play")
const nextBtn = document.getElementById("next")         //variable to select next button
const previousBtn = document.getElementById("previous") //variable to select previous button


//function to fetch songs from the hosted directory
async function getSongs(directory) {
    console.log("Fetching songs from:", directory);  // Debugging log
    currentFolder = directory;
    let data = await fetch(`/${currentFolder}/`)      //fetching the html site consisting index of songs
    let response = await data.text();       //parsing the html into text

    let div = document.createElement("div")
    div.innerHTML = response;

    songs = []           //empty array to collect links of the songs

    let anchors = div.getElementsByTagName("a")     //elements collection of all source links of songs

    for (let index = 0; index < anchors.length; index++) {
        const element = anchors[index];
        if (element.href.endsWith(".mp3")) {                            //filtering the links with mp3 files
            songs.push(element.href.split(`/${currentFolder}/`)[1])      //removing the host link part
        }
    }

    //load the first song being paused in the library playlist by default 
    playTrack(songs[0], true)


    let list = document.getElementById("songsList")
    list.innerHTML = ""
    for (const song of songs) {
        list.innerHTML = list.innerHTML + ` <li class="item">
                                                <div class="info">
                                                    <img src="Assets/musicNote.svg" alt="music">
                                                    <div id="tempId">
                                                        <h4>${song.replaceAll("%20", " ")}</h4>
                                                        </div>
                                                        </div>
                                                        <img src="Assets/play.svg" alt="play" class="playSong">
                                                        </li>
                                                        `
        // <span>Er. TDP</span>
    }
    console.log("Songs array after fetching:", songs);
    return songs;

}

//function to fetch playlist album folders and display them dynamically
async function displayAlbums() {
    let data = await fetch(`/songs`)       //fetching the html site of hosted album folders
    let firstAlbum = null;
    let response = await data.text();                           //parsing the html into text
    let albumContainer = document.querySelector(".playlists")
    let div = document.createElement("div")
    div.innerHTML = response;

    let arr = Array.from(div.getElementsByTagName("a"))         //array of links of the album folders
    for (let index = 0; index < arr.length; index++) {
        const element = arr[index];

        if (element.href.includes("/songs")) {
            let folder = element.href.split("/").slice(-2)[0];

            //fetching the metadata of the album folder
            let material = await fetch(`/songs/${folder}/info.json`)
            let info = await material.json();   //fetching the json file for getting info


            albumContainer.innerHTML = albumContainer.innerHTML + `<div data-folder="${folder}" class="songCard">
                    <button class="play superflex">
                        <svg xmlns="http://www.w3.org/2000/svg" height="35px" viewBox="0 -960 960 960" width="48px"
                            fill="#000000">
                            <path d="M320-203v-560l440 280-440 280Z" />
                        </svg>
                    </button>
                    <img src="songs/${folder}/coverImage.jpeg" alt="album">
                    <div class="songName">
                        <h2>${info.title}</h2>
                    </div>
                    <p>${info.description}</p>
                </div>`



            //configuring songCards when clicked to open their songs list in the aside library
            Array.from(document.querySelectorAll(".songCard")).forEach(element => {
                element.addEventListener("click", async (obj) => {
                    songs = await getSongs(`songs/${obj.currentTarget.dataset.folder}`)        //getting the array of song files
                    playTrack(songs[0])
                }
                )
            });

            if(!firstAlbum){    //initially null so after 1st loop value assigned and then never null again
                firstAlbum = folder;
                console.log(firstAlbum)
            }
        }
    }
    // Load songs from the first album by default
    if (firstAlbum) {
        console.log(`Loading songs from first album: ${firstAlbum}`);
        getSongs(`songs/${firstAlbum}`);
    }
}

//function to play the current song 
function playTrack(url, pause = false) {
    CurrentSong.src = `/${currentFolder}/` + url // /songs/ is used with given song file name to refer the song 
    if (!pause) {
        CurrentSong.play()
        document.getElementById("play").src = "Assets/pause.svg"

    }
    document.querySelector(".songInfo").innerHTML = decodeURI(url).split("320")[0]
    
}


//function to update time display
function updateTimeDisplay() {
    const currentMinutes = Math.floor(CurrentSong.currentTime / 60)   //automatically get current audio minute
    const currentSeconds = Math.floor(CurrentSong.currentTime % 60).toString().padStart(2, "0")    //automatically get current audio seconds as if the value exceeds 60 it will start over from 0

    const durationMinutes = Math.floor(CurrentSong.duration / 60)
    const durationSeconds = Math.floor(CurrentSong.duration % 60).toString().padStart(2, "0")     //automatically get duration audio seconds as if the value exceeds 60 it will start over from 0

    document.querySelector(".songTiming").innerHTML = `${currentMinutes}:${currentSeconds} / ${durationMinutes}:${durationSeconds}`
}


//MAIN FUNCTION :

(async function main() {


    //display the dynamic albums
    displayAlbums()

    //logic to play song on clicking from library :

    //! event delegation to songslist to detect click on dynamically added songs 

    document.getElementById("songsList").addEventListener("click", (event) => {
        let clickedItem = event.target.closest(".item"); // Find the clicked item
        if (!clickedItem) return; // Ignore clicks outside list items
    
        const trackName = clickedItem.querySelector("h4").innerHTML;
        playTrack(trackName);
    
        document.querySelector(".asideMenu").style.left = "-100%";
    });
    

    //setting the max value of seekbar relevant to song duration when the song is loaded
    CurrentSong.addEventListener("loadedmetadata", () => {
        seekbar.max = Math.floor(CurrentSong.duration)
        updateTimeDisplay();
    }
    )

    //syncing the seekbar with ongoing song
    CurrentSong.addEventListener("timeupdate", () => {
        seekbar.value = Math.floor(CurrentSong.currentTime)
        updateTimeDisplay();
        if (seekbar.value == seekbar.max) {
            console.log("song is finished")
            let nextSong = (songs.indexOf(CurrentSong.src.split(`${currentFolder}/`)[1])) + 1
            if (nextSong < songs.length) {                  //setting the limit to avoid array out of bound error
                playTrack(songs[nextSong])                  //playing the next song in the global song array
            }
            else{
                playBtn.src = "Assets/play.svg"
            }
        }
    }
    )

    //listening to seekbar to update song time accordingly
    seekbar.addEventListener("input", () => {
        CurrentSong.currentTime = seekbar.value;
        updateTimeDisplay();
    }
    )


    //configuring the play pause button
    playBtn.addEventListener('click', () => {

        //to play / pause the song
        if (CurrentSong.paused) {
            CurrentSong.play()
            playBtn.src = "Assets/pause.svg"
        }
        else {
            CurrentSong.pause()
            playBtn.src = "Assets/play.svg"
        }

    }
    )

    //configuring the next button
    nextBtn.addEventListener("click", () => {
        let currentFileSrc = CurrentSong.src.split(`${currentFolder}/`)[1]   //getting the current song's source 

        let nextSong = (songs.indexOf(currentFileSrc)) + 1        //incrementing the index of currentSong in global songs array
        console.log(nextSong)
        if (nextSong < songs.length) {                  //setting the limit to avoid array out of bound error
            playTrack(songs[nextSong])                  //playing the next song in the global song array
        }
    }
    )

    //configuring the previous button
    previousBtn.addEventListener("click", () => {
        let currentFileSource = CurrentSong.src.split(`${currentFolder}/`)[1]   //getting the current song's source 
        let prevSong = (songs.indexOf(currentFileSource)) - 1        //decrementing the index of currentSong in global songs array
        console.log(prevSong)
        if (prevSong >= 0) {                            //setting the limit to avoid array out of bound error
            playTrack(songs[prevSong])                  //playing the next song in the global song array
        }
    }
    )

    //configuring the hamburger to open aside menu upon clicking
    document.getElementById("hamButton").addEventListener("click", () => {
        document.querySelector(".asideMenu").style.left = 0
    }
    )

    //configuring the close button to close the hamburger aside menu
    document.getElementById("closeButton").addEventListener("click", () => {
        document.querySelector(".asideMenu").style.left = -100 + `%`
    }
    )

    //configuring the hamburger to open top menu upon clicking
    document.querySelector(".menu").addEventListener("click", () => {
        document.querySelector(".hiddenMenu").style.display = "block"
    }
    )

    //configuring the close button to close the top menu
    document.getElementById("closeTopMenu").addEventListener("click", () => {
        document.querySelector(".hiddenMenu").style.display = "none"
    }
    )

    //configuring the volume button to show and hide volume range when clicked
    let volRange = document.getElementById("volumeRange")

    document.getElementById("volumeBtn").addEventListener("click", () => {
        volRange.classList.toggle("hideTheItem")
    }
    )

    //configuring the volume range to increase or decrease the music volume
    volRange.addEventListener("input", () => {
        const volumeValue = parseFloat(Math.round((volRange.value)) / 100).toFixed(1)
        CurrentSong.volume = volumeValue
    }
    )
})()