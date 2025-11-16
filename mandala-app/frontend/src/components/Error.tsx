import React from "react";

interface ErrorProps {
  message: string;
  onRetry: () => void;
  onRestart: () => void;
}

export default function Error({ message, onRetry, onRestart }: ErrorProps) {
  return (
    <div className="phase-container">
      <div className="error-container">
        <h2 style={{ color: "#dc2626", marginBottom: "12px" }}>⚠️ Something went wrong</h2>
        <p style={{ color: "#dc2626" }}>{message}</p>
      </div>

      <p style={{ marginBottom: "24px", color: "#666" }}>
        We encountered an issue while generating your chart. Your progress has been saved.
      </p>

      <div className="button-group">
        <button onClick={onRetry} style={{ flex: 1 }}>
          Try Again
        </button>
        <button onClick={onRestart} style={{ flex: 1, backgroundColor: "#6b7280" }}>
          Start Over
        </button>
      </div>
    </div>
  );
}
