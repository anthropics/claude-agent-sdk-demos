import { EventEmitter } from "node:events";
import { EmailSearcher } from "./email-search";

function fetchEmail(chunks: Buffer[]): Promise<any> {
  const searcher = new EmailSearcher({
    user: "reader@example.test",
    password: "test-password",
    host: "imap.example.test",
    port: 993,
    tls: true,
    tlsOptions: { servername: "imap.example.test" },
  });
  const fetch = new EventEmitter();
  const message = new EventEmitter();
  const body = new EventEmitter();

  Object.defineProperty(searcher, "imap", {
    value: { fetch: () => fetch },
  });

  const result = searcher.fetchEmail(1);
  fetch.emit("message", message);
  message.emit("body", body);
  for (const chunk of chunks) {
    body.emit("data", chunk);
  }
  body.emit("end");
  message.emit("end");
  fetch.emit("end");
  return result;
}

function emailHeaders(charset: string): Buffer {
  return Buffer.from([
    "From: sender@example.test",
    "To: reader@example.test",
    "Subject: Encoding regression",
    "MIME-Version: 1.0",
    `Content-Type: text/plain; charset=${charset}`,
    "Content-Transfer-Encoding: 8bit",
    "",
    "",
  ].join("\r\n"));
}

describe("EmailSearcher.fetchEmail", () => {
  test("preserves UTF-8 characters split across IMAP body chunks", async () => {
    const text = "caf\u00e9 \ud83d\ude80";
    const body = Buffer.from(text);
    const parsed = await fetchEmail([
      emailHeaders("utf-8"),
      ...Array.from(body, byte => Buffer.from([byte])),
    ]);

    expect(parsed.subject).toBe("Encoding regression");
    expect(parsed.text).toBe(text);
  });

  test("lets the MIME parser decode the declared charset", async () => {
    const parsed = await fetchEmail([
      emailHeaders("iso-8859-1"),
      Buffer.from([0x63, 0x61, 0x66, 0xe9]),
    ]);

    expect(parsed.text).toBe("caf\u00e9");
  });

  test("still parses an ASCII body", async () => {
    const parsed = await fetchEmail([
      emailHeaders("us-ascii"),
      Buffer.from("Hello world"),
    ]);

    expect(parsed.text).toBe("Hello world");
  });

  test("still rejects an empty fetch", async () => {
    await expect(fetchEmail([])).rejects.toThrow("No email data received");
  });

  test("still rejects messages above the 50 MiB limit", async () => {
    await expect(fetchEmail([
      Buffer.alloc(50 * 1024 * 1024 + 1),
    ])).rejects.toThrow("Email too large (exceeds 50MB limit)");
  });
});
