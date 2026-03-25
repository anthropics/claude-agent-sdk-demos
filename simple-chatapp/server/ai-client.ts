import { unstable_v2_createSession } from "@anthropic-ai/claude-agent-sdk";

const SYSTEM_PROMPT = `You are a helpful AI assistant. You can help users with a wide variety of tasks including:
- Answering questions
- Writing and editing text
- Coding and debugging
- Analysis and research
- Creative tasks

Be concise but thorough in your responses.`;

type Session = Awaited<ReturnType<typeof unstable_v2_createSession>>;

export class AgentSession {
  private session!: Session;

  private constructor() {}

  static async create(): Promise<AgentSession> {
    const instance = new AgentSession();
    instance.session = await unstable_v2_createSession({
      model: "opus",
      maxTurns: 100,
      permissionMode: "acceptEdits",
      tools: [
        "Bash",
        "Read",
        "Write",
        "Edit",
        "Glob",
        "Grep",
        "WebSearch",
        "WebFetch",
      ],
      systemPrompt: SYSTEM_PROMPT,
    });
    return instance;
  }

  async sendMessage(content: string) {
    await this.session.send(content);
  }

  async *getOutputStream() {
    for await (const msg of this.session.receive()) {
      yield msg;
    }
  }

  close() {
    this.session.close();
  }
}
