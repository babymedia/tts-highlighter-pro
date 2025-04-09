// popup.js - Handles popup buttons

const optionsButton = document.getElementById('open-options');
const stopButton = document.getElementById('stop-speech-button');

optionsButton.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
}); // Added missing closing parenthesis

stopButton.addEventListener('click', () => { // Corrected arrow function syntax
  console.log("Popup: Sending stop command.");
  stopButton.textContent = "Stopping...";
  stopButton.disabled = true;

  chrome.runtime.sendMessage({ action: "stop" }, (response) => {
    // Reset button after a short delay, regardless of response
    setTimeout(() => {
        stopButton.textContent = "Stop Current Speech";
        stopButton.disabled = false;
        if (chrome.runtime.lastError) {
             console.error("Error sending stop message:", chrome.runtime.lastError.message);
        } else {
             console.log("Stop command acknowledged by background:", response);
        }
    }, 300); // Added duration (e.g., 300ms) and closing })
  });
}); // Added missing closing parenthesis for listener