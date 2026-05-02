import http from "node:http";

const port = Number(process.env.NERA_SERVER_PORT || 8787);
const debugRoutesEnabled = process.env.NERA_ENABLE_DEBUG_ROUTES === "1";

const pairing = {
  pair_id: "dev-pair-local-001",
  sidecar_id: "sidecar-mac-dev",
  touchpoint_id: "touchpoint-ios-dev",
  relay_channel: "relay-dev-hardcoded",
  apns_environment: "sandbox",
};

const state = {
  sequence: 0,
  events: [],
  responses: [],
  pushIntents: [],
};

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);

    if (request.method === "GET" && url.pathname === "/health") {
      return sendJSON(response, 200, {
        ok: true,
        service: "nera-server",
        pairing,
      });
    }

    if (request.method === "GET" && url.pathname === "/pairing") {
      return sendJSON(response, 200, pairing);
    }

    if (request.method === "POST" && url.pathname === "/events") {
      const body = await readJSON(request);
      const event = normalizeEvent(body);
      state.events.push(event);
      state.pushIntents.push(createPushIntent(event));
      return sendJSON(response, 202, {
        accepted: true,
        event,
        push_intent: state.pushIntents.at(-1),
      });
    }

    if (request.method === "GET" && url.pathname === "/touchpoint/events") {
      assertTouchpoint(url.searchParams.get("touchpoint_id"));
      const after = Number(url.searchParams.get("after") || 0);
      const events = state.events.filter((event) => event.sequence > after);
      return sendJSON(response, 200, { events });
    }

    if (request.method === "POST" && url.pathname === "/touchpoint/responses") {
      const body = await readJSON(request);
      const touchpointResponse = normalizeTouchpointResponse(body);
      state.responses.push(touchpointResponse);
      return sendJSON(response, 202, {
        accepted: true,
        response: touchpointResponse,
      });
    }

    if (request.method === "GET" && url.pathname === "/sidecar/responses") {
      assertSidecar(url.searchParams.get("sidecar_id"));
      const after = Number(url.searchParams.get("after") || 0);
      const responses = state.responses.filter((item) => item.sequence > after);
      return sendJSON(response, 200, { responses });
    }

    if (request.method === "GET" && url.pathname === "/debug/state" && debugRoutesEnabled) {
      return sendJSON(response, 200, state);
    }

    return sendJSON(response, 404, { error: "not_found" });
  } catch (error) {
    return sendJSON(response, error.statusCode || 500, {
      error: error.code || "internal_error",
      message: error.message,
    });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`nera-server listening on http://127.0.0.1:${port}`);
});

function normalizeEvent(body) {
  if (!["question", "idle"].includes(body.type)) {
    throw httpError(400, "invalid_event_type", "event type must be question or idle");
  }

  assertSidecar(body.sidecar_id);

  return {
    sequence: nextSequence(),
    event_id: body.event_id || `${body.type}-${Date.now()}`,
    type: body.type,
    sidecar_id: body.sidecar_id,
    touchpoint_id: pairing.touchpoint_id,
    agent: body.agent || "Codex",
    session_id: body.session_id || "dev-session",
    title: body.title || defaultTitle(body.type),
    body: body.body || "",
    choices: Array.isArray(body.choices) ? body.choices : [],
    codex: body.codex || null,
    created_at: new Date().toISOString(),
  };
}

function normalizeTouchpointResponse(body) {
  assertTouchpoint(body.touchpoint_id);

  if (!["answer_question", "completion_notification", "open_review"].includes(body.type)) {
    throw httpError(400, "invalid_response_type", "unsupported touchpoint response type");
  }

  return {
    sequence: nextSequence(),
    message_id: body.message_id || `msg-${Date.now()}`,
    request_id: requireString(body.request_id, "request_id"),
    type: body.type,
    sidecar_id: pairing.sidecar_id,
    touchpoint_id: body.touchpoint_id,
    selected_choices: Array.isArray(body.selected_choices) ? body.selected_choices : [],
    text: body.text || "",
    action: body.action || "",
    created_at: new Date().toISOString(),
  };
}

function createPushIntent(event) {
  return {
    sequence: nextSequence(),
    event_id: event.event_id,
    touchpoint_id: event.touchpoint_id,
    apns_environment: pairing.apns_environment,
    category: event.type === "question" ? "NERA_QUESTION" : "NERA_IDLE",
    title: event.title,
    body: event.body,
    status: "mocked",
    created_at: new Date().toISOString(),
  };
}

function defaultTitle(type) {
  return type === "question" ? "Codex needs clarification" : "Codex finished the task";
}

function assertSidecar(sidecarID) {
  if (sidecarID !== pairing.sidecar_id) {
    throw httpError(403, "unknown_sidecar", "sidecar_id does not match hardcoded pair");
  }
}

function assertTouchpoint(touchpointID) {
  if (touchpointID !== pairing.touchpoint_id) {
    throw httpError(403, "unknown_touchpoint", "touchpoint_id does not match hardcoded pair");
  }
}

function requireString(value, field) {
  if (typeof value !== "string" || value.length === 0) {
    throw httpError(400, "missing_field", `${field} is required`);
  }
  return value;
}

function nextSequence() {
  state.sequence += 1;
  return state.sequence;
}

async function readJSON(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw httpError(400, "invalid_json", "request body must be JSON");
  }
}

function sendJSON(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
  });
  response.end(`${JSON.stringify(payload, null, 2)}\n`);
}

function httpError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}
