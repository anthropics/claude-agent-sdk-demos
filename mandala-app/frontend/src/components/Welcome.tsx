import React from "react";

interface WelcomeProps {
  onStart: () => void;
}

export default function Welcome({ onStart }: WelcomeProps) {
  return (
    <div className="phase-container welcome-content">
      <h1>🎯 Mandala Chart Builder</h1>
      <p>
        Create your 9x9 goal decomposition chart using the proven Mandala methodology, popularized by Shohei
        Ohtani.
      </p>

      <ul className="feature-list">
        <li>Define your ultimate goal in the center</li>
        <li>Identify 8 major pillars for success</li>
        <li>Break each pillar into 8 specific sub-goals</li>
        <li>Get a personalized action plan</li>
      </ul>

      <p style={{ fontSize: "14px", color: "#999", marginBottom: "32px" }}>
        This process takes about 20 minutes. You can save your progress and come back later.
      </p>

      <button onClick={onStart} style={{ width: "100%", padding: "16px", fontSize: "18px" }}>
        Start Building Your Chart
      </button>
    </div>
  );
}
