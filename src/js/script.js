import { API, uploadAPI, MAX_TITLE_LENGTH, MAX_ARTIST_LENGTH } from "./constants.js";

//Elementos del DOM
document.addEventListener("DOMContentLoaded", () => {

    //Buttons and sliders for controlling the music player
    const filterButton = document.getElementById("filter-button");
    const filterDropdown = document.getElementById("filter-dropdown");
    const songsList = document.querySelector(".song-list ul");
    const playPauseButton = document.getElementById("play-button-header");
    const playPausePlayerButton = document.getElementById("play-button");
    const volumeBar = document.querySelector(".volume-slider");
    const prevSongButton = document.querySelector("#prev-button");
    const nextSongButton = document.querySelector("#next-button");
    const coverImage = document.querySelector("#lower-sidebar img");
    const songTitle = document.querySelector(".current-title");
    const songArtist = document.querySelector(".current-artist");
    const loopButton = document.getElementById("loop-button");
    const randomButton = document.getElementById("random-button");
    const progressSlider = document.querySelector(".progress-slider");
    const currentTimeDisplay = document.querySelector(".current-time");
    const totalTimeDisplay = document.querySelector(".total-time");
    const volumeIcon = document.getElementById("volume-icon");
    const playButtonImage = document.querySelector("#play-button img");

    //Modal and upload form elements
    const uploadModal = document.getElementById("uploadModal");
    const addButton = document.querySelector(".add-button");
    const closeModal = document.getElementById("closeModal");
    const uploadForm = document.getElementById("uploadForm");
    const filenameInput = document.getElementById("filename");
    const songTitleInput = document.getElementById("title");
    const songArtistInput = document.getElementById("artist");
    const coverImageInput = document.getElementById("cover");
    const submitSongButton = document.getElementById("submitSong");

    const lettersAndSpacesPattern = /^[A-Za-z\s]+$/;

    let songs = []; //Array to store song data
    let favoriteSongs = JSON.parse(localStorage.getItem("favorites")) || []; //Obtain favorite songs from local storage
    let currentSongIndex = 0;   //Index to track the current song being played
    let audio = new Audio();

    let nextSong = false; //Indicator to play the next song from the start

    // Toggle the play/pause button image
    const toggleButtonImage = (imgElement, img1, img2) => {
        const currentSrc = imgElement.src;

        // If the current image is img1, change it to img2
        if (currentSrc.includes(img1) && !currentSrc.includes(img2)) {
            imgElement.src = imgElement.src.replace(img1, img2);
        }
        // And vice versa
        else if (currentSrc.includes(img2) && !currentSrc.includes(img1)) {
            imgElement.src = imgElement.src.replace(img2, img1);
        }
    };

    //Initialize favorite buttons by adding event listeners
    const initializeFavoriteButtons = () => {
        const favoriteButtons = document.querySelectorAll(".favorite-button img");

        favoriteButtons.forEach((buttonIcon) => {
            buttonIcon.addEventListener("click", (event) => {
                event.stopPropagation(); // Prevent event from being active in parent container

                //Get the song ID from the parent element (li)
                const songId = event.target.closest(".song").dataset.id;

                //Call the apropiate method to update the favorite songs state
                toggleFavorite(songId);
            });
        });
    };

    //Event listeners for loop and random buttons
    loopButton.addEventListener("click", () => {
        //Check if random button is not active
        if (!randomButton.querySelector("img").src.includes("green-r.png")) {
            //If random is not active, allow toggle loop button state
            toggleButtonImage(loopButton.querySelector("img"), "loop.png", "green-l.png");
        }
    });

    randomButton.addEventListener("click", () => {
        //Check if loop button is not active
        if (!loopButton.querySelector("img").src.includes("green-l.png")) {
            //If loop is not active, allow toggle random button state
            toggleButtonImage(randomButton.querySelector("img"), "random.png", "green-r.png");
        }
    });

    //Fetch songs from API and render them
    async function fetchSongs() {
        try {
            const response = await fetch(API);
            songs = await response.json();
            renderSongs();
        } catch (error) {
            console.error("Error al obtener las canciones", error);
        }
    }

    //Render songs into the list
    function renderSongs() {
        songsList.innerHTML = ""; //Clear the list before rendering

        songs.forEach((song, index) => {
            const isFavorite = favoriteSongs.includes(song.id.toString());

            const songElement = document.createElement("li");
            songElement.classList.add("song");
            songElement.dataset.id = song.id;
            songElement.innerHTML = `
                <button class="song-play-button">
                    <img src="./src/imgs/green-play-button.png" alt="Play">
                </button>
                <span class="song-title">${song.title}</span>
                <span class="song-artist">${song.artist}</span>
                <span class="song-duration">${song.duration}</span>
                <button class="favorite-button">
                    <img src="src/imgs/${isFavorite ? "fav.png" : "not-fav.png"}" alt="Favorite">
                </button>
            `;

            //Add event listener to play song on click
            songElement.addEventListener("click", (e) => {
                if (!e.target.classList.contains("favorite-button")) {
                    playSong(index);
                }
            });

            songsList.appendChild(songElement);
        });

        //Initialize events for favorite buttons
        initializeFavoriteButtons();
    }

    //Play the selected song
    function playSong(index, nextSong = false) {
        const song = songs[index];
        currentSongIndex = index;

        if (!song.filepath) {
            return; //Do not try to play if there's no valid URL
        }

        //Set the audio source
        audio.src = song.filepath;

        //Display song title, artist, and cover
        songTitle.textContent = song.title;
        songArtist.textContent = song.artist;
        coverImage.src = song.cover;

        if (nextSong) {
            audio.currentTime = 0; //Reset song to the beginning if it's a next song
        }

        audio.addEventListener("loadedmetadata", () => {
            totalTimeDisplay.textContent = formatTime(audio.duration); //Display the total duration
            audio.play();
            updatePlayPauseButton("Pause"); //Update play/pause button text and the player play/pause button
        });

        //This event listener ensures the song starts from the beginning when the next song is selected
        audio.addEventListener("play", () => {
            if (nextSong) {
                audio.currentTime = 0; //Reset the song to start from 0
                nextSong = false; //Reset nextSong flag
            }
        });
    }

    //Toggle the favorite state of a song
    function toggleFavorite(songId) {
        if (favoriteSongs.includes(songId.toString())) {
            //Remove from favorites if it is already there
            favoriteSongs = favoriteSongs.filter(id => id !== songId.toString());
        } else {
            //Add to favorites if it is not
            favoriteSongs.push(songId.toString());
        }

        //Save updated favorites in LocalStorage
        localStorage.setItem("favorites", JSON.stringify(favoriteSongs));

        //Re-render the songs to update favorite icons
        renderSongs();
    }

    //Display all songs in the list
    function showAllSongs() {
        const allSongs = document.querySelectorAll(".song");
        allSongs.forEach(song => (song.style.display = "flex"));
    }

    //Display only favorite songs in the list
    function showFavoriteSongs() {
        const allSongs = document.querySelectorAll(".song");

        allSongs.forEach(song => {
            const isFavorite = favoriteSongs.includes(song.dataset.id);
            song.style.display = isFavorite ? "flex" : "none";
        });
    }

    //Toggle the visibility of the filter dropdown
    filterButton.addEventListener("click", () => {
        filterDropdown.classList.toggle("hidden");
    });

    //Filter songs based on selection from dropdown
    filterDropdown.addEventListener("click", (e) => {
        const filterType = e.target.dataset.filter;

        if (filterType === "all") {
            showAllSongs();
        } else if (filterType === "favorites") {
            showFavoriteSongs();
        }

        filterDropdown.classList.add("hidden");
    });

    //Update the volume icon based on the current volume level
    function updateVolumeIcon() {
        const volume = audio.volume * 100; //Get the volume as a percentage

        if (volume === 0) {
            volumeIcon.src = "./src/imgs/volume-muted.png"; //Mute icon
        } else if (volume > 0 && volume <= 50) {
            volumeIcon.src = "./src/imgs/volume-low.png"; //Low volume icon
        } else if (volume > 50 && volume <= 100) {
            volumeIcon.src = "./src/imgs/volume-high.png"; //High volume icon
        }
    }

    //Initialize audio volume slider
    volumeBar.addEventListener("input", () => {
        audio.volume = volumeBar.value / 100;
        updateVolumeIcon(); //Update the volume icon based on the volume level
    });

    //Event listener for when the audio file has loaded
    audio.addEventListener("loadeddata", () => {
        //Set the volume to 50% when the audio file is loaded
        audio.volume = 0.5;

        //Set the volume slider's value to 50%
        volumeBar.value = 50;

        //Update the volume icon to reflect the current volume
        updateVolumeIcon();
    });

    //Toggle play/pause functionality
    function togglePlay() {
        if (audio.paused) {
            //If the audio is paused, play the song
            audio.play();
            updatePlayPauseButton("Pause"); //Update the play/pause buttons appearance
        } else {
            //If the audio is playing, pause the song
            audio.pause();
            updatePlayPauseButton("Play");
        }
    }

    //Event listener to update progress bar and time display while the song is playing
    audio.addEventListener("timeupdate", () => {
        if (audio.duration) {
            //Calculate the percentage of the song played
            const progressPercentage = (audio.currentTime / audio.duration) * 100;
            progressSlider.value = progressPercentage;

            //Update the current time and total duration time display
            currentTimeDisplay.textContent = formatTime(audio.currentTime);
            totalTimeDisplay.textContent = formatTime(audio.duration);
        }
    });

    //Function to format seconds into minutes:seconds format
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
    }

    //Event listener to allow users to change the song's progress manually
    progressSlider.addEventListener("input", () => {
        if (audio.duration) {
            //Calculate the new time based on the slider value and update the song's current time
            const newTime = (progressSlider.value / 100) * audio.duration;
            audio.currentTime = newTime;
        }
    });

    //Event listener to switch to the next song after the current song ends
    audio.addEventListener("ended", () => {
        if (loopButton.querySelector("img").src.includes("green-l.png")) {
            //If loop mode is active, replay the same song
            playSong(currentSongIndex);
        } else if (randomButton.querySelector("img").src.includes("green-r.png")) {
            //If random mode is active, play a random song
            const randomIndex = Math.floor(Math.random() * songs.length);
            playSong(randomIndex);
        } else {
            //If no modes are active (not loop nor random), move to the next song in the list
            currentSongIndex = (currentSongIndex + 1) % songs.length;
            playSong(currentSongIndex);
        }
    });

    //Function to update the play/pause button's text and icon
    function updatePlayPauseButton(text) {
        //Update the header button text
        playPauseButton.textContent = text;

        //Check if loop mode is active before changing the button icon
        const loopButtonActive = loopButton.querySelector("img").src.includes("green-l.png");

        //If loop mode is active, don't change the icon
        if (loopButtonActive) return;

        //If audio is paused, show the play icon
        if (audio.paused) {
            playButtonImage.src = "./src/imgs/play2.png";
        } else {
            //If audio is playing, show the pause icon
            playButtonImage.src = "./src/imgs/pause.png";
        }
    }

    //Event listeners for play/pause button clicks
    playPauseButton.addEventListener("click", togglePlay);
    playPausePlayerButton.addEventListener("click", togglePlay);

    //Next song button functionality
    nextSongButton.addEventListener("click", () => {
        //Get the next song in the list and play it
        currentSongIndex = (currentSongIndex + 1) % songs.length;
        nextSong = true; //Indicator for the next song (necessary for loop event)
        playSong(currentSongIndex);
    });

    //Previous song button functionality
    prevSongButton.addEventListener("click", () => {
        // Get the previous song in the list and play it
        currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
        playSong(currentSongIndex);
    });

    //Function to show the upload modal
    function showUploadModal() {
        uploadModal.style.display = "flex";
    }

    //Function to close the upload modal
    function closeUploadModal() {
        uploadModal.style.display = "none";

        //Clear the form fields
        filenameInput.value = "";
        songTitleInput.value = "";
        songArtistInput.value = "";
        coverImageInput.value = "";

        //Hide error messages
        document.getElementById("audioError").style.display = "none";
        document.getElementById("titleError").style.display = "none";
        document.getElementById("artistError").style.display = "none";
    }

    //Event listeners for opening and closing the modal
    addButton.addEventListener("click", showUploadModal);
    closeModal.addEventListener("click", closeUploadModal);
    //Close the modal when clicking out of it
    uploadModal.addEventListener("click", (e) => {
        if (e.target === uploadModal) {
            closeUploadModal();
        }
    });

    //Function to validate input fields
    const validateField = (input, errorElement, maxLength, pattern) => {
        const value = input.value.trim();

        //Display errors
        if (!value) {
            errorElement.textContent = `This field is required.`;
            errorElement.style.display = "block";
        } else if (value.length > maxLength) {
            errorElement.textContent = `The field cannot have more than ${maxLength} characters.`;
            errorElement.style.display = "block";
        } else if (!pattern.test(value)) {
            errorElement.textContent = `Only letters and spaces are allowed.`;
            errorElement.style.display = "block";
        } else {
            //Hide error if input is valid
            errorElement.style.display = "none";
        }
    };

    // Event listener for file input (audio file) to validate the file type
    filenameInput.addEventListener("input", () => {
        if (!filenameInput.files.length || (filenameInput.files[0].type !== "audio/mp3" && filenameInput.files[0].type !== "audio/mpeg")) {
            // Show error if the file is not an MP3            
            document.getElementById("audioError").textContent = "The file must be an mp3.";
            document.getElementById("audioError").style.display = "block";
        } else {
            document.getElementById("audioError").style.display = "none";
        }
    });

    // Event listeners for input fields (song title and artist) to validate input
    songTitleInput.addEventListener("input", () => {
        validateField(songTitleInput, document.getElementById("titleError"), MAX_TITLE_LENGTH, lettersAndSpacesPattern);
    });

    songArtistInput.addEventListener("input", () => {
        validateField(songArtistInput, document.getElementById("artistError"), MAX_ARTIST_LENGTH, lettersAndSpacesPattern);
    });

    //Event listener for cover image input to validate the file type (PNG or JPG)
    coverImageInput.addEventListener("input", () => {
        if (
            !coverImageInput.files.length ||
            (coverImageInput.files[0].type !== "image/png" && coverImageInput.files[0].type !== "image/jpeg")
        ) {
            document.getElementById("imageError").textContent = "The file must be a PNG or JPG image.";
            document.getElementById("imageError").style.display = "block";
        } else {

            document.getElementById("imageError").style.display = "none";
        }
    });

    // Event listener for form submission to validate all fields
    submitSongButton.addEventListener("click", async (e) => {
        e.preventDefault(); //Prevent form submission

        let isValid = true; //Flag to check if all fields are valid

        // Validate title, artist, audio file, and cover image. If any field is invalid, set isValid to false
        if (!songTitleInput.value || songTitleInput.value.length > MAX_TITLE_LENGTH || !lettersAndSpacesPattern.test(songTitleInput.value)) {
            validateField(songTitleInput, document.getElementById("titleError"), MAX_TITLE_LENGTH, lettersAndSpacesPattern);
            isValid = false;
        }

        if (!songArtistInput.value || songArtistInput.value.length > MAX_ARTIST_LENGTH || !lettersAndSpacesPattern.test(songArtistInput.value)) {
            validateField(songArtistInput, document.getElementById("artistError"), MAX_ARTIST_LENGTH, lettersAndSpacesPattern);
            isValid = false;
        }

        if (!filenameInput.files.length ||
            (filenameInput.files[0].type !== "audio/mp3" && filenameInput.files[0].type !== "audio/mpeg")) {
            document.getElementById("audioError").textContent = "The file must be an mp3.";
            document.getElementById("audioError").style.display = "block";
            isValid = false;
        } else {
            document.getElementById("audioError").style.display = "none";
        }

        if (!coverImageInput.files.length) {
            imageError.textContent = "You must upload a cover image.";
            imageError.style.display = "block";
            isValid = false;
        } else if (
            coverImageInput.files[0].type !== "image/png" &&
            coverImageInput.files[0].type !== "image/jpeg"
        ) {
            imageError.textContent = "The file must be a PNG or JPG image.";
            imageError.style.display = "block";
            isValid = false;
        } else {
            imageError.style.display = "none";
        }

        //If all fields are valid, submit the form data
        if (isValid) {
            const formData = new FormData(uploadForm);
            // Append form data
            let titleSong = songTitleInput.value;
            let artistSong = songArtistInput.value;
            let song = filenameInput.files[0];
            let coverSong = coverImageInput.files[0];

            formData.append("title", titleSong);
            formData.append("artist", artistSong);
            formData.append("filename", song);
            formData.append("cover", coverSong);

            try {
                //Send form data via fetch API to the server
                const response = await fetch(uploadAPI, {
                    method: "POST",
                    body: formData
                });

                if (response.ok) {
                    //If successful, show success message, refresh the songs list and close the modal
                    alert("Song uploaded successfully");
                    fetchSongs(); //Reload songs to include the newly uploaded song
                    closeUploadModal(); //Close the upload modal
                } else {
                    alert("Error uploading song. Please try again.");
                }
            } catch (error) {
                alert("There was a problem submitting the song. Please try again.");
            }
        }
    });

    //Load songs at the start
    fetchSongs();
});