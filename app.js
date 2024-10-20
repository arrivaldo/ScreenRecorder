const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const pauseResumeBtn = document.getElementById('pauseResumeBtn');
const audioCheckbox = document.getElementById('audioCheckbox');
const videoPreviewContainer = document.getElementById('videoPreviewContainer');
const timerDisplay = document.getElementById('timer');
let mediaRecorder;
let startTime;
let timerInterval;
let elapsedPauseTime = 0; // Track the total time spent paused
let isPaused = false;
let mediaStream;  // Store media stream for later stopping
let isRecording = false; // Track whether recording is active

// Function to start the recording process
async function startRecording() {
    mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 } },
        audio: audioCheckbox.checked ? true : false
    });

    mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: 'video/webm;codecs=vp8,opus'
    });

    mediaRecorder.start();
    startBtn.disabled = true;
    stopBtn.disabled = false;
    pauseResumeBtn.disabled = false;
    startTimer();  // Start timer display
    pauseResumeBtn.textContent = "Pause";
    isRecording = true;

    // Stop recording when video track ends
    const [videoTrack] = mediaStream.getVideoTracks();
    videoTrack.addEventListener('ended', stopRecording);

    // Data available event to handle saving the recorded video
    mediaRecorder.addEventListener('dataavailable', (e) => {
        const fileName = prompt('Enter the file name:', 'capture') || 'capture';
        const link = document.createElement("a");
        link.href = URL.createObjectURL(e.data);
        link.download = `${fileName}.webm`;
        link.click();

        // Display the video preview
        const videoPreview = document.createElement('video');
        videoPreview.src = URL.createObjectURL(e.data);
        videoPreview.controls = true;
        videoPreviewContainer.innerHTML = ''; // Clear previous preview
        videoPreviewContainer.appendChild(videoPreview);
    });
}

// Function to stop the recording
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        stopAllTracks(mediaStream);  // Stop all media tracks
        startBtn.disabled = false;
        stopBtn.disabled = true;
        pauseResumeBtn.disabled = true;
        resetTimer();
        pauseResumeBtn.textContent = "Pause";  // Reset button text
        isPaused = false;  // Reset pause state
        elapsedPauseTime = 0; // Reset pause time when stopped
        isRecording = false;
    }
}

// Function to stop all media tracks
function stopAllTracks(stream) {
    stream.getTracks().forEach(track => track.stop());
}

// Function to toggle pause/resume state
function togglePauseResume() {
    if (mediaRecorder.state === 'recording') {
        mediaRecorder.pause();
        pauseResumeBtn.textContent = "Resume";
        isPaused = true;
        clearInterval(timerInterval);  // Pause the timer
        elapsedPauseTime += Date.now() - startTime;  // Calculate total paused time
    } else if (mediaRecorder.state === 'paused') {
        mediaRecorder.resume();
        pauseResumeBtn.textContent = "Pause";
        isPaused = false;

        // Calculate the adjusted start time considering the paused duration
        startTime = Date.now() - elapsedPauseTime;  
        startTimer();  // Resume the timer
    }
}

// Function to get the elapsed time
function getElapsedTime() {
    return Date.now() - startTime;
}

// Function to start the timer display
function startTimer() {
    startTime = Date.now() - elapsedPauseTime; // Initialize start time with elapsed paused time
    timerInterval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const minutes = Math.floor(elapsedTime / 60000);
        const seconds = Math.floor((elapsedTime % 60000) / 1000);
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

// Function to reset the timer display
function resetTimer() {
    clearInterval(timerInterval);
    timerDisplay.textContent = "00:00";
}

// Start button click event
startBtn.addEventListener('click', startRecording);

// Stop button click event
stopBtn.addEventListener('click', stopRecording);

// Pause/Resume button click event
pauseResumeBtn.addEventListener('click', togglePauseResume);

// Keyboard shortcut event for starting/stopping recording
document.addEventListener('keydown', (event) => {
    if (event.altKey && event.shiftKey && event.code === 'KeyS') {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }
});
