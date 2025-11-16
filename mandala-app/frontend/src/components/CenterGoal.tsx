import React from "react";

interface CenterGoalProps {
  draft: string;
  onChange: (value: string) => void;
  onNext: () => void;
}

export default function CenterGoal({ draft, onChange, onNext }: CenterGoalProps) {
  const isValid = draft.trim().length > 0;

  return (
    <div className="phase-container">
      <div className="progress-indicator">Step 1 of 4: Define Your Center Goal</div>
      <h2>What is your ultimate goal?</h2>
      <p>
        This is the transformation you want to achieve. Be specific and aspirational. Examples:
      </p>
      <ul style={{ marginLeft: "20px", marginBottom: "20px", color: "#666" }}>
        <li>"Become renowned teacher of holistic programming"</li>
        <li>"Launch a profitable SaaS generating $10K MRR"</li>
        <li>"Get drafted first overall in professional baseball"</li>
      </ul>

      <textarea
        value={draft}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your ultimate goal here..."
        style={{ marginBottom: "24px" }}
      />

      <div style={{ fontSize: "14px", color: "#999", marginBottom: "24px" }}>
        {draft.trim().length} characters
      </div>

      <button onClick={onNext} disabled={!isValid} style={{ width: "100%" }}>
        Next: Identify Pillars
      </button>
    </div>
  );
}
