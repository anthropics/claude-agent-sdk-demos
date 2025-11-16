import React, { useReducer, useEffect } from "react";
import { ConversationState } from "./types";
import Welcome from "./components/Welcome";
import CenterGoal from "./components/CenterGoal";
import Pillars from "./components/Pillars";
import SubGoals from "./components/SubGoals";
import Generating from "./components/Generating";
import Results from "./components/Results";
import Error from "./components/Error";
import "./App.css";

type Action =
  | { type: "START" }
  | { type: "SET_CENTER_GOAL"; payload: string }
  | { type: "ADVANCE_CENTER_GOAL" }
  | { type: "SET_PILLAR"; payload: string; index: number }
  | { type: "ADVANCE_PILLAR" }
  | { type: "RESET_PILLARS" }
  | { type: "SET_SUB_GOAL"; payload: string; pillarIndex: number; subGoalIndex: number }
  | { type: "ADVANCE_SUB_GOAL" }
  | { type: "RESET_SUB_GOALS" }
  | { type: "START_GENERATING" }
  | { type: "SET_RESULTS"; payload: { json: Record<string, unknown>; html: string; actionPlan: string } }
  | { type: "SET_ERROR"; payload: string }
  | { type: "RETRY" }
  | { type: "RESTART" };

const conversationReducer = (state: ConversationState, action: Action): ConversationState => {
  switch (action.type) {
    case "START":
      return { phase: "welcome" };

    case "SET_CENTER_GOAL":
      if (state.phase === "center_goal") {
        return { ...state, draft: action.payload };
      }
      return state;

    case "ADVANCE_CENTER_GOAL":
      if (state.phase === "center_goal" && state.draft.trim()) {
        return {
          phase: "pillars",
          centerGoal: state.draft,
          pillars: ["", "", "", "", "", "", "", ""],
          currentPillarIndex: 0,
        };
      }
      return state;

    case "SET_PILLAR":
      if (state.phase === "pillars") {
        const newPillars = [...state.pillars];
        newPillars[action.index] = action.payload;
        return { ...state, pillars: newPillars };
      }
      return state;

    case "ADVANCE_PILLAR":
      if (state.phase === "pillars") {
        if (state.currentPillarIndex < 7) {
          return { ...state, currentPillarIndex: state.currentPillarIndex + 1 };
        } else {
          return {
            phase: "sub_goals",
            centerGoal: state.centerGoal,
            pillars: state.pillars,
            subGoals: Object.fromEntries(state.pillars.map((_, i) => [i, ["", "", "", "", "", "", "", ""]])),
            currentPillarIndex: 0,
            currentSubGoalIndex: 0,
          };
        }
      }
      return state;

    case "RESET_PILLARS":
      if (state.phase === "pillars") {
        return { ...state, currentPillarIndex: 0 };
      }
      return state;

    case "SET_SUB_GOAL":
      if (state.phase === "sub_goals") {
        const newSubGoals = { ...state.subGoals };
        if (!newSubGoals[action.pillarIndex]) {
          newSubGoals[action.pillarIndex] = [];
        }
        newSubGoals[action.pillarIndex][action.subGoalIndex] = action.payload;
        return { ...state, subGoals: newSubGoals };
      }
      return state;

    case "ADVANCE_SUB_GOAL":
      if (state.phase === "sub_goals") {
        if (state.currentSubGoalIndex < 7) {
          return { ...state, currentSubGoalIndex: state.currentSubGoalIndex + 1 };
        } else if (state.currentPillarIndex < 7) {
          return { ...state, currentPillarIndex: state.currentPillarIndex + 1, currentSubGoalIndex: 0 };
        } else {
          return {
            phase: "generating",
            centerGoal: state.centerGoal,
            pillars: state.pillars,
            subGoals: state.subGoals,
          };
        }
      }
      return state;

    case "RESET_SUB_GOALS":
      if (state.phase === "sub_goals") {
        return { ...state, currentPillarIndex: 0, currentSubGoalIndex: 0 };
      }
      return state;

    case "START_GENERATING":
      if (state.phase === "generating") {
        return state;
      }
      return state;

    case "SET_RESULTS":
      if (state.phase === "generating") {
        return {
          phase: "results",
          centerGoal: state.centerGoal,
          pillars: state.pillars,
          subGoals: state.subGoals,
          ...action.payload,
        };
      }
      return state;

    case "SET_ERROR":
      return {
        phase: "error",
        message: action.payload,
        previousState: state,
      };

    case "RETRY":
      if (state.phase === "error" && state.previousState) {
        return state.previousState;
      }
      return state;

    case "RESTART":
      return { phase: "welcome" };

    default:
      return state;
  }
};

export default function App() {
  const [state, dispatch] = useReducer(conversationReducer, { phase: "welcome" });

  useEffect(() => {
    // Load progress from localStorage
    const saved = localStorage.getItem("mandala_progress");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Could restore state here if needed
      } catch (e) {
        console.error("Failed to load saved progress", e);
      }
    }
  }, []);

  useEffect(() => {
    // Save progress to localStorage
    localStorage.setItem("mandala_progress", JSON.stringify(state));
  }, [state]);

  const renderPhase = () => {
    switch (state.phase) {
      case "welcome":
        return (
          <Welcome
            onStart={() => {
              dispatch({ type: "SET_CENTER_GOAL", payload: "" });
              setTimeout(() => dispatch({ type: "START" }), 0);
            }}
          />
        );
      case "center_goal":
        return (
          <CenterGoal
            draft={(state as any).draft || ""}
            onChange={(draft) => dispatch({ type: "SET_CENTER_GOAL", payload: draft })}
            onNext={() => dispatch({ type: "ADVANCE_CENTER_GOAL" })}
          />
        );
      case "pillars":
        return (
          <Pillars
            centerGoal={(state as any).centerGoal}
            pillars={(state as any).pillars}
            currentIndex={(state as any).currentPillarIndex}
            onUpdate={(index, value) => dispatch({ type: "SET_PILLAR", payload: value, index })}
            onNext={() => dispatch({ type: "ADVANCE_PILLAR" })}
          />
        );
      case "sub_goals":
        return (
          <SubGoals
            centerGoal={(state as any).centerGoal}
            pillars={(state as any).pillars}
            subGoals={(state as any).subGoals}
            currentPillarIndex={(state as any).currentPillarIndex}
            currentSubGoalIndex={(state as any).currentSubGoalIndex}
            onUpdate={(pillarIndex, subGoalIndex, value) =>
              dispatch({ type: "SET_SUB_GOAL", payload: value, pillarIndex, subGoalIndex })
            }
            onNext={() => dispatch({ type: "ADVANCE_SUB_GOAL" })}
          />
        );
      case "generating":
        return (
          <Generating
            centerGoal={(state as any).centerGoal}
            pillars={(state as any).pillars}
            subGoals={(state as any).subGoals}
            onComplete={(json, html, actionPlan) =>
              dispatch({ type: "SET_RESULTS", payload: { json, html, actionPlan } })
            }
            onError={(error) => dispatch({ type: "SET_ERROR", payload: error })}
          />
        );
      case "results":
        return (
          <Results
            centerGoal={(state as any).centerGoal}
            pillars={(state as any).pillars}
            subGoals={(state as any).subGoals}
            json={(state as any).json}
            html={(state as any).html}
            actionPlan={(state as any).actionPlan}
            onRestart={() => dispatch({ type: "RESTART" })}
          />
        );
      case "error":
        return (
          <Error
            message={(state as any).message}
            onRetry={() => dispatch({ type: "RETRY" })}
            onRestart={() => dispatch({ type: "RESTART" })}
          />
        );
      default:
        return null;
    }
  };

  return <div className="app-container">{renderPhase()}</div>;
}
