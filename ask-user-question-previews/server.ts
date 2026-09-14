import "dotenv/config";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { WebSocket, WebSocketServer } from "ws";

if (!process.env.ANTHROPIC_API_KEY) {
  // The SDK spawns the Claude CLI, which can also auth via keychain OAuth
  // if you've run `claude login`. The env var isn't strictly required.
  console.warn(
    "ANTHROPIC_API_KEY not set. If you're logged into the Claude CLI, " +
      "this will still work. Otherwise add the key to .env.",
  );
}

// Shape of AskUserQuestion's input. Defined locally so the demo stays
// compatible if the SDK's exported type name changes between versions.
type Question = {
  question: string;
  header: string;
  multiSelect: boolean;
  options: Array<{ label: string; description: string; preview?: string }>;
};
type AskInput = { questions: Question[] };

const server = createServer();
const wss = new WebSocketServer({ server, path: "/ws" });

// canUseTool blocks until the browser answers. Each pending entry holds a
// promise resolver keyed by request id; the WebSocket message handler looks it up
// and resolves it when the answer arrives. Entries also track the owning
// WebSocket so they can be rejected if that socket closes mid-wait.
const pending = new Map<
  string,
  { ws: WebSocket; resolve: (label: string) => void; reject: (err: Error) => void }
>();

wss.on("connection", (ws) => {
  ws.on("message", (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.type === "prompt") {
      void runQuery(ws, msg.text);
    } else if (msg.type === "answer") {
      pending.get(msg.id)?.resolve(msg.label);
      pending.delete(msg.id);
    }
  });
  // Reject any outstanding waits for this socket on disconnect so the
  // query() loop unwinds instead of hanging indefinitely.
  ws.on("close", () => {
    for (const [id, entry] of pending) {
      if (entry.ws === ws) {
        entry.reject(new Error("client disconnected"));
        pending.delete(id);
      }
    }
  });
});

function send(ws: WebSocket, payload: unknown) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

async function runQuery(ws: WebSocket, prompt: string) {
  send(ws, { type: "status", text: "starting..." });
  try {
    for await (const msg of query({
      prompt,
      options: {
        model: "sonnet",
        systemPrompt:
          "You are a branding assistant. When the user asks for help branding a " +
          "site or product, gather their preferences first: ask about color " +
          "palette, typography/style, overall vibe, and anything else that shapes " +
          "the direction. Use AskUserQuestion for each decision point and include " +
          "an HTML preview on each option so they can see what they're choosing. " +
          "Always use the AskUserQuestion tool to ask questions. Never ask " +
          "questions in your text output; the user can only respond through the " +
          "tool's UI. Ask one or two questions at a time; don't overwhelm.\n\n" +
          "Every option must be self-contained. Never offer options like 'I have " +
          "my own idea' or 'I'll tell you later' that require follow-up input. " +
          "The user has a free-text box for that; your options should all be " +
          "concrete choices with previews.\n\n" +
          "When you have gathered enough, exit plan mode and output the final " +
          "brand guide directly as markdown: color hex codes, font names, " +
          "spacing/radius values, and a usage summary. You have no write tools " +
          "available, so the markdown IS the deliverable.",
        // Plan mode: Claude researches and asks clarifying questions before
        // acting. AskUserQuestion still fires in plan mode, and the docs note
        // this mode makes Claude more likely to ask.
        permissionMode: "plan",
        // Restrict available tools to just AskUserQuestion.
        tools: ["AskUserQuestion"],
        // Opt into HTML previews (the feature this demo showcases).
        toolConfig: { askUserQuestion: { previewFormat: "html" } },
        canUseTool: async (toolName, input) => {
          // ToolSearch and ExitPlanMode are SDK infrastructure: Claude uses
          // them to load AskUserQuestion and to wrap up plan mode. You'll see
          // them fire even though we only listed AskUserQuestion in `tools`.
          // Let them pass through unchanged.
          if (toolName === "ToolSearch" || toolName === "ExitPlanMode") {
            return { behavior: "allow", updatedInput: input };
          }
          if (toolName !== "AskUserQuestion") {
            return {
              behavior: "deny",
              message:
                "Ask the user another question with AskUserQuestion instead.",
            };
          }
          const questions = (input as AskInput).questions;
          const answers: Record<string, string> = {};

          // Ask each question in turn, blocking until the browser picks.
          send(ws, { type: "status", text: "waiting for your pick..." });
          for (const q of questions) {
            // The close handler cannot reject a wait created after disconnect.
            if (ws.readyState !== WebSocket.OPEN) {
              throw new Error("client disconnected");
            }
            const id = randomUUID();
            const label = await new Promise<string>((resolve, reject) => {
              pending.set(id, { ws, resolve, reject });
              send(ws, { type: "question", id, question: q });
            });
            answers[q.question] = label;
          }
          send(ws, { type: "status", text: "applying your choices..." });

          return {
            behavior: "allow",
            updatedInput: { questions, answers },
          };
        },
      },
    })) {
      // query() yields a stream of messages representing the conversation as
      // it unfolds: system init, assistant turns (text + tool_use blocks),
      // user turns (tool results fed back to the model), and a final result.
      // This loop maps each message type to a browser status update so the
      // UI can show what Claude is doing at each stage.
      console.log(`[stream] ${msg.type}${"subtype" in msg ? `/${msg.subtype}` : ""}`);

      if (msg.type === "system" && msg.subtype === "init") {
        send(ws, { type: "status", text: "thinking..." });
      }

      if (msg.type === "assistant") {
        // Each assistant message contains content blocks: text (markdown
        // output) and tool_use (a tool call like AskUserQuestion). Forward
        // text to the browser and update the status for tool calls.
        const blocks = msg.message.content;
        for (const block of blocks) {
          console.log(`  block: ${block.type}${block.type === "tool_use" ? ` (${block.name})` : ""}`);
          if (block.type === "text") {
            send(ws, { type: "text", text: block.text });
          }
          if (block.type === "tool_use") {
            send(ws, { type: "status", text: `calling ${block.name}...` });
          }
        }
        // If this assistant turn ended on text or thinking (not tool_use),
        // generation is still in progress. Keep the spinner visible until
        // canUseTool fires or the result message arrives.
        const last = blocks[blocks.length - 1];
        if (last?.type === "text" || last?.type === "thinking") {
          send(ws, { type: "status", text: "generating..." });
        }
      }

      // A "user" message here means a tool result was fed back to the model,
      // which is now generating the next turn. Update status so the previous
      // "calling X..." text does not go stale.
      if (msg.type === "user") {
        send(ws, { type: "status", text: "generating..." });
      }

      if (msg.type === "result") {
        send(ws, { type: "status", text: "" });
        send(ws, { type: "done" });
      }
    }
  } catch (err) {
    console.error("query() failed:", err);
    send(ws, { type: "status", text: "" });
    send(ws, { type: "text", text: `Error: ${err}` });
    send(ws, { type: "done" });
  }
}

server.listen(3001, () => {
  console.log("server on :3001, ws at /ws");
});
