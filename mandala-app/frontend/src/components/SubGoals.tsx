import React from "react";

interface SubGoalsProps {
  centerGoal: string;
  pillars: string[];
  subGoals: Record<number, string[]>;
  currentPillarIndex: number;
  currentSubGoalIndex: number;
  onUpdate: (pillarIndex: number, subGoalIndex: number, value: string) => void;
  onNext: () => void;
}

export default function SubGoals({
  centerGoal,
  pillars,
  subGoals,
  currentPillarIndex,
  currentSubGoalIndex,
  onUpdate,
  onNext,
}: SubGoalsProps) {
  const currentPillar = pillars[currentPillarIndex];
  const currentPillarSubGoals = subGoals[currentPillarIndex] || [];
  const pillarProgress = currentPillarSubGoals.filter((sg) => sg.trim().length > 0).length;
  const totalProgress = Object.values(subGoals).reduce((sum, arr) => sum + arr.filter((s) => s.trim()).length, 0);

  const isCurrentPillarComplete = currentPillarSubGoals.every((sg) => sg.trim().length > 0);
  const allComplete = pillars.length * 8 === totalProgress;

  return (
    <div className="phase-container">
      <div className="progress-indicator">Step 3 of 4: Define 8 Sub-Goals per Pillar</div>
      <h2>
        Pillar {currentPillarIndex + 1}/8: <span style={{ color: "#4f46e5" }}>{currentPillar}</span>
      </h2>
      <p style={{ marginBottom: "8px" }}>
        <strong>Your goal:</strong> {centerGoal}
      </p>
      <p style={{ marginBottom: "24px", fontSize: "14px", color: "#999" }}>
        Define 8 specific, actionable items for this pillar. These can be habits, skills, metrics, or
        behaviors.
      </p>

      <div style={{ marginBottom: "24px" }}>
        {currentPillarSubGoals.map((subGoal, index) => (
          <div key={index} style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500" }}>
              Sub-goal {index + 1}
              {subGoal.trim() && " ✓"}
            </label>
            <input
              type="text"
              value={subGoal}
              onChange={(e) => onUpdate(currentPillarIndex, index, e.target.value)}
              placeholder={`e.g., Practice daily, Read 2 books per month...`}
              style={{ marginBottom: "0" }}
            />
          </div>
        ))}
      </div>

      <div className="progress-indicator" style={{ marginBottom: "24px" }}>
        This pillar: {pillarProgress}/8 | Overall: {totalProgress}/{pillars.length * 8}
      </div>

      <div className="button-group">
        <button
          onClick={onNext}
          disabled={!isCurrentPillarComplete}
          style={{ flex: 1 }}
        >
          {currentPillarIndex === 7 ? (
            allComplete ? "Generate Chart" : "Skip to Generation"
          ) : isCurrentPillarComplete ? (
            "Next Pillar"
          ) : (
            "Complete all 8 items"
          )}
        </button>
      </div>
    </div>
  );
}
