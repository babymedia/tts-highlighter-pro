// content.js - Handles selection, indicator, truncation, and hotkeys

console.log("TTS Highlighter content script loaded");

// --- State & Constants ---
let indicatorElement = null;
const indicatorStyleId = 'tts-indicator-styles';
const INDICATOR_HIDE_DELAY = 300; // ms, slightly longer to match animation

// --- Style Injection (Improved with transition) ---
function ensureIndicatorStyle() {
    if (!document.getElementById(indicatorStyleId)) {
        const styleElement = document.createElement('style');
        styleElement.id = indicatorStyleId;
        // Using the nice V0-like styles from your example
        styleElement.textContent = `
            @keyframes ttsPulse {
              0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; }
            }
            #tts-speaking-indicator {
                position: fixed; bottom: 20px; right: 20px;
                background: linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8));
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                color: white;
                padding: 10px 18px;
                border-radius: 12px;
                font-family: 'Segoe UI', Arial, sans-serif;
                font-size: 14px;
                z-index: 2147483647;
                display: flex;
                align-items: center;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
                user-select: none;
                transition: opacity ${INDICATOR_HIDE_DELAY / 1000}s ease-in-out, transform ${INDICATOR_HIDE_DELAY / 1000}s ease-in-out;
                opacity: 1;
                transform: translateY(0);
                border: 1px solid rgba(255, 255, 255, 0.18);
            }
             #tts-speaking-indicator.tts-hiding {
                opacity: 0;
                transform: translateY(10px);
             }
            #tts-speaking-indicator .tts-icon {
                 margin-right: 10px;
                 display: inline-block;
                 animation: ttsPulse 1.2s infinite;
                 filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.7));
            }
             #tts-speaking-indicator .tts-text-content { /* Wrapper for text and rate */
                 display: flex;
                 align-items: center;
                 flex-grow: 1; /* Allow text content to take space */
             }
            #tts-speaking-indicator .tts-close {
                 margin-left: 14px;
                 cursor: pointer;
                 font-size: 20px;
                 line-height: 1;
                 font-weight: bold;
                 opacity: 0.8;
                 transition: all 0.2s;
                 width: 22px;
                 height: 22px;
                 display: flex;
                 align-items: center;
                 justify-content: center;
                 border-radius: 50%;
                 background: rgba(255, 255, 255, 0.15);
                 flex-shrink: 0; /* Prevent close button from shrinking */
            }
            #tts-speaking-indicator .tts-close:hover {
                opacity: 1;
                background: rgba(255, 255, 255, 0.25);
                transform: scale(1.1);
            }
            #tts-speaking-indicator .tts-rate {
                margin-left: 8px; /* Adjusted margin */
                font-size: 12px; /* Slightly smaller */
                opacity: 0.85;
                font-weight: 400; /* Normal weight */
                background: rgba(0, 0, 0, 0.2); /* Darker background for contrast */
                padding: 2px 6px; /* Adjusted padding */
                border-radius: 8px; /* Adjusted radius */
                white-space: nowrap; /* Prevent wrapping */
            }
          `;
        document.head.appendChild(styleElement);
    }
}

// --- Selection Listener ---
document.addEventListener("mouseup", (event) => {
    // Ensure it's the primary mouse button and only Ctrl is pressed
    if (event.button !== 0 || !event.ctrlKey || event.shiftKey || event.altKey) {
        return;
    }

    const selectedText = window.getSelection()?.toString(); // Use optional chaining

    if (selectedText && selectedText.trim().length > 0) {
        // Get max length setting before sending
        chrome.storage.sync.get({ maxTextLength: 0 }, (settings) => {
            if (chrome.runtime.lastError) {
                console.error("Error getting maxTextLength setting:", chrome.runtime.lastError);
                // Proceed without truncation if settings fail? Or stop? Let's proceed.
            }

            let textToSend = selectedText.trim();
            const maxLength = settings?.maxTextLength ?? 0; // Use nullish coalescing

            if (maxLength > 0 && textToSend.length > maxLength) {
                textToSend = textToSend.substring(0, maxLength).trim() + "..."; // Ellipsis indicates truncation
                console.log(`TTS Highlighter: Text truncated to ${maxLength} chars.`);
            }

            if (textToSend.length > 0) {
                showSpeakingIndicator(); // Show immediately, will update rate on 'started' response
                chrome.runtime.sendMessage(
                    { action: "speak", text: textToSend },
                    handleBackgroundResponse // Use a named handler
                );
            }
        });
    }
});

// --- Hotkey Listener (Rate Adjust & Stop) ---
document.addEventListener("keydown", (event) => {
    // Escape key to stop
    if (event.key === 'Escape') {
        if (indicatorElement) { // Only stop if indicator is visible
            event.preventDefault(); // Prevent other escape actions
            event.stopPropagation();
            console.log("TTS Highlighter: Escape pressed, stopping speech.");
            // Send stop message, UI hidden immediately
            chrome.runtime.sendMessage({ action: "stop" }, handleBackgroundResponse);
            hideSpeakingIndicator(true); // Hide indicator immediately on Esc
        }
    }
    // Ctrl + Arrow Up/Down for rate adjustment
    else if (event.ctrlKey && !event.shiftKey && !event.altKey && indicatorElement) { // Check Ctrl + active indicator
        let direction = null;
        if (event.key === 'ArrowUp') {
            direction = 'up';
        } else if (event.key === 'ArrowDown') {
            direction = 'down';
        }

        if (direction) {
            event.preventDefault(); // Prevent page scrolling
            event.stopPropagation();
            console.log(`TTS Highlighter: Adjusting rate ${direction}`);
            chrome.runtime.sendMessage(
                { action: "adjustRate", direction: direction },
                handleBackgroundResponse // Use the same handler
             );
        }
    }
});

// --- Indicator Management ---
function showSpeakingIndicator(rate = null) {
    ensureIndicatorStyle();
    // If indicator exists, just update rate, don't remove/recreate fully
    if (indicatorElement) {
         if (rate !== null) {
             updateRateIndicator(rate);
         }
        return;
    }

    indicatorElement = document.createElement('div');
    indicatorElement.id = 'tts-speaking-indicator';

    const iconSpan = document.createElement('span');
    iconSpan.innerHTML = ''; // Speaker icon
    iconSpan.className = 'tts-icon';

    const textContentDiv = document.createElement('div'); // Wrapper
    textContentDiv.className = 'tts-text-content';

    const textSpan = document.createElement('span');
    textSpan.textContent = 'Speaking'; // Keep it concise

    const rateSpan = document.createElement('span');
    rateSpan.className = 'tts-rate';
    rateSpan.textContent = rate ? `(${rate.toFixed(1)}x)` : ''; // Show initial rate if provided

    textContentDiv.appendChild(textSpan);
    textContentDiv.appendChild(rateSpan);

    const closeButton = document.createElement('span');
    closeButton.innerHTML = '×';
    closeButton.className = 'tts-close';
    closeButton.title = "Stop Speech (Esc)";
    closeButton.onclick = (e) => {
        e.stopPropagation(); // Prevent other click listeners
        chrome.runtime.sendMessage({ action: "stop" }, handleBackgroundResponse);
        hideSpeakingIndicator(true); // Hide immediately on click
    };

    indicatorElement.appendChild(iconSpan);
    indicatorElement.appendChild(textContentDiv); // Append wrapper
    indicatorElement.appendChild(closeButton);

    // Check if body exists before appending (important for early page loads)
    if (document.body) {
         document.body.appendChild(indicatorElement);
    } else {
        // Fallback: append later when body is ready
        document.addEventListener('DOMContentLoaded', () => {
             if (document.body && !indicatorElement.parentNode) { // Check if appended already
                 document.body.appendChild(indicatorElement);
             }
         });
    }
}

// Store the timeout ID so we can clear it if needed
let hideIndicatorTimeoutId = null;

function hideSpeakingIndicator(immediate = false) {
    // Clear any pending hide timeout
    if (hideIndicatorTimeoutId) {
        clearTimeout(hideIndicatorTimeoutId);
        hideIndicatorTimeoutId = null;
    }

    if (indicatorElement) {
        const elementToRemove = indicatorElement; // Reference for the timeout
        if (immediate) {
             if (elementToRemove.parentNode) {
                 elementToRemove.parentNode.removeChild(elementToRemove);
             }
             if (indicatorElement === elementToRemove) indicatorElement = null; // Clear global ref only if it matches
        } else {
            // Fade out then remove
            elementToRemove.classList.add('tts-hiding');
            hideIndicatorTimeoutId = setTimeout(() => {
                if (elementToRemove.parentNode) {
                    elementToRemove.parentNode.removeChild(elementToRemove);
                }
                 // Clear global ref only if it matches the element we intended to remove
                if (indicatorElement === elementToRemove) indicatorElement = null;
                hideIndicatorTimeoutId = null; // Clear timeout ID
            }, INDICATOR_HIDE_DELAY); // Match CSS transition time
        }
    }
}

// --- Handle Responses from Background ---
function handleBackgroundResponse(response) {
     // Don't process if lastError occurred
     if (chrome.runtime.lastError) {
        // Log error, but don't hide indicator based on this alone, background state is key
        console.error("TTS Background runtime.lastError:", chrome.runtime.lastError.message);
        // We might still get a valid response object even with lastError in some cases,
        // so we check the response status below too.
        // If response is undefined AND lastError exists, then hide.
        if (!response) {
            hideSpeakingIndicator();
            return;
        }
    }

    if (!response) {
        console.warn("Received empty or invalid response from background.");
        // Potentially hide indicator if we expected a response but got none? Risky.
        return;
    }

    console.log("Response from background:", response.status, response);

    // Ensure indicator exists for updates, but don't create it here
    if (!indicatorElement && ['adjusted', 'limit_reached'].includes(response.status)) {
         console.log("Indicator not present, ignoring rate update response.");
         return;
     }

    switch (response.status) {
        case "started":
            // Show indicator (if not already shown) and update with initial rate
            showSpeakingIndicator(response.initialRate);
            break;
        // Note: "completed" is not reliably sent from background 'end' event
        case "stopped":
        case "error": // Also hide indicator on background-reported errors
            if (response.status === "error") {
                console.error("TTS Playback Error from BG:", response.message);
            }
            hideSpeakingIndicator(); // Use fade-out unless explicitly stopped
            break;
        case "adjusted":
             if (response.newRate !== undefined) {
                 updateRateIndicator(response.newRate);
             }
            break;
        case "limit_reached":
             if (response.newRate !== undefined) {
                 updateRateIndicator(response.newRate, true); // Add 'limit' flag
             }
             break;
        case "inactive": // Rate adjust attempted when not speaking
            console.log("Rate adjust ignored, not speaking.");
            // Don't hide indicator - it shouldn't be visible anyway
            break;
         case "stopped_before_restart":
             console.log("Speech stopped before rate adjust restart.");
             // Stop action should have already hidden indicator
             hideSpeakingIndicator();
             break;
         // Add default case?
    }
}

function updateRateIndicator(rate, atLimit = false) {
     if (indicatorElement) {
        const rateSpan = indicatorElement.querySelector('.tts-rate');
        if (rateSpan) {
            rateSpan.textContent = `(${rate.toFixed(1)}x)`;
            if (atLimit) {
                 // Simple visual feedback for limit
                 rateSpan.style.transition = 'none'; // Disable transition for quick flash
                 rateSpan.style.opacity = '1';
                 rateSpan.style.transform = 'scale(1.1)';
                 setTimeout(() => {
                      if (rateSpan) { // Check if still exists
                           rateSpan.style.transition = 'opacity 0.2s, transform 0.2s'; // Re-enable
                           rateSpan.style.opacity = '0.85';
                           rateSpan.style.transform = 'scale(1)';
                      }
                 }, 250); // Duration of the flash effect
            }
        }
    }
}


// --- Listener for External Stop Commands (e.g., from popup) ---
// This might be redundant if the popup directly calls background's 'stop'
// Keeping it allows potential future flexibility
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "stopSpeech") { // Match potential future popup action
        console.log("TTS Highlighter Content: Received stop command via message.");
        if (indicatorElement) {
            hideSpeakingIndicator(true); // Hide immediately on external command
        }
        // Acknowledge receipt if needed
        try { sendResponse({status: "stopped_ack"}); } catch(e){}
        return false; // Not async
    }
});