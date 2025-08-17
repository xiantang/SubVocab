# SubVocab - YouTube Subtitle Vocabulary Builder

A Chrome browser extension that helps you learn new words from YouTube videos by collecting vocabulary from subtitles and building your personal word list.

## Features

- **Double-click Word Selection**: Double-click any word in YouTube subtitles to see its translation
- **Vocabulary Collection**: Automatically add new words to your personal vocabulary list
- **Hover Translations**: Hover over highlighted words to see their translations
- **Word Management**: Remove words from your vocabulary list with confirmation
- **Video Pause on Hover**: Video automatically pauses when hovering over subtitles for better learning experience
- **Compound Word Support**: Recognizes hyphenated compound words correctly

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the project folder
5. The SubVocab extension should now appear in your extensions list

## Setup

1. **OpenAI API Key**: You'll need to configure your OpenAI API key for translations
2. Click on the SubVocab extension icon in your browser toolbar
3. Enter your OpenAI API key in the popup settings

## Usage

### Learning New Words
1. Go to any YouTube video with subtitles enabled
2. Double-click on any word in the subtitles
3. A translation tooltip will appear
4. The word will be automatically added to your vocabulary list
5. Previously learned words will be highlighted in the subtitles

### Managing Your Vocabulary
1. Click the SubVocab extension icon to open the popup
2. View your collected words and their translations
3. Remove words by double-clicking them (with confirmation)
4. Words are automatically saved and synchronized

### Video Controls
- Videos pause automatically when you hover over subtitles
- Videos resume when you move your cursor away
- This helps you focus on learning without missing content

## Technical Details

- **Permissions**: Storage, Active Tab, Context Menus, OpenAI API access
- **Supported Sites**: YouTube (all domains)
- **Storage**: Local Chrome storage for vocabulary persistence
- **Translation**: OpenAI API integration for accurate translations

## File Structure

```
├── manifest.json        # Extension configuration
├── content.js          # Main content script for YouTube integration
├── background.js       # Background service worker
├── popup.html          # Extension popup interface
├── popup.js           # Popup functionality
├── styles.css         # Styling for tooltips and highlights
└── README.md          # This file
```

## Contributing

This project focuses on vocabulary learning from video subtitles. When contributing:

- Don't break existing functionality
- Prioritize code reuse
- Follow the established patterns
- Test thoroughly on YouTube

## Privacy

- All vocabulary data is stored locally in your browser
- OpenAI API is only used for word translations
- No personal data is collected or transmitted beyond translation requests

## License

[Add your license here]

## Support

If you encounter any issues or have suggestions, please create an issue in the project repository.