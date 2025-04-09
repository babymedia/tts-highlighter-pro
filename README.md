# Enhanced TTS Highlighter Pro ✨

**Read selected text aloud in your Chrome browser with powerful customization and control.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) <!-- Optional: Add MIT License file later -->
<!-- Add other badges later if relevant (e.g., version, build status) -->

This Chrome extension allows you to quickly hear selected text read aloud using your browser's built-in Text-to-Speech capabilities. Simply hold the `Ctrl` key while selecting text. It features extensive options for voice selection, speed, pitch, volume, and reading limits, along with convenient hotkeys and visual feedback.

---

<!-- ![Screenshot/GIF Placeholder](link_to_your_screenshot_or_gif.gif "Enhanced TTS Highlighter Pro in action") -->
***(Optional but Highly Recommended): Replace the line above with an actual screenshot or GIF demonstrating the extension.*

---

## 🚀 Key Features

*   **Ctrl + Select Activation:** Hold `Ctrl` and select text with your mouse to instantly trigger Text-to-Speech.
*   **Adjustable Speed Hotkeys:** While speech is active, use `Ctrl` + `Up Arrow` to increase speed and `Ctrl` + `Down Arrow` to decrease speed.
*   **Multiple Stop Options:**
    *   Press the `Esc` key anytime.
    *   Click the 'X' button on the speaking indicator.
    *   Click the "Stop Current Speech" button in the extension popup.
*   **Customizable Voice & Audio:**
    *   Select preferred TTS voices available in Chrome/your OS (including Cloud/Network voices).
    *   Adjust speech **Rate**, **Pitch**, and **Volume** via sliders in the Options page.
*   **Reading Limit:** Set a maximum character length in Options to prevent accidentally reading excessively long text (0 for unlimited).
*   **Visual Speaking Indicator:** A clean, non-intrusive overlay appears while speaking, showing status and current rate.
*   **Popup Controls:** Quick access to Options and a Stop button via the toolbar icon.
*   **Options Page Testing:** Test your voice settings directly within the Options page before saving.

## 💾 Installation

There are two ways to install the extension:

**1. From Chrome Web Store (Recommended for most users)**

*   *(Coming Soon! - Add link here once published)*

**2. Manual Installation (For development or testing)**

1.  **Download/Clone:** Download the source code from this repository (click "Code" > "Download ZIP") or clone it using Git:
    ```bash
    git clone https://github.com/YourUsername/YourRepositoryName.git
    ```
    *(Replace the URL with your actual repository URL)*
2.  **Unzip:** If you downloaded the ZIP file, unzip it to a location you'll remember.
3.  **Open Chrome Extensions:** Open Google Chrome, type `chrome://extensions` in the address bar, and press Enter.
4.  **Enable Developer Mode:** Ensure the "Developer mode" toggle switch (usually in the top-right corner) is **ON**.
5.  **Load Unpacked:** Click the "**Load unpacked**" button.
6.  **Select Folder:** Navigate to and select the folder containing the extension files (the one with `manifest.json` inside, e.g., `tts-highlighter-pro`).
7.  **Done!** The extension icon should appear in your toolbar (you might need to pin it via the puzzle piece icon 🧩). Remember to reload any existing tabs for the extension to work on them.

## ⚙️ How to Use

1.  **Read Text:** Go to any webpage. Hold down the `Ctrl` key, select text with your mouse, and release the mouse button (while still holding `Ctrl`). Speech should begin, and the indicator will appear.
2.  **Adjust Speed:** While speech is playing, hold `Ctrl` and press `↑` (Up Arrow) to speed up or `↓` (Down Arrow) to slow down. The rate indicator will update.
3.  **Stop Speech:**
    *   Press the `Esc` key.
    *   Click the `X` on the speaking indicator (bottom-right).
    *   Click the extension icon in the toolbar, then click "Stop Current Speech".
4.  **Configure:**
    *   Click the extension icon in the toolbar, then click "Open Settings".
    *   Adjust Voice, Rate, Pitch, Volume, and Max Characters to your liking.
    *   Use the "Test Speech" section to try settings.
    *   Click "Save Settings".

## 🛠️ Technology Stack

*   JavaScript (ES6+)
*   HTML5
*   CSS3
*   Chrome Extension Manifest V3 APIs:
    *   `chrome.tts`
    *   `chrome.storage` (`sync`)
    *   `chrome.runtime`
    *   `chrome.action`

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/YourUsername/YourRepositoryName/issues) *(Update link)*.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

*(Optional: Create a file named `LICENSE` in your project root and paste the MIT License text into it. You can find the template easily online.)*

---

Enjoy effortless text-to-speech in Chrome!