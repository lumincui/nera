#!/usr/bin/env node

const serverURL = process.env.NERA_SERVER_URL || "http://127.0.0.1:8787";
const sidecarID = process.env.NERA_SIDECAR_ID || "sidecar-mac-dev";
const sessionID = process.env.NERA_SESSION_ID || "dev-session";

const command = process.argv[2];
const args = process.argv.slice(3);

try {
  if (command === "question") {
    await sendQuestion(args.join(" ").trim());
  } else if (command === "idle") {
    await sendIdle(args.join(" ").trim());
  } else if (command === "poll") {
    await pollResponses(Number(process.env.NERA_AFTER || 0));
  } else if (command === "codex") {
    await handleCodex(args[0]);
  } else {
    printUsage();
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

async function sendQuestion(body) {
  const event = {
    event_id: `question-${Date.now()}`,
    type: "question",
    sidecar_id: sidecarID,
    agent: "Codex",
    session_id: sessionID,
    title: "Codex needs clarification",
    body: body || "Which interaction should Nera validate first?",
    choices: ["Question action", "Idle notification", "Permission later"],
  };

  const result = await postJSON("/events", event);
  printJSON(result);
}

async function sendIdle(body) {
  const event = {
    event_id: `idle-${Date.now()}`,
    type: "idle",
    sidecar_id: sidecarID,
    agent: "Codex",
    session_id: sessionID,
    title: "Codex finished the task",
    body: body || "The current turn is complete and ready for review.",
    choices: [],
  };

  const result = await postJSON("/events", event);
  printJSON(result);
}

async function pollResponses(after) {
  const search = new URLSearchParams({
    sidecar_id: sidecarID,
    after: String(after),
  });
  const result = await getJSON(`/sidecar/responses?${search}`);
  printJSON(result);
}

async function handleCodex(kind) {
  const input = await readStdinJSON();

  if (kind === "stop") {
    await sendCodexStop(input);
    printJSON({ continue: true });
    return;
  }

  if (kind === "question") {
    const result = await sendCodexQuestion(input);
    printJSON({
      continue: true,
      nera: result,
    });
    return;
  }

  throw new Error("codex command must be question or stop");
}

async function sendCodexStop(input) {
  const event = {
    event_id: `codex-stop-${input.turn_id || Date.now()}`,
    type: "idle",
    sidecar_id: sidecarID,
    agent: "Codex",
    session_id: input.session_id || sessionID,
    title: "Codex finished the task",
    body: summarizeStop(input),
    choices: [],
    codex: codexContext(input),
  };

  return postJSON("/events", event);
}

async function sendCodexQuestion(input) {
  const event = {
    event_id: `codex-question-${input.turn_id || Date.now()}`,
    type: "question",
    sidecar_id: sidecarID,
    agent: "Codex",
    session_id: input.session_id || sessionID,
    title: input.title || "Codex needs clarification",
    body: input.question || input.body || input.last_assistant_message || "Codex needs your input.",
    choices: Array.isArray(input.choices) ? input.choices : ["Answer in text", "Review context"],
    codex: codexContext(input),
  };

  return postJSON("/events", event);
}

function summarizeStop(input) {
  const summary = String(input.last_assistant_message || "").trim();
  if (summary.length > 240) {
    return `${summary.slice(0, 237)}...`;
  }
  return summary || "Codex turn stopped.";
}

function codexContext(input) {
  return {
    hook_event_name: input.hook_event_name || "",
    session_id: input.session_id || "",
    turn_id: input.turn_id || "",
    cwd: input.cwd || "",
    transcript_path: input.transcript_path || "",
    model: input.model || "",
  };
}

async function postJSON(path, payload) {
  const response = await fetch(`${serverURL}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

async function getJSON(path) {
  const response = await fetch(`${serverURL}${path}`);
  return parseResponse(response);
}

async function parseResponse(response) {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = payload.message || payload.error || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

async function readStdinJSON() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const text = Buffer.concat(chunks).toString("utf8").trim();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("stdin must be a JSON object");
  }
}

function printJSON(payload) {
  console.log(JSON.stringify(payload, null, 2));
}

function printUsage() {
  console.log(`Usage:
  nera-sidecar question [text]
  nera-sidecar idle [summary]
  nera-sidecar poll
  nera-sidecar codex question < hook-input.json
  nera-sidecar codex stop < hook-input.json
`);
}
