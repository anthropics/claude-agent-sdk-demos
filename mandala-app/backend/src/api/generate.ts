import { query, type ClaudeAgentOptions } from "claude-agent-sdk";

interface PillarData {
  name: string;
  subGoals: string[];
}

interface GenerateResult {
  json: Record<string, unknown>;
  html: string;
  actionPlan: string;
}

export async function generateChart(centerGoal: string, pillars: PillarData[]): Promise<GenerateResult> {
  // Create the prompt for the Claude Agent
  const pillarText = pillars
    .map((p, i) => `${i + 1}. ${p.name}\n   ${p.subGoals.map((sg) => `- ${sg}`).join("\n   ")}`)
    .join("\n");

  const prompt = `I need you to generate a complete Mandala Chart based on the following information:

Center Goal: ${centerGoal}

Pillars and Sub-Goals:
${pillarText}

Please generate:
1. A JSON data structure with the complete chart information
2. An HTML visualization of the 9x9 Mandala Chart
3. A personalized action plan

Make sure:
- The JSON follows proper structure with centerGoal, pillars array, and metadata
- The HTML includes a grid-based visualization with colors (yellow center, gray pillars, white sub-goals)
- The action plan is specific to the user's goals and includes immediate actions, priorities, and success indicators`;

  const options: ClaudeAgentOptions = {
    setting_sources: ["project"],
  };

  // Use Claude Agent SDK to generate outputs
  let results = {
    json: {},
    html: "",
    actionPlan: "",
  };

  try {
    for await (const message of query(prompt, options)) {
      // Parse responses from Claude
      // This is a simplified version - in production you'd want more sophisticated parsing
      console.log("Message from Claude:", message);
    }
  } catch (error) {
    console.error("SDK query error:", error);
    // Fallback to mock generation
    results = generateMockChart(centerGoal, pillars);
  }

  // If the SDK didn't return proper results, use mock
  if (!results.json || Object.keys(results.json).length === 0) {
    results = generateMockChart(centerGoal, pillars);
  }

  return results;
}

function generateMockChart(centerGoal: string, pillars: PillarData[]) {
  // Mock chart generation for demonstration
  const json = {
    centerGoal,
    pillars: pillars.map((p) => ({
      name: p.name,
      subGoals: p.subGoals,
    })),
    createdAt: new Date().toISOString(),
    version: "1.0",
  };

  const html = generateMockHTML(centerGoal, pillars);
  const actionPlan = generateMockActionPlan(centerGoal, pillars);

  return {
    json,
    html,
    actionPlan,
  };
}

function generateMockHTML(centerGoal: string, pillars: PillarData[]): string {
  const cellSize = 60;
  const gridSize = 9;
  const totalSize = cellSize * gridSize;

  let html = `<!DOCTYPE html>
<html>
<head>
  <title>Mandala Chart: ${centerGoal}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      text-align: center;
      margin-bottom: 30px;
      color: #333;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(9, ${cellSize}px);
      grid-template-rows: repeat(9, ${cellSize}px);
      gap: 1px;
      background-color: #ddd;
      padding: 1px;
      margin-bottom: 30px;
    }
    .cell {
      background-color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: 10px;
      padding: 4px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .cell:hover {
      transform: scale(1.05);
      background-color: #f9f9f9;
    }
    .center {
      background-color: #ffd700;
      font-weight: bold;
      grid-column: 5;
      grid-row: 5;
    }
    .pillar-center {
      background-color: #d3d3d3;
      font-weight: bold;
    }
    .sub-goal {
      background-color: #fff;
    }
    .legend {
      margin-top: 20px;
      padding: 20px;
      background-color: #f9f9f9;
      border-radius: 4px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
    }
    .legend-color {
      width: 20px;
      height: 20px;
      margin-right: 10px;
      border-radius: 2px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎯 Mandala Chart: ${centerGoal}</h1>
    <div class="grid">`;

  // Generate grid cells
  for (let row = 1; row <= 9; row++) {
    for (let col = 1; col <= 9; col++) {
      // Center cell
      if (row === 5 && col === 5) {
        const shortGoal = centerGoal.substring(0, 25);
        html += `<div class="cell center" title="${centerGoal}">${shortGoal}</div>`;
      }
      // Pillar cells (centers of each 3x3 section)
      else if (
        (row === 2 || row === 5 || row === 8) &&
        (col === 2 || col === 5 || col === 8) &&
        !(row === 5 && col === 5)
      ) {
        const pillarIndex = (row === 2 ? 0 : row === 5 ? 3 : 6) + (col === 2 ? 0 : col === 5 ? 1 : 2);
        if (pillarIndex < pillars.length) {
          const pillarName = pillars[pillarIndex].name.substring(0, 10);
          html += `<div class="cell pillar-center" title="${pillars[pillarIndex].name}">${pillarName}</div>`;
        }
      }
      // Sub-goal cells
      else {
        // Determine which pillar this cell belongs to
        const sectionRow = Math.floor((row - 1) / 3);
        const sectionCol = Math.floor((col - 1) / 3);
        const pillarIndex = sectionRow * 3 + sectionCol;

        if (pillarIndex < pillars.length) {
          const pillar = pillars[pillarIndex];
          const localRow = ((row - 1) % 3) + 1;
          const localCol = ((col - 1) % 3) + 1;
          const subGoalIndex = (localRow - 1) * 3 + (localCol - 1);

          if (subGoalIndex < pillar.subGoals.length) {
            const subGoal = pillar.subGoals[subGoalIndex].substring(0, 12);
            html += `<div class="cell sub-goal" title="${pillar.subGoals[subGoalIndex]}">${subGoal}</div>`;
          } else {
            html += `<div class="cell sub-goal"></div>`;
          }
        }
      }
    }
  }

  html += `    </div>
    <div class="legend">
      <h3>Legend</h3>
      <div class="legend-item">
        <div class="legend-color" style="background-color: #ffd700;"></div>
        <span>Center Goal</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background-color: #d3d3d3;"></div>
        <span>Pillars (8 major domains)</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background-color: #fff; border: 1px solid #999;"></div>
        <span>Sub-Goals (8 per pillar)</span>
      </div>
    </div>
  </div>
</body>
</html>`;

  return html;
}

function generateMockActionPlan(centerGoal: string, pillars: PillarData[]): string {
  let plan = `MANDALA CHART ACTION PLAN
==========================

Goal: ${centerGoal}

EXECUTIVE SUMMARY
-----------------
Your Mandala Chart has been created with 8 major pillars and 64 specific sub-goals. This action plan provides a roadmap for achieving your vision.

PILLARS & FOCUS AREAS
---------------------
`;

  pillars.forEach((pillar, index) => {
    plan += `\n${index + 1}. ${pillar.name.toUpperCase()}\n`;
    plan += `   Sub-goals:\n`;
    pillar.subGoals.forEach((sg) => {
      plan += `   • ${sg}\n`;
    });
  });

  plan += `\n\nIMEDIATE ACTIONS (THIS WEEK)
-----------------------------
1. Review your complete Mandala Chart and ensure each pillar feels aligned with your goal
2. Choose 2-3 pillars to focus on first - typically foundation/skill pillars
3. Schedule 30-minute blocks this week to work on your top 3 sub-goals
4. Share your chart with an accountability partner for feedback

WEEKLY REVIEW RITUAL
-------------------
Every Sunday evening, spend 15 minutes:
1. Review progress on each of your 8 pillars (green/yellow/red status)
2. Identify which pillars need more attention next week
3. Update your sub-goal status
4. Adjust priorities if needed

90-DAY MILESTONES
-----------------
• Month 1: Establish habits in 3-4 pillars, show measurable progress
• Month 2: Expand to 5-6 pillars, deepen skills in first pillars
• Month 3: Integrate all 8 pillars into your weekly rhythm, prepare for next phase

SUCCESS INDICATORS
------------------
You're on track when:
• You're spending focused time on all 8 pillars each week
• Your sub-goals feel increasingly achievable
• You can articulate how each pillar connects to your center goal
• Progress is visible in at least 5 of your 8 pillars

WARNING SIGNS
--------------
Watch for:
• Neglecting 3+ pillars for more than 2 weeks
• Sub-goals feeling too vague or unrelated to main goal
• Loss of clarity on how sub-goals connect to your vision
• Burnout from trying to progress all 64 items simultaneously (focus on 8-16 at a time)

CUSTOMIZATION NOTES
-------------------
This is YOUR chart. Feel free to:
• Adjust pillar names as your understanding deepens
• Update sub-goals based on new learning
• Reprioritize based on changing circumstances
• Share and refine with mentors and peers

Next Review: 1 week from now
Chart Created: ${new Date().toLocaleDateString()}`;

  return plan;
}
