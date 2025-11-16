import React, { useEffect } from "react";

interface GeneratingProps {
  centerGoal: string;
  pillars: string[];
  subGoals: Record<number, string[]>;
  onComplete: (json: Record<string, unknown>, html: string, actionPlan: string) => void;
  onError: (error: string) => void;
}

export default function Generating({ centerGoal, pillars, subGoals, onComplete, onError }: GeneratingProps) {
  useEffect(() => {
    const generate = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            centerGoal,
            pillars: pillars.map((name, index) => ({
              name,
              subGoals: subGoals[index] || [],
            })),
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const result = await response.json();
        onComplete(result.json, result.html, result.actionPlan);
      } catch (error) {
        onError(error instanceof Error ? error.message : "Failed to generate chart. Please try again.");
      }
    };

    generate();
  }, [centerGoal, pillars, subGoals, onComplete, onError]);

  return (
    <div className="phase-container loading">
      <div className="spinner"></div>
      <h2 style={{ marginTop: "24px" }}>Generating your Mandala Chart...</h2>
      <p style={{ color: "#999", marginTop: "12px" }}>This may take a moment</p>
    </div>
  );
}
