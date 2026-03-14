# Resume Tailor - Chrome Extension

AI-powered resume optimization right from any job posting page!

## Features

✨ **Extract job descriptions** from any webpage with one click
📄 **Upload your resume** directly in the extension
🔍 **Optional web research** for company info and technologies
⚡ **Fast processing** with your personal AI agent
📥 **Download tailored resume** instantly

## Installation

### 1. Make sure the backend server is running
```bash
cd resume-generator
npm run web
```
Server should be running at `http://100.78.167.87:3002` or `http://localhost:3002`

### 2. Load the extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `resume-generator/chrome-extension` folder
5. The Resume Tailor extension should now appear in your extensions!

### 3. Pin the extension (optional but recommended)
- Click the puzzle piece icon in Chrome toolbar
- Find "Resume Tailor" and click the pin icon
- Extension will now show in your toolbar

## How to Use

1. **Navigate to any job posting** (LinkedIn, Indeed, company career page, etc.)

2. **Click the Resume Tailor extension icon** in your toolbar

3. **Upload your resume** (.docx file)

4. **Click "Extract from Current Page"** to automatically grab the job description
   - Or manually paste the job description if extraction doesn't work

5. **Toggle Web Research** on/off:
   - ✅ ON: AI researches company + technologies (5-6 min, richer context)
   - ❌ OFF: Fast mode without research (2-3 min)

6. **Click "Tailor My Resume"** and wait for processing

7. **Download your tailored resume** when complete!

## Supported Websites

The extension works on most job posting sites:
- ✅ LinkedIn Jobs
- ✅ Indeed
- ✅ Glassdoor
- ✅ Company career pages
- ✅ AngelList
- ✅ Built In
- ✅ Any website with job descriptions

## Configuration

### Change Server URL
If your server is running on a different port or IP, edit `popup.js`:
```javascript
const API_URL = 'http://YOUR_IP:YOUR_PORT';
```

### Customize Extraction
The extension tries multiple strategies to find job descriptions. If it's not working for a specific site, you can:
1. Use the manual paste option
2. Modify `content.js` to add site-specific selectors

## Troubleshooting

**Extension icon doesn't appear**
- Make sure Developer mode is enabled
- Reload the extension at chrome://extensions/

**Can't extract job description**
- Try refreshing the job posting page
- Use manual paste as fallback
- Some sites block content extraction

**"Could not connect to server"**
- Verify backend server is running: `npm run web`
- Check server URL in popup.js matches your setup
- Check browser console for CORS errors

**Resume download fails**
- Check that the server has write permissions
- Verify files are being created in `agent/custom_scripts/`

## Privacy & Security

- ✅ **Your resume stays private** - processed locally on your server
- ✅ **No data is stored** - files are temporary
- ✅ **No third-party tracking** - extension only talks to your server
- ✅ **Open source** - review all code before installing

## Development

### File Structure
```
chrome-extension/
├── manifest.json       # Extension configuration
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic & API calls
├── content.js         # Page content extraction
├── icons/             # Extension icons
└── README.md          # This file
```

### Making Changes
1. Edit files as needed
2. Go to chrome://extensions/
3. Click reload icon for Resume Tailor extension
4. Changes take effect immediately

## Credits

Powered by Claude Agent SDK and Anthropic's AI models.
