import { useEffect, useRef, useState } from "react";

/**
 * WebSocket plumbing: connects to the server, auto-reconnects on disconnect,
 * and dispatches incoming messages to local state. Not part of the
 * AskUserQuestion/preview feature being demoed; just the transport.
 */

export type Option = { label: string; description: string; preview?: string };
export type Question = {
  question: string;
  header: string;
  options: Option[];
};
export type PendingQuestion = { id: string; question: Question };

export function useAgentSocket(url: string) {
  const ws = useRef<WebSocket | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [pending, setPending] = useState<PendingQuestion | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let sock: WebSocket;
    let retry: ReturnType<typeof setTimeout>;
    let shutdown = false;

    function connect() {
      sock = new WebSocket(url);
      ws.current = sock;
      sock.onopen = () => setConnected(true);
      sock.onclose = () => {
        setConnected(false);
        setBusy(false);
        setPending(null);
        setStatus("");
        if (!shutdown) retry = setTimeout(connect, 1000);
      };
      sock.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === "status") setStatus(msg.text);
        if (msg.type === "question")
          setPending({ id: msg.id, question: msg.question });
        if (msg.type === "text") setLog((l) => [...l, msg.text]);
        if (msg.type === "done") {
          setLog((l) => [...l, "— done —"]);
          setBusy(false);
        }
      };
    }
    connect();
    return () => {
      shutdown = true;
      clearTimeout(retry);
      sock?.close();
    };
  }, [url]);

  function submit(prompt: string) {
    if (ws.current?.readyState !== WebSocket.OPEN) return;
    setLog([]);
    setBusy(true);
    ws.current.send(JSON.stringify({ type: "prompt", text: prompt }));
  }

  function answer(label: string) {
    if (!pending) return;
    ws.current?.send(JSON.stringify({ type: "answer", id: pending.id, label }));
    setPending(null);
    setLog((l) => [...l, `→ chose: ${label}`]);
  }

  return { log, pending, status, busy, connected, submit, answer };
}
