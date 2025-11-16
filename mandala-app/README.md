# 🎯 Mandala Chart Builder App

A web application for creating personalized 9x9 Mandala Charts using the proven goal decomposition methodology made famous by Shohei Ohtani.

## What is a Mandala Chart?

A Mandala Chart (also called Mandara Chart) is a Japanese goal-setting tool that:

1. **Places ONE ultimate goal** in the center
2. **Identifies 8 major pillars** (domains) that make the goal inevitable
3. **Breaks each pillar into 8 specific sub-goals** (64 total actionable items)
4. **Creates a visual 9x9 grid** showing the entire goal system

This hierarchical structure provides clarity and accountability, helping you move from overwhelming ambition to concrete, measurable progress.

## Project Structure

```
mandala-app/
├── frontend/              # React TypeScript SPA
│   ├── src/
│   │   ├── components/   # UI components for each phase
│   │   ├── types.ts      # TypeScript types
│   │   ├── App.tsx       # Main app with state machine
│   │   ├── App.css       # Styling
│   │   └── main.tsx      # Entry point
│   ├── index.html        # HTML template
│   ├── vite.config.ts    # Vite config
│   ├── tsconfig.json
│   └── package.json
├── backend/               # Node.js Express API
│   ├── src/
│   │   ├── api/
│   │   │   └── generate.ts  # Chart generation logic
│   │   └── server.ts        # Express server
│   ├── tsconfig.json
│   └── package.json
├── .claude/               # Claude Code configuration
│   └── skills/
│       └── mandala-chart-builder/  # The mandala skill
├── README.md
└── mandala-maker.md      # Design document
```

## Getting Started

### Prerequisites

- Node.js 18+
- Claude API key (for full Claude Agent SDK integration)
- npm or yarn

### Installation

1. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   cd ..
   ```

### Running the App

1. **Start the backend (in one terminal):**
   ```bash
   cd backend
   npm run dev
   ```
   The API will start on `http://localhost:3001`

2. **Start the frontend (in another terminal):**
   ```bash
   cd frontend
   npm run dev
   ```
   The UI will start on `http://localhost:3000`

3. **Open your browser to `http://localhost:3000`**

## Architecture

### Frontend (React + TypeScript)

The frontend implements a state machine that guides users through 4 phases:

1. **Welcome** - Introduction and value proposition
2. **Center Goal** - Define the ultimate objective
3. **Pillars** - Identify 8 major domains
4. **Sub-Goals** - Fill 8 specific items per pillar
5. **Generating** - Create outputs via backend API
6. **Results** - Display chart, action plan, and downloads
7. **Error** - Error handling and recovery

**Key Components:**
- `Welcome.tsx` - Landing page
- `CenterGoal.tsx` - Goal definition step
- `Pillars.tsx` - 8 pillar input
- `SubGoals.tsx` - 64 sub-goals input
- `Generating.tsx` - Loading state with API call
- `Results.tsx` - Tabbed results display (Chart/Plan/Data)
- `Error.tsx` - Error handling

### Backend (Express + Claude Agent SDK)

The backend provides a single API endpoint:

**POST /api/generate**
- Input: `centerGoal` and `pillars` array with sub-goals
- Output: JSON structure, HTML visualization, action plan
- Uses Claude Agent SDK to leverage the mandala skill for generation

**Key Files:**
- `server.ts` - Express setup and routing
- `api/generate.ts` - Chart generation using Claude Agent SDK

### Data Flow

```
User Input (Frontend)
  ↓
React State Machine
  ↓
/api/generate POST
  ↓
Claude Agent SDK
  ↓
Mandala Skill
  ↓
Generate Outputs (JSON, HTML, Action Plan)
  ↓
Return to Frontend
  ↓
Display Results & Downloads
```

## Features

✅ **Guided Conversation Flow** - Step-by-step guidance without overwhelming choices
✅ **Progress Tracking** - Visual indicators showing progress through the 64 sub-goals
✅ **Real-time Validation** - Can't proceed to next step until current step complete
✅ **Local Storage** - Progress saved automatically, can resume later
✅ **Multiple Outputs**:
   - Interactive HTML visualization
   - JSON data structure for integration
   - Personalized action plan (text)
   - Easy downloads for all formats
✅ **Error Handling** - Graceful error messages with retry capability
✅ **Responsive Design** - Works on desktop (mobile support planned)

## Usage Example

### User Journey

1. **Land on the app** → See value prop and click "Start"
2. **Define goal** → Enter: "Become a renowned teacher of holistic programming"
3. **Identify pillars** → Enter 8 domains:
   - Teaching Craft
   - Technical Skills
   - Content Creation
   - Business Model
   - Audience Building
   - Personal Brand
   - Financial Planning
   - Health & Sustainability
4. **Fill sub-goals** → For each pillar, define 8 specific items
5. **Generate** → Backend creates visualization and action plan
6. **Review** → See interactive chart, read action plan, download files
7. **Download** → Get JSON, HTML, and text versions for external use

## Integration with Claude Agent SDK

The backend uses the Claude Agent SDK to:

1. **Load the mandala skill** from `.claude/skills/` directory
2. **Send user data** as a structured prompt
3. **Receive generated outputs** (JSON, HTML visualization, action plan)
4. **Return to frontend** for display and download

See `backend/src/api/generate.ts` for implementation details.

## Customization

### Styling

Edit `frontend/src/App.css` to customize colors and layout.

### API Endpoint

The frontend proxy is configured in `frontend/vite.config.ts`. Update if needed:
```typescript
proxy: {
  "/api": {
    target: "http://localhost:3001",
    changeOrigin: true,
  },
}
```

### Generation Logic

Modify `backend/src/api/generate.ts` to customize:
- How data is formatted for Claude
- What outputs are generated
- Error handling and fallbacks

## Design Document

See `mandala-maker.md` in the root for the comprehensive technical design including:
- Problem statement and user research
- Architecture decisions
- Acceptance criteria and test cases
- Implementation roadmap
- Risk assessment

## Key Decisions

1. **State Machine over Redux** - useReducer is sufficient for this flow
2. **Mock Generation Fallback** - Backend includes mock generation if Claude SDK unavailable
3. **No Authentication** - Single-session POC, no persistence backend
4. **Client-side Storage** - localStorage for progress (not cross-device)
5. **Desktop-first UI** - Mobile support is "works but not optimized"

## Future Enhancements

From the design document (out of scope for MVP):

- [ ] User authentication and saved charts
- [ ] Real-time chart visualization during input
- [ ] Mobile-responsive design
- [ ] Export to Google Drive / Notion integration
- [ ] Edit chart after generation
- [ ] Analytics and usage tracking
- [ ] Multiple charts per session

## Development

### Build Commands

**Frontend:**
```bash
cd frontend
npm run build    # Build for production
npm run preview  # Preview production build
npm run dev      # Development server
```

**Backend:**
```bash
cd backend
npm run build    # Compile TypeScript
npm run dev      # Development with hot reload
npm start        # Run compiled version
```

## Testing

The design document includes comprehensive test cases:

1. **Complete Flow Test** - Can complete entire flow in under 20 minutes
2. **Assist Functionality Test** - Claude suggestions are contextual
3. **Output Validity Test** - Generated files are valid and match schema
4. **Error Handling Test** - Graceful failures with recovery
5. **Hot Knife Test** - User testing with target audience

See `mandala-maker.md` for detailed test specifications.

## License

See LICENSE in root repository.

## Author

Created as a proof-of-concept for the Mandala Chart Builder skill by Jai Bhagat.

## Support

For issues, feature requests, or questions:
1. Check the `mandala-maker.md` design document
2. Review existing issues in the repo
3. Create a new issue with detailed description

## Resources

- [Mandala Chart Builder Skill](./mandala-chart-builder/)
- [Design Document](./mandala-maker.md)
- [Technical Design](./mandala-chart-builder/SKILL.md)
- [Example Chart (Ohtani)](./mandala-chart-builder/assets/ohtani_example.json)
