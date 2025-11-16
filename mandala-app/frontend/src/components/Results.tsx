import React, { useState } from "react";

interface ResultsProps {
  centerGoal: string;
  pillars: string[];
  subGoals: Record<number, string[]>;
  json: Record<string, unknown>;
  html: string;
  actionPlan: string;
  onRestart: () => void;
}

export default function Results({ centerGoal, pillars, subGoals, json, html, actionPlan, onRestart }: ResultsProps) {
  const [activeTab, setActiveTab] = useState<"chart" | "plan" | "data">("chart");

  const downloadJSON = () => {
    const dataStr = JSON.stringify(json, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mandala-chart-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
  };

  const downloadHTML = () => {
    const dataBlob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mandala-chart-${new Date().toISOString().split("T")[0]}.html`;
    link.click();
  };

  const downloadActionPlan = () => {
    const dataStr = actionPlan;
    const dataBlob = new Blob([dataStr], { type: "text/plain" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `action-plan-${new Date().toISOString().split("T")[0]}.txt`;
    link.click();
  };

  return (
    <div className="phase-container">
      <div className="progress-indicator">✓ Complete</div>
      <h2>Your Mandala Chart is Ready!</h2>
      <p style={{ marginBottom: "24px" }}>
        <strong>Goal:</strong> {centerGoal}
      </p>

      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", borderBottom: "1px solid #eee" }}>
        <button
          onClick={() => setActiveTab("chart")}
          style={{
            flex: 1,
            backgroundColor: activeTab === "chart" ? "#4f46e5" : "#f0f0f0",
            color: activeTab === "chart" ? "white" : "#333",
            borderRadius: "8px 8px 0 0",
            border: "none",
          }}
        >
          Chart
        </button>
        <button
          onClick={() => setActiveTab("plan")}
          style={{
            flex: 1,
            backgroundColor: activeTab === "plan" ? "#4f46e5" : "#f0f0f0",
            color: activeTab === "plan" ? "white" : "#333",
            borderRadius: "8px 8px 0 0",
            border: "none",
          }}
        >
          Action Plan
        </button>
        <button
          onClick={() => setActiveTab("data")}
          style={{
            flex: 1,
            backgroundColor: activeTab === "data" ? "#4f46e5" : "#f0f0f0",
            color: activeTab === "data" ? "white" : "#333",
            borderRadius: "8px 8px 0 0",
            border: "none",
          }}
        >
          Data
        </button>
      </div>

      {activeTab === "chart" && (
        <div className="results-container">
          <div className="chart-preview" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      )}

      {activeTab === "plan" && (
        <div className="results-container">
          <div className="action-plan">{actionPlan}</div>
        </div>
      )}

      {activeTab === "data" && (
        <div className="results-container">
          <pre style={{ backgroundColor: "#f5f5f5", padding: "16px", borderRadius: "8px", overflow: "auto" }}>
            {JSON.stringify(json, null, 2)}
          </pre>
        </div>
      )}

      <div className="download-buttons" style={{ marginTop: "24px" }}>
        <button onClick={downloadJSON}>📥 Download JSON</button>
        <button onClick={downloadHTML}>📥 Download Chart</button>
        <button onClick={downloadActionPlan}>📥 Download Plan</button>
      </div>

      <div className="button-group" style={{ marginTop: "24px" }}>
        <button onClick={onRestart} style={{ flex: 1, backgroundColor: "#6b7280" }}>
          Create Another Chart
        </button>
      </div>
    </div>
  );
}
