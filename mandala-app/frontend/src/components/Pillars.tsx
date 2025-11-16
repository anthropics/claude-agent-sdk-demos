import React from "react";

interface PillarsProps {
  centerGoal: string;
  pillars: string[];
  currentIndex: number;
  onUpdate: (index: number, value: string) => void;
  onNext: () => void;
}

export default function Pillars({ centerGoal, pillars, currentIndex, onUpdate, onNext }: PillarsProps) {
  const allFilled = pillars.every((p) => p.trim().length > 0);
  const progress = pillars.filter((p) => p.trim().length > 0).length;

  return (
    <div className="phase-container">
      <div className="progress-indicator">Step 2 of 4: Define 8 Pillars</div>
      <h2>What are your 8 major domains?</h2>
      <p style={{ marginBottom: "8px" }}>
        <strong>Your goal:</strong> {centerGoal}
      </p>
      <p style={{ marginBottom: "24px", fontSize: "14px", color: "#999" }}>
        These are the major areas you need to master to achieve your goal.
      </p>

      <div style={{ marginBottom: "24px" }}>
        {pillars.map((pillar, index) => (
          <div key={index} style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
              Pillar {index + 1}
              {pillar.trim() && " ✓"}
            </label>
            <input
              type="text"
              value={pillar}
              onChange={(e) => onUpdate(index, e.target.value)}
              placeholder={`e.g., Technical Skills, Mindset, Financial Planning...`}
              style={{ marginBottom: "0" }}
            />
          </div>
        ))}
      </div>

      <div className="progress-indicator" style={{ marginBottom: "24px" }}>
        Progress: {progress}/8 pillars defined
      </div>

      <button onClick={onNext} disabled={!allFilled} style={{ width: "100%" }}>
        {allFilled ? "Next: Define Sub-Goals" : `Complete all 8 pillars to continue`}
      </button>
    </div>
  );
}
