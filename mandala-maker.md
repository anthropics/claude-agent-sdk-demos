# Technical Design Document: Mandala Chart Builder Web UI

**Status:** Draft  
**Author:** Jai Bhagat  
**Created:** 2025-11-15  
**Last Updated:** 2025-11-15  

---

## Overview

This document proposes a web-based user interface that enables users to interact with the Mandala Chart Builder Claude Skill through a guided conversation, resulting in a personalized 9x9 goal decomposition chart and customized action plan. The UI will leverage the Claude Agent SDK to orchestrate skill execution while providing a seamless user experience.

---

## Background

### The Problem

Users currently have two paths to access the Mandala Chart Builder skill:

1. **Claude.ai (with skill uploaded)** — Requires Pro/Max subscription, skill upload to settings, and familiarity with Claude's interface
2. **Claude Code CLI** — Requires technical setup and command-line comfort

Neither path serves the target audience: mid-level professionals who look successful but feel stuck. These users need guided structure, not open-ended chat interfaces. The current options create friction at exactly the moment when someone is motivated to set meaningful goals.

**Specific Pain Points:**
- No guided flow — users don't know what questions to expect or how long the process takes
- No visual preview — can't see the chart forming as they answer questions
- No persistence — can't save partial progress or return later
- No sharing — can't easily share results with accountability partners

### Why Now

The Mandala Chart skill is proven: Ohtani's chart demonstrates the methodology's power. The Claude Agent SDK is production-ready with filesystem-based skill loading. The market gap exists: no goal-setting tools combine hierarchical decomposition with AI-powered personalization. This is an opportunity to validate the teaching-full-time revenue model with a concrete, shippable product.

### Job To Be Done

When **a professional feels stuck despite external success**, they want to **create a clear, actionable map of what they need to do** so they can **stop feeling overwhelmed and start making measurable progress toward a meaningful goal**.

---

## Appetite

**2-week small batch** (40-60 hours of focused work)

This is a proof-of-concept, not a production SaaS. The appetite constrains the scope to:
- Single user flow (no authentication, no persistence beyond session)
- Core skill interaction (question/answer → chart generation → action plan)
- Basic visualization (HTML output, not real-time chart building)
- Simple deployment (static frontend, serverless backend)

**Explicit trade-offs:**
- No user accounts or saved progress
- No real-time chart visualization during conversation
- No mobile-optimized UI
- No analytics or telemetry
- No payment processing

---

## Solution

### Core Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Static UI     │────▶│  API Gateway     │────▶│  Claude Agent   │
│   (React/HTML)  │◀────│  (Lambda/Edge)   │◀────│  SDK Runtime    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
                                                  ┌─────────────────┐
                                                  │  Mandala Chart  │
                                                  │  Skill Files    │
                                                  └─────────────────┘
```

### User Flow

1. **Landing** — User arrives, sees value proposition, clicks "Start Building Your Chart"
2. **Center Goal** — Prompted to define their ultimate goal with guidance
3. **Pillar Identification** — Guided through identifying 8 major domains
4. **Sub-Goal Collection** — For each pillar, collect 8 specific actions (with "assist me" option)
5. **Generation** — Loading state while Claude generates outputs
6. **Results** — View interactive chart, download files, read action plan
7. **Share** — Copy link or download package

### Technical Components

#### Frontend (React SPA)

**State Machine:**
```typescript
type ConversationState = 
  | { phase: 'welcome' }
  | { phase: 'center_goal'; draft: string }
  | { phase: 'pillars'; pillars: string[]; current: number }
  | { phase: 'sub_goals'; pillar: number; goals: string[]; current: number }
  | { phase: 'generating' }
  | { phase: 'results'; outputs: MandalaOutputs }
  | { phase: 'error'; message: string }
```

**Key UI Components:**
- `ProgressIndicator` — Shows where user is in the flow (8 pillars × 8 sub-goals = 64 steps)
- `GoalInput` — Text area with character guidance and examples
- `AssistButton` — Triggers Claude to suggest options based on context
- `MiniChart` — Shows partial chart as it fills in (visual feedback)
- `ResultsViewer` — Renders HTML chart, provides download links
- `ActionPlanDisplay` — Formatted markdown rendering of personalized plan

#### Backend (Serverless Functions)

**Endpoints:**

1. `POST /api/assist`
   - Input: Current context (goal, pillars so far, current pillar)
   - Output: Array of suggested sub-goals
   - Uses Claude Agent SDK with skill loaded

2. `POST /api/generate`
   - Input: Complete chart data (center goal, 8 pillars, 64 sub-goals)
   - Output: JSON, HTML visualization, action plan markdown
   - Uses skill scripts to generate all outputs

**SDK Integration:**

```python
from claude_agent_sdk import query, ClaudeAgentOptions

async def generate_chart(chart_data: dict):
    options = ClaudeAgentOptions(
        setting_sources=["project"],  # Load skill from project
        allowed_tools=["Skill", "Write", "Read"],
        system_prompt="You are generating a Mandala Chart..."
    )
    
    prompt = f"""
    Generate complete Mandala Chart outputs for:
    Center Goal: {chart_data['center_goal']}
    Pillars and Sub-Goals: {json.dumps(chart_data['pillars'])}
    
    Create: JSON structure, HTML visualization, personalized action plan.
    """
    
    outputs = {}
    async for message in query(prompt=prompt, options=options):
        # Collect generated files
        pass
    
    return outputs
```

#### Skill Integration

The Mandala Chart Builder skill is loaded from filesystem:

```
project/
├── .claude/
│   └── skills/
│       └── mandala-chart-builder/
│           ├── SKILL.md
│           ├── scripts/
│           │   ├── generate_visualization.py
│           │   └── generate_excel.py
│           ├── references/
│           │   ├── json-schema.md
│           │   └── action-plan-template.md
│           └── assets/
│               └── ohtani_example.json
```

The SDK discovers the skill at startup and Claude invokes it when the prompt matches the skill's description triggers.

---

## Verification Strategy

### Acceptance Criteria (Test Cases)

Each criterion maps to a specific user outcome. All must pass before shipping.

#### 1. Complete Flow Test
**Given** a user with a clear goal in mind  
**When** they complete all prompts without using "assist"  
**Then** they receive a valid JSON, viewable HTML chart, and personalized action plan  
**And** the total time from start to finish is under 20 minutes

**Verification:**
```bash
# Automated E2E test
npm run test:e2e -- --scenario=complete-flow
# Checks: All 64 sub-goals captured, outputs valid, no errors
```

#### 2. Assist Functionality Test
**Given** a user stuck on identifying pillars  
**When** they click "Assist me" with partial context  
**Then** Claude suggests relevant options based on their goal  
**And** suggestions feel contextual (not generic)

**Verification:**
```python
def test_assist_contextuality():
    response = assist_endpoint({
        "center_goal": "Become renowned teacher of holistic programming",
        "pillars": ["Teaching Craft", "Revenue Model"],
        "current_pillar": None,
        "needs": "suggest_pillars"
    })
    
    # Suggestions should NOT be generic like "Hard Work", "Persistence"
    # Should relate to teaching/programming/holistic context
    assert any("student" in s.lower() for s in response["suggestions"])
    assert any("curriculum" in s.lower() or "course" in s.lower() 
               for s in response["suggestions"])
```

#### 3. Output Validity Test
**Given** a completed chart data structure  
**When** generation endpoint is called  
**Then** JSON schema matches specification  
**And** HTML renders without JavaScript errors  
**And** action plan references actual user pillars/sub-goals

**Verification:**
```python
def test_output_validity():
    # JSON schema validation
    jsonschema.validate(output["json"], MANDALA_SCHEMA)
    
    # HTML renders (headless browser check)
    browser = Puppeteer.launch()
    page = browser.newPage()
    page.setContent(output["html"])
    assert page.querySelector(".center-goal").textContent == input["center_goal"]
    assert len(page.querySelectorAll(".pillar")) == 8
    
    # Action plan references actual content
    for pillar in input["pillars"]:
        assert pillar["name"] in output["action_plan"]
```

#### 4. Error Handling Test
**Given** API errors or timeout  
**When** generation fails  
**Then** user sees friendly error message  
**And** partial progress is not lost  
**And** retry option is available

**Verification:**
```typescript
test("handles generation timeout gracefully", async () => {
  mockApiTimeout();
  const { getByText, queryByText } = render(<App />);
  
  // Simulate user completing flow
  await completeFlowUntilGeneration();
  
  // Should show error, not crash
  await waitFor(() => {
    expect(getByText(/something went wrong/i)).toBeInTheDocument();
    expect(queryByText(/retry/i)).toBeInTheDocument();
  });
  
  // Progress should be preserved
  expect(getLocalStorage("chart_progress")).toBeTruthy();
});
```

#### 5. Hot Knife Test (UX Quality)
**Given** a user who has never seen a Mandala Chart  
**When** they use the UI  
**Then** they understand what they're building by step 3  
**And** they can complete the flow without external documentation  
**And** the final chart "makes sense" to them

**Verification:** Manual user testing with 3 target users (mid-level professionals). Success = 2/3 complete without confusion.

---

## Rabbit Holes

### Claude Agent SDK Rate Limits

**Risk:** Claude API calls during "assist" could hit rate limits, especially if users click assist frequently.

**Mitigation:**
- Cache assist responses for identical context (goal + pillars hash)
- Debounce assist button (2-second cooldown)
- Use lighter model (Haiku) for assist, heavier (Sonnet) for generation
- Display "generating..." state to prevent repeated clicks

### Skill Loading in Serverless Environment

**Risk:** Serverless functions are stateless; skill filesystem may not persist between invocations.

**Mitigation:**
- Bundle skill files with deployment package
- Use `setting_sources=["project"]` pointing to bundled path
- Verify skill discovery in cold-start test
- Alternative: Use Claude API directly with skill context injected into system prompt (less elegant but more portable)

### Action Plan Personalization Quality

**Risk:** Generic action plans that don't feel personalized despite having user data.

**Mitigation:**
- Template includes explicit placeholders that MUST be filled with user data
- Verification test checks for actual pillar/sub-goal names in output
- Prompt engineering to emphasize "based on YOUR specific [pillar name]"
- Include negative test: generic phrases like "based on your goals" without specifics should fail

### Session Timeout During Long Flow

**Risk:** Users taking 20+ minutes might have API session expire, losing progress.

**Mitigation:**
- Store progress in localStorage at each step
- Prompt to continue if returning with saved progress
- Generation endpoint accepts complete data, doesn't rely on session
- Clear timeout warning at 15-minute mark

---

## No-Gos (Explicitly Out of Scope)

**User Authentication / Accounts**
Not building login, registration, or persistent user profiles. This is a single-session tool. Why: Authentication adds weeks of scope and isn't necessary to validate the core value proposition.

**Real-Time Chart Visualization**
The chart won't animate or update live as users input sub-goals. They'll see a simple progress indicator and final output. Why: Real-time visualization is cosmetic, not functional. Users care about the end result, not watching it build.

**Mobile-Responsive Design**
Desktop-first UI. Mobile will be usable but not optimized. Why: Goal-setting is a "sit down and focus" activity, not a mobile-on-the-go task.

**Export to Google Drive / Notion**
Only local file downloads (HTML, JSON, XLSX). No direct integrations. Why: Integrations multiply testing surface. Users can upload downloaded files themselves.

**Multiple Charts or Edit Functionality**
One chart per session. No editing after generation. To change something, start over. Why: Editing introduces state management complexity. The flow is designed to be completed in one sitting.

**Analytics / User Tracking**
No telemetry, heatmaps, or usage tracking. Why: Privacy-first, anti-guru positioning. Also unnecessary for proof-of-concept validation.

---

## Implementation Plan

### Milestone 1: Core Conversation Flow (3-4 days)

**Scope:** Frontend state machine + mock backend

**Tasks:**
- [ ] React project setup with TypeScript
- [ ] State machine implementation (XState or useReducer)
- [ ] GoalInput component with validation
- [ ] ProgressIndicator component
- [ ] Mock backend responses for testing flow
- [ ] Local storage progress saving

**Verification:**
- Can complete entire flow with mock data
- Progress saves and restores correctly
- State transitions are correct (can't skip steps)

### Milestone 2: Claude Agent SDK Integration (3-4 days)

**Scope:** Real backend with skill execution

**Tasks:**
- [ ] Serverless function setup (AWS Lambda or Vercel Edge)
- [ ] Skill files bundled in deployment
- [ ] `/api/assist` endpoint with SDK
- [ ] `/api/generate` endpoint with SDK
- [ ] Response parsing and error handling
- [ ] API key management (env vars, not hardcoded)

**Verification:**
- Assist returns contextual suggestions
- Generate produces valid JSON, HTML, markdown
- Error states handled gracefully
- Cold start performance acceptable (<3s)

### Milestone 3: Results Display & Downloads (2-3 days)

**Scope:** Render outputs beautifully

**Tasks:**
- [ ] HTML chart embedded in results page
- [ ] Action plan markdown rendering
- [ ] Download buttons for all file types
- [ ] Share functionality (copy link with encoded data or short URL)
- [ ] Final polish on typography and spacing

**Verification:**
- All downloads work and files are valid
- Action plan is readable and actionable
- Chart is interactive (hover effects work)
- Share link works (if implemented)

### Milestone 4: User Testing & Polish (2-3 days)

**Scope:** Real user validation

**Tasks:**
- [ ] Deploy to production URL
- [ ] Test with 3 target users (mid-level professionals)
- [ ] Fix discovered UX issues
- [ ] Performance optimization if needed
- [ ] Final README and deployment docs

**Verification:**
- 2/3 users complete flow without confusion
- No critical bugs discovered
- Load time acceptable
- Outputs match expectations

---

## Risks and Dependencies

### Technical Risks

**SDK Compatibility with Serverless**
- Probability: Medium
- Impact: High (blocks entire backend)
- Mitigation: Early spike in Milestone 2, fallback to direct API calls

**API Cost Overruns**
- Probability: Low
- Impact: Medium (budget concern)
- Mitigation: Use cheaper models for assist, cache responses, monitor usage

**Skill Script Execution in Lambda**
- Probability: Medium
- Impact: Medium (may need to inline generation logic)
- Mitigation: Test Python script execution in Lambda environment early

### Dependencies

**External:**
- Claude Agent SDK stable release
- Anthropic API access and key
- Hosting provider (Vercel/AWS/etc.)

**Internal:**
- Mandala Chart Builder skill (complete ✓)
- Design decisions on branding/styling
- Copy/content for landing page

---

## Open Questions

1. **Hosting choice?** Vercel (simpler) vs AWS (more control). Leaning Vercel for speed.

2. **Share functionality scope?** Encode in URL params (simple but long) vs. short URL service (more complex)?

3. **Branding?** ChaiWithJai branding or standalone product? Affects domain, styling, messaging.

4. **Analytics exception?** Basic page view counting via privacy-respecting tool (Plausible/Fathom) acceptable?

5. **Upgrade path?** If successful, how does this evolve? SaaS? Maven course companion? Open source?

---

## Conclusion

This design proposes a focused, 2-week proof-of-concept that validates whether a guided web UI for Mandala Chart creation delivers value to the target audience. By constraining scope to core functionality and using test-driven acceptance criteria, we ensure the shipped product is useful, not just complete.

The architecture leverages the Claude Agent SDK's skill loading capabilities while remaining practical for serverless deployment. The verification strategy emphasizes user outcomes over technical metrics, aligning with the "hot knife through butter" philosophy—if users can complete the flow and find their action plan genuinely helpful, the product succeeds.

Next step: Review this document, finalize open questions, then begin Milestone 1.
