export type ConversationPhase =
  | "welcome"
  | "center_goal"
  | "pillars"
  | "sub_goals"
  | "generating"
  | "results"
  | "error";

export type ConversationState =
  | { phase: "welcome" }
  | {
      phase: "center_goal";
      draft: string;
    }
  | {
      phase: "pillars";
      centerGoal: string;
      pillars: string[];
      currentPillarIndex: number;
    }
  | {
      phase: "sub_goals";
      centerGoal: string;
      pillars: string[];
      subGoals: Record<number, string[]>;
      currentPillarIndex: number;
      currentSubGoalIndex: number;
    }
  | {
      phase: "generating";
      centerGoal: string;
      pillars: string[];
      subGoals: Record<number, string[]>;
    }
  | {
      phase: "results";
      centerGoal: string;
      pillars: string[];
      subGoals: Record<number, string[]>;
      json: Record<string, unknown>;
      html: string;
      actionPlan: string;
    }
  | {
      phase: "error";
      message: string;
      previousState?: ConversationState;
    };

export interface MandalaChart {
  centerGoal: string;
  pillars: Array<{
    name: string;
    subGoals: string[];
  }>;
  createdAt: string;
  version: string;
}
