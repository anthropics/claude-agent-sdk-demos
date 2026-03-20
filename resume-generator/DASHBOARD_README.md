# 🚀 AI-Powered Job Seeking Dashboard

A complete job search and resume tailoring platform powered by Claude AI.

## 🎯 What You Built

### 1. **Job Search Dashboard**
Web-based platform to search, save, and apply to jobs
- **URL**: http://100.78.167.87:3002/dashboard.html

### 2. **Chrome Extension**
Tailor resumes directly from any job posting page
- **Location**: `chrome-extension/`

### 3. **Manual Tailor Tool**
Original standalone resume tailoring interface
- **URL**: http://100.78.167.87:3002/

## 📊 Features Overview

### Job Search Dashboard Features
✅ **Multi-Platform Job Search**
- Search across major platforms (currently demo data, real API integration available)
- Filter by location, remote, experience level, job type
- Real-time results with rich job details

✅ **Smart Organization**
- **Search Results**: Browse all matching jobs
- **Saved Jobs**: Heart icon to save favorites
- **Applications**: Track tailored resumes and application status

✅ **One-Click Resume Tailoring**
- Upload resume once, use for all jobs
- Click "Tailor Resume" on any job
- AI researches company + technologies
- Download tailored resume instantly

✅ **Application Tracking**
- Automatic tracking when you tailor for a job
- Update status: Applied → Interview → Offer → Rejected
- Download tailored resumes anytime

✅ **Web Research Toggle**
- Enable: 3-5 focused searches (5-6 min, richer context)
- Disable: Fast mode without research (2-3 min)

### Chrome Extension Features
✅ **Auto-Extract Job Descriptions**
- Works on LinkedIn, Indeed, Glassdoor, company sites
- One-click extraction from current page

✅ **Quick Upload**
- Upload resume right in extension
- Persistent storage

✅ **Instant Tailoring**
- Process resumes without leaving the job page
- Download directly from extension

## 🎨 User Interface

### Dashboard Layout
```
┌─────────────────────────────────────────────┐
│ 📊 Job Seeking Dashboard                   │
│                    [Upload Resume] [Manual] │
├─────────────────────────────────────────────┤
│ 🔍 Search Jobs                              │
│ [Keywords] [Location] [Search]              │
│ ☑️ Remote  [Experience] [Type]              │
├─────────────────────────────────────────────┤
│ [Search Results] [Saved Jobs] [Applications]│
├─────────────────────────────────────────────┤
│ 💼 Senior Software Engineer                 │
│ 🤖 Anthropic • SF • $200k-$350k            │
│ Description...                              │
│ [💖] [✨ Tailor Resume] [View Job →]       │
│                                             │
│ ⚡ ML Engineer                              │
│ 🚀 OpenAI • Remote • $180k-$300k           │
│ ...                                         │
└─────────────────────────────────────────────┘
```

### Chrome Extension UI
```
┌──────────────────────────┐
│ 📄 Resume Tailor         │
├──────────────────────────┤
│ Resume (.docx)           │
│ [Choose File]            │
│                          │
│ Job Description          │
│ [✨ Extract from Page]   │
│                          │
│ ☑️ 🔍 Web Research       │
│                          │
│ [Tailor My Resume]       │
└──────────────────────────┘
```

## 🚀 Quick Start

### Access the Dashboard
```
http://100.78.167.87:3002/dashboard.html
```

### Install Chrome Extension
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `chrome-extension/` folder

### Use the Dashboard
1. **Upload Resume** (one-time)
   - Click "Upload Resume" button
   - Select your .docx resume
   - Resume is stored for the session

2. **Search Jobs**
   - Enter keywords: "Software Engineer"
   - Add location (optional): "San Francisco"
   - Apply filters (remote, experience, type)
   - Click "Search"

3. **Save Favorites**
   - Click ❤️ icon on any job
   - Access saved jobs in "Saved Jobs" tab

4. **Tailor Resume**
   - Click "✨ Tailor Resume" on any job
   - AI processes job description
   - Web research finds company info + tech details
   - Download tailored resume when complete

5. **Track Applications**
   - Automatically tracked when you tailor
   - View in "Applications" tab
   - Update status as you progress

## 📁 File Structure

```
resume-generator/
├── server.ts                      # Backend API
├── public/
│   ├── dashboard.html             # Job dashboard UI
│   ├── dashboard.js               # Dashboard logic
│   ├── index.html                 # Manual tailor UI
│   └── app.js                     # Manual tailor logic
├── chrome-extension/
│   ├── manifest.json              # Extension config
│   ├── popup.html                 # Extension UI
│   ├── popup.js                   # Extension logic
│   ├── content.js                 # Page extraction
│   └── README.md                  # Installation guide
├── examples/
│   ├── sample_resume.docx         # Test resume
│   └── sample_jobs.json           # Sample jobs
├── JOB_API_INTEGRATION.md         # API integration guide
└── DASHBOARD_README.md            # This file
```

## 🔧 Technical Stack

**Frontend:**
- HTML5 + Tailwind CSS
- Vanilla JavaScript (no framework)
- WebSocket for real-time updates
- Local Storage for persistence

**Backend:**
- Node.js + Express
- TypeScript
- Claude Agent SDK
- WebSocket (ws library)

**AI Processing:**
- Claude Sonnet 4.5
- Web research (WebSearch, WebFetch)
- Document generation (docx library)

## 📊 Data Flow

### Job Search Flow
```
User searches → Dashboard → Backend API
                               ↓
                      Job Search API (or demo)
                               ↓
                          Filter & format
                               ↓
                    Return jobs to dashboard
                               ↓
                       Render job cards
```

### Resume Tailoring Flow
```
User clicks "Tailor" → Upload job info → Backend
                                           ↓
                                    Claude Agent
                                           ↓
                        1. Fetch job description
                        2. Convert resume to markdown
                        3. Research company + tech
                        4. Analyze & match
                        5. Generate tailored .docx
                                           ↓
                           Return download link
                                           ↓
                          Track in applications
```

## 🔌 API Integration

### Current Status
- **Demo Mode**: Returns sample jobs for testing
- **Ready for**: Real API integration

### Integrate Real APIs
See `JOB_API_INTEGRATION.md` for:
- JSearch (RapidAPI) - Aggregates multiple platforms
- Adzuna API - Free tier available
- LinkedIn API - Direct LinkedIn data
- Indeed API - Largest job database

### Quick Integration (JSearch)
1. Sign up at https://rapidapi.com
2. Subscribe to JSearch API (free tier)
3. Set environment variable:
   ```bash
   export RAPIDAPI_KEY="your-key"
   ```
4. Server automatically switches from demo to real data

## 📈 Features Roadmap

### Current Features
- ✅ Job search with filters
- ✅ Save favorite jobs
- ✅ One-click resume tailoring
- ✅ Application tracking
- ✅ Web research toggle
- ✅ Chrome extension
- ✅ Real-time progress updates

### Future Enhancements
- [ ] Real job API integration (JSearch, LinkedIn, Indeed)
- [ ] Bulk resume tailoring (multiple jobs at once)
- [ ] Resume version comparison
- [ ] Interview prep suggestions
- [ ] Salary negotiation insights
- [ ] Company research reports
- [ ] Application deadline reminders
- [ ] Email alerts for new jobs
- [ ] Mobile app version
- [ ] Team collaboration features

## 🎯 Use Cases

### 1. Active Job Seeker
```
1. Upload resume to dashboard
2. Search "Product Manager Remote"
3. Save 10 interesting positions
4. Tailor resume for top 3 jobs
5. Track applications
6. Update status as you progress
```

### 2. Passive Browser
```
1. Install Chrome extension
2. Browse LinkedIn/Indeed normally
3. Find interesting job
4. Click extension → Extract → Tailor
5. Download customized resume
```

### 3. Career Changer
```
1. Upload current resume
2. Search target role
3. AI research shows skill gaps
4. Tailored resume emphasizes transferable skills
5. Get insights on how to position yourself
```

## 🔒 Privacy & Security

✅ **Your Data Stays Private**
- Resume processed locally on your server
- No third-party storage
- Files deleted after processing

✅ **No Tracking**
- No analytics
- No data collection
- Open source - review all code

✅ **Local Storage Only**
- Saved jobs stored in browser
- Applications tracked locally
- Clear anytime

## 🐛 Troubleshooting

### Dashboard doesn't load
- Check server is running: `npm run web`
- Verify URL: http://100.78.167.87:3002/dashboard.html
- Check browser console for errors

### Job search returns no results
- Currently using demo data
- To integrate real APIs, see `JOB_API_INTEGRATION.md`

### Tailor button disabled
- Upload resume first (click "Upload Resume")
- Resume must be .docx format

### Chrome extension not extracting
- Refresh the job posting page
- Try manual paste as fallback
- Some sites block content extraction

### Download fails
- Check server has write permissions
- Verify `agent/custom_scripts/` exists
- Check browser downloads folder

## 📚 Documentation

- `DASHBOARD_README.md` - This file
- `JOB_API_INTEGRATION.md` - How to integrate real job APIs
- `chrome-extension/README.md` - Extension installation
- `WEB-README.md` - Web tool documentation

## 🤝 Contributing

Want to add features?
1. Fork the repository
2. Add your feature
3. Test thoroughly
4. Submit pull request

## 📝 License

Built with Claude Agent SDK - check their license for usage terms.

## 🎉 Credits

- **AI**: Claude Sonnet 4.5 (Anthropic)
- **Framework**: Claude Agent SDK
- **Icons**: Font Awesome
- **Styling**: Tailwind CSS

---

**Ready to revolutionize your job search!** 🚀

Start at: http://100.78.167.87:3002/dashboard.html
