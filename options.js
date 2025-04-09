// options.js - Handles options page logic including max length

document.addEventListener('DOMContentLoaded', () => {
    // Get UI elements
    const voiceSelect = document.getElementById('voice');
    const rateInput = document.getElementById('rate');
    const rateValue = document.getElementById('rate-value');
    const pitchInput = document.getElementById('pitch');
    const pitchValue = document.getElementById('pitch-value');
    const volumeInput = document.getElementById('volume');
    const volumeValue = document.getElementById('volume-value');
    const maxLengthInput = document.getElementById('maxLength'); // New element
    const saveButton = document.getElementById('save');
    const statusDiv = document.getElementById('status');
    const testText = document.getElementById('test-text');
    const testSpeakButton = document.getElementById('test-speak');
    const testStopButton = document.getElementById('test-stop');
  
    // Set Rate slider max based on background constant (optional but good practice)
    rateInput.max = "3.0";
  
    // Load available voices
    loadVoices();
  
    // Load saved settings
    loadSettings();
  
    // Setup event listeners for sliders
    rateInput.addEventListener('input', () => rateValue.textContent = Number.parseFloat(rateInput.value).toFixed(1));
    pitchInput.addEventListener('input', () => pitchValue.textContent = Number.parseFloat(pitchInput.value).toFixed(1));
    volumeInput.addEventListener('input', () => volumeValue.textContent = Number.parseFloat(volumeInput.value).toFixed(1));
  
    // Save settings
    saveButton.addEventListener('click', saveSettings);
  
    // Test speech buttons
    testSpeakButton.addEventListener('click', testSpeech);
    testStopButton.addEventListener('click', stopSpeech);
  
    // --- Functions --- (rest of the functions: loadVoices, loadSettings, saveSettings, testSpeech, stopSpeech)
  
    function loadVoices() {
      chrome.runtime.sendMessage({ action: "getVoices" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error getting voices:", chrome.runtime.lastError.message);
          voiceSelect.innerHTML = '<option value="">Error loading</option>';
          return;
        }
  
        if (response && response.voices) {
          voiceSelect.innerHTML = ''; // Clear dropdown
          const defaultOption = document.createElement('option');
          defaultOption.value = '';
          defaultOption.textContent = 'Default System Voice';
          voiceSelect.appendChild(defaultOption);
  
          response.voices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.voiceName;
            option.textContent = `${voice.voiceName} (${voice.lang})`;
            if (!voice.localService) { // Note: Changed from voice.remote
              option.textContent += ' [Cloud]';
            }
            voiceSelect.appendChild(option);
          });
  
          // Set selected voice from storage *after* populating
          chrome.storage.sync.get('voiceName', (data) => {
             if (chrome.runtime.lastError) return;
             const savedVoiceExists = Array.from(voiceSelect.options).some(opt => opt.value === data.voiceName);
             if (data.voiceName && savedVoiceExists) {
                 voiceSelect.value = data.voiceName;
             } else if (data.voiceName) {
                 console.warn(`Saved voice "${data.voiceName}" not found. Using default.`);
                 voiceSelect.value = ''; // Fallback to default
             } else {
                  voiceSelect.value = ''; // Explicitly select default if "" or null
             }
          });
        } else if (response && response.error) {
             console.error("Error response getting voices:", response.error);
             voiceSelect.innerHTML = '<option value="">Error loading</option>';
        }
      });
    }
  
    function loadSettings() {
      chrome.storage.sync.get({ // Use defaults matching background
        voiceName: '',
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        maxTextLength: 0
      }, (settings) => {
         if (chrome.runtime.lastError) {
              console.error("Error loading settings:", chrome.runtime.lastError.message);
              return;
         }
        // Apply values to inputs
        // Voice selection is handled in loadVoices callback
  
        rateInput.value = settings.rate;
        rateValue.textContent = Number.parseFloat(settings.rate).toFixed(1);
  
        pitchInput.value = settings.pitch;
        pitchValue.textContent = Number.parseFloat(settings.pitch).toFixed(1);
  
        volumeInput.value = settings.volume;
        volumeValue.textContent = Number.parseFloat(settings.volume).toFixed(1);
  
        maxLengthInput.value = settings.maxTextLength; // Load max length
      });
    }
  
    function saveSettings() {
      const settingsToSave = {
        voiceName: voiceSelect.value || '', // Ensure empty string for default
        rate: Number.parseFloat(rateInput.value),
        pitch: Number.parseFloat(pitchInput.value),
        volume: Number.parseFloat(volumeInput.value),
        maxTextLength: Number.parseInt(maxLengthInput.value, 10) || 0 // Save max length, default to 0 if invalid
      };
  
       if (settingsToSave.maxTextLength < 0) {
           settingsToSave.maxTextLength = 0;
           maxLengthInput.value = 0; // Correct UI
       }
  
  
      chrome.storage.sync.set(settingsToSave, () => {
         if (chrome.runtime.lastError) {
              console.error("Error saving settings:", chrome.runtime.lastError.message);
              statusDiv.textContent = 'Error saving settings!';
              statusDiv.className = 'status error'; // Add an error class style if you want
              statusDiv.style.display = 'block';
         } else {
             console.log("Settings saved:", settingsToSave);
              statusDiv.textContent = 'Settings saved!';
              statusDiv.className = 'status success';
              statusDiv.style.display = 'block';
              setTimeout(() => { statusDiv.style.display = 'none'; }, 3000);
         }
      });
    }
  
    function testSpeech() {
      const text = testText.value.trim();
      if (!text) {
        testText.placeholder = 'Please enter some text to test';
        testText.focus();
        return;
      }
  
      chrome.tts.stop(); // Stop previous test speech
  
      const currentTestOptions = {
        voiceName: voiceSelect.value || undefined, // Use undefined for TTS default
        rate: Number.parseFloat(rateInput.value),
        pitch: Number.parseFloat(pitchInput.value),
        volume: Number.parseFloat(volumeInput.value),
         onEvent: (event) => { // Add basic event listening for test
              if (event.type === 'error') {
                   alert('Test Speech Error: ' + event.errorMessage);
              }
         }
      };
  
      console.log("Testing speech with options:", currentTestOptions);
      chrome.tts.speak(text, currentTestOptions, () => {
           if (chrome.runtime.lastError) {
               alert("Failed to initiate test speech: " + chrome.runtime.lastError.message);
           }
      });
    }
  
    function stopSpeech() {
      chrome.tts.stop();
      console.log("Test speech stopped.");
    }
  }); // <-- Make sure this closing bracket exists only ONCE at the end