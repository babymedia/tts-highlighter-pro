// background.js - Handles TTS, rate adjustments, and state

// --- Constants ---
const DEFAULT_SETTINGS = {
    voiceName: "",
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    maxTextLength: 0 // 0 means unlimited
};

const MIN_RATE = 0.5;
const MAX_RATE = 3.0; // Increased max slightly
const RATE_STEP = 0.1;

// --- State for current speech ---
let currentSpeechParams = null; // { text: string, options: object }

// --- Initialization ---
chrome.runtime.onInstalled.addListener(() => {
    console.log("Enhanced TTS Highlighter Pro installed");
    chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
        // Ensure all keys exist in storage with default or existing values
        const settingsToSet = {};
        for (const key in DEFAULT_SETTINGS) {
            settingsToSet[key] = settings.hasOwnProperty(key) ? settings[key] : DEFAULT_SETTINGS[key];
        }
        chrome.storage.sync.set(settingsToSet, () => {
            if (chrome.runtime.lastError) {
                console.error("Error setting initial settings:", chrome.runtime.lastError);
            } else {
                console.log("Initial settings ensured:", settingsToSet);
            }
        });
    });
});

// --- Message Listener ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Background received action:", request.action); // Log every action

    switch (request.action) {
        case "speak":
            handleSpeakAction(request, sendResponse);
            return true; // Indicates async response

        case "getVoices":
            handleGetVoicesAction(sendResponse);
            return true; // Indicates async response

        case "stop":
            handleStopAction(sendResponse);
            // Sync response is fine here, but trySendResponse handles context safety
            break;

        case "adjustRate":
            handleAdjustRateAction(request.direction, sendResponse);
            return true; // Indicates async response

        default:
            console.warn("Unknown action received:", request.action);
            // Optional: trySendResponse(sendResponse, { status: "error", message: "Unknown action" });
            break;
    }
    // Return false or nothing if not handled asynchronously above
    return false;
});

// --- Action Handlers ---

function handleSpeakAction(request, sendResponse) {
    if (!request.text) {
        console.error("Speak action received without text.");
        trySendResponse(sendResponse, { status: "error", message: "No text provided" });
        return;
    }
    console.log("TTS Highlighter: Speaking text:", request.text.substring(0, 70) + "...");

    // Stop any previous speech *before* getting settings for the new one
    chrome.tts.stop();
    currentSpeechParams = null; // Clear previous state immediately

    chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
        if (chrome.runtime.lastError) {
            console.error("Error getting settings for speak:", chrome.runtime.lastError);
            currentSpeechParams = null; // Clear state
            trySendResponse(sendResponse, { status: "error", message: "Failed to get settings" });
            return;
        }

        const ttsOptions = {
            voiceName: settings.voiceName || undefined, // Use TTS default if empty/null
            rate: Number.parseFloat(settings.rate) || DEFAULT_SETTINGS.rate,
            pitch: Number.parseFloat(settings.pitch) || DEFAULT_SETTINGS.pitch,
            volume: Number.parseFloat(settings.volume) || DEFAULT_SETTINGS.volume,
            onEvent: function(event) {
                // Event handling should primarily update state, responses are unreliable after first
                if (event.type === 'start') {
                    console.log("TTS Event: Start");
                    // Initial response is sent below after speak call succeeds
                } else if (event.type === 'end') {
                    console.log("TTS Event: End");
                    currentSpeechParams = null; // Clear state on completion
                } else if (event.type === 'interrupted' || event.type === 'cancelled') {
                     console.log("TTS Event:", event.type);
                     currentSpeechParams = null; // Clear state if stopped externally
                } else if (event.type === 'error') {
                    console.error('TTS Event: Error -', event.errorMessage);
                    currentSpeechParams = null; // Clear state on error
                }
            }
        };

        // Store parameters for potential rate adjustment *before* speaking
        currentSpeechParams = {
            text: request.text,
            options: { ...ttsOptions } // Store a copy of the options
        };

        console.log("Calling tts.speak with options:", currentSpeechParams.options);
        chrome.tts.speak(request.text, ttsOptions, () => {
            if (chrome.runtime.lastError) {
                console.error("Error initiating tts.speak:", chrome.runtime.lastError.message);
                currentSpeechParams = null; // Clear state on initiation error
                trySendResponse(sendResponse, { status: "error", message: "Failed to start speech: " + chrome.runtime.lastError.message });
            } else {
                 console.log("tts.speak call initiated successfully.");
                 // Send the 'started' response now that we know it was queued
                 trySendResponse(sendResponse, { status: "started", initialRate: ttsOptions.rate });
            }
        });
    });
}

function handleGetVoicesAction(sendResponse) {
    chrome.tts.getVoices((voices) => {
        if (chrome.runtime.lastError) {
            console.error("Error getting voices:", chrome.runtime.lastError.message);
            trySendResponse(sendResponse, { error: chrome.runtime.lastError.message });
        } else {
            trySendResponse(sendResponse, { voices: voices || [] }); // Ensure it's an array
        }
    });
}

function handleStopAction(sendResponse) {
    console.log("TTS Highlighter BG: Received stop command.");
    chrome.tts.stop();
    currentSpeechParams = null; // Clear speech state
    trySendResponse(sendResponse, { status: "stopped" });
}

function handleAdjustRateAction(direction, sendResponse) {
    if (!currentSpeechParams) {
        console.log("Adjust rate: No active speech.");
        trySendResponse(sendResponse, { status: "inactive" });
        return; // Nothing to adjust
    }

    // Ensure rate is a number, falling back to default if necessary
    let currentRate = Number.parseFloat(currentSpeechParams.options.rate);
    if (isNaN(currentRate)) {
        currentRate = DEFAULT_SETTINGS.rate;
    }

    let newRate;

    if (direction === 'up') {
        newRate = Math.min(MAX_RATE, currentRate + RATE_STEP);
    } else if (direction === 'down') {
        newRate = Math.max(MIN_RATE, currentRate - RATE_STEP);
    } else {
        console.warn("Invalid direction for adjustRate:", direction);
        trySendResponse(sendResponse, { status: "error", message: "Invalid direction" });
        return;
    }

    newRate = Number.parseFloat(newRate.toFixed(1)); // Format to one decimal place

    if (newRate === currentRate) {
        console.log("Adjust rate: Rate already at limit.", newRate);
        trySendResponse(sendResponse, { status: "limit_reached", newRate: newRate });
        return; // No change needed
    }

    console.log(`Adjust rate: Changing from ${currentRate} to ${newRate}`);
    currentSpeechParams.options.rate = newRate; // Update the stored rate in our state

    // Stop current speech and immediately restart with the new rate
    chrome.tts.stop(); // This will trigger an 'interrupted' or 'cancelled' event

    // Need a slight delay for stop to process before starting again
    setTimeout(() => {
        // Re-check if speech wasn't stopped by something else in the meantime
        if (currentSpeechParams && currentSpeechParams.options.rate === newRate) {
             console.log("Restarting speech with new rate:", newRate);
             // Clone options again, ensures clean state for the new speak call.
             const restartOptions = { ...currentSpeechParams.options };

             chrome.tts.speak(currentSpeechParams.text, restartOptions, () => {
                 if (chrome.runtime.lastError) {
                     console.error("Error restarting speech after rate adjust:", chrome.runtime.lastError.message);
                     currentSpeechParams = null; // Clear state on error
                     trySendResponse(sendResponse, { status: "error", message: "Restart failed: " + chrome.runtime.lastError.message });
                 } else {
                      console.log("Speech restarted successfully with new rate.");
                      // Send confirmation AFTER restart is successful
                      trySendResponse(sendResponse, { status: "adjusted", newRate: newRate });
                 }
             });
        } else {
             console.log("Adjust rate: Speech was stopped before restart could occur or rate changed again.");
             // Don't send response here, let the stop action handle it if applicable
        }
    }, 50); // 50ms delay - adjust if needed
}

// Helper to safely send responses - use this everywhere
function trySendResponse(sendResponse, responseData) {
    try {
        // Check if sendResponse is still a function (context might be closed)
        if (typeof sendResponse === 'function') {
            sendResponse(responseData);
        } else {
             console.log("sendResponse is no longer valid (context likely closed). Response not sent:", responseData);
        }
    } catch (e) {
        // Catch potential errors if the context closes right as we check/call
        console.warn("Failed to send response (context likely closed):", e.message);
    }
}