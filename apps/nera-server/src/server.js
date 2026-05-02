import http from "node:http";
import http2 from "node:http2";
import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";

const port = Number(process.env.NERA_SERVER_PORT || 8787);
const host = process.env.NERA_SERVER_HOST || "0.0.0.0";
const featureFlags = {
  debugRoutes: process.env.NERA_ENABLE_DEBUG_ROUTES === "1",
  mockPushProvider: process.env.NERA_PUSH_PROVIDER !== "apns",
};
const pushProvider = featureFlags.mockPushProvider ? "mock" : "apns";

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
  deviceTokens: new Map(),
};

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);

    if (request.method === "GET" && url.pathname === "/health") {
      return sendJSON(response, 200, {
        ok: true,
        service: "nera-server",
        feature_flags: featureFlags,
        push_provider: pushProvider,
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
      const pushIntent = await createPushIntent(event);
      state.pushIntents.push(pushIntent);
      return sendJSON(response, 202, {
        accepted: true,
        event,
        push_intent: pushIntent,
      });
    }

    if (request.method === "POST" && url.pathname === "/touchpoint/device-token") {
      const body = await readJSON(request);
      const registration = normalizeDeviceTokenRegistration(body);
      state.deviceTokens.set(registration.touchpoint_id, registration);
      return sendJSON(response, 202, {
        accepted: true,
        touchpoint_id: registration.touchpoint_id,
        environment: registration.environment,
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

    if (request.method === "GET" && url.pathname === "/debug/state" && featureFlags.debugRoutes) {
      return sendJSON(response, 200, serializeDebugState());
    }

    return sendJSON(response, 404, { error: "not_found" });
  } catch (error) {
    return sendJSON(response, error.statusCode || 500, {
      error: error.code || "internal_error",
      message: error.message,
    });
  }
});

server.listen(port, host, () => {
  console.log(`nera-server listening on http://${host}:${port}`);
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

function normalizeDeviceTokenRegistration(body) {
  assertTouchpoint(body.touchpoint_id);

  const token = requireString(body.token, "token").replace(/\s/g, "");
  if (!/^[a-fA-F0-9]+$/.test(token)) {
    throw httpError(400, "invalid_device_token", "token must be a hex APNs device token");
  }

  return {
    touchpoint_id: body.touchpoint_id,
    token,
    environment: body.environment === "production" ? "production" : "sandbox",
    updated_at: new Date().toISOString(),
  };
}

async function createPushIntent(event) {
  const baseIntent = {
    sequence: nextSequence(),
    event_id: event.event_id,
    touchpoint_id: event.touchpoint_id,
    apns_environment: pairing.apns_environment,
    category: event.type === "question" ? "NERA_QUESTION" : "NERA_IDLE",
    title: event.title,
    body: event.body,
    provider: pushProvider,
    created_at: new Date().toISOString(),
  };

  if (featureFlags.mockPushProvider) {
    return {
      ...baseIntent,
      status: "mocked",
    };
  }

  const deviceToken = state.deviceTokens.get(event.touchpoint_id);
  if (!deviceToken) {
    return {
      ...baseIntent,
      status: "no_device_token",
    };
  }

  const config = readAPNSConfig();
  if (!config.configured) {
    return {
      ...baseIntent,
      status: "not_configured",
      missing: config.missing,
    };
  }

  try {
    const apnsResponse = await sendAPNSNotification(event, deviceToken.token, config);
    return {
      ...baseIntent,
      status: "sent",
      apns_id: apnsResponse.apnsID,
      apns_status: apnsResponse.statusCode,
    };
  } catch (error) {
    return {
      ...baseIntent,
      status: "failed",
      error: error.message,
    };
  }
}

function readAPNSConfig() {
  const config = {
    keyID: process.env.NERA_APNS_KEY_ID || "",
    teamID: process.env.NERA_APNS_TEAM_ID || "",
    topic: process.env.NERA_APNS_BUNDLE_ID || "app.nera.touchpoint",
    environment: process.env.NERA_APNS_ENV || pairing.apns_environment,
    privateKey: process.env.NERA_APNS_PRIVATE_KEY || readPrivateKeyFile(),
  };
  const missing = [];

  if (!config.keyID) {
    missing.push("NERA_APNS_KEY_ID");
  }
  if (!config.teamID) {
    missing.push("NERA_APNS_TEAM_ID");
  }
  if (!config.privateKey) {
    missing.push("NERA_APNS_PRIVATE_KEY or NERA_APNS_PRIVATE_KEY_PATH");
  }

  return {
    ...config,
    configured: missing.length === 0,
    missing,
  };
}

function readPrivateKeyFile() {
  if (!process.env.NERA_APNS_PRIVATE_KEY_PATH) {
    return "";
  }

  try {
    return readFileSync(process.env.NERA_APNS_PRIVATE_KEY_PATH, "utf8");
  } catch {
    return "";
  }
}

async function sendAPNSNotification(event, deviceToken, config) {
  const client = http2.connect(apnsOrigin(config.environment));

  try {
    const payload = JSON.stringify(apnsPayload(event));
    const request = client.request({
      ":method": "POST",
      ":path": `/3/device/${deviceToken}`,
      authorization: `bearer ${apnsJWT(config)}`,
      "apns-topic": config.topic,
      "apns-push-type": "alert",
      "apns-priority": "10",
    });

    request.setEncoding("utf8");
    request.end(payload);

    return await new Promise((resolve, reject) => {
      let responseBody = "";
      let statusCode = 0;
      let apnsID = "";

      request.on("response", (headers) => {
        statusCode = Number(headers[":status"] || 0);
        apnsID = String(headers["apns-id"] || "");
      });
      request.on("data", (chunk) => {
        responseBody += chunk;
      });
      request.on("end", () => {
        if (statusCode >= 200 && statusCode < 300) {
          resolve({ statusCode, apnsID });
          return;
        }

        reject(new Error(responseBody || `APNs HTTP ${statusCode}`));
      });
      request.on("error", reject);
      request.setTimeout(15000, () => {
        request.close();
        reject(new Error("APNs request timed out"));
      });
    });
  } finally {
    client.close();
  }
}

function apnsPayload(event) {
  return {
    aps: {
      alert: {
        title: event.title,
        body: event.body,
      },
      sound: "default",
      category: event.type === "question" ? "NERA_QUESTION" : "NERA_IDLE",
    },
    request_id: event.event_id,
    event_kind: event.type,
    agent: event.agent,
    task: event.task || "",
    title: event.title,
    body: event.body,
    choices: event.choices,
  };
}

function apnsOrigin(environment) {
  return environment === "production"
    ? "https://api.push.apple.com"
    : "https://api.sandbox.push.apple.com";
}

function apnsJWT(config) {
  const header = base64URL(JSON.stringify({
    alg: "ES256",
    kid: config.keyID,
  }));
  const claims = base64URL(JSON.stringify({
    iss: config.teamID,
    iat: Math.floor(Date.now() / 1000),
  }));
  const signingInput = `${header}.${claims}`;
  const signature = createSign("SHA256")
    .update(signingInput)
    .sign(config.privateKey);

  return `${signingInput}.${derToJose(signature, 64)}`;
}

function derToJose(signature, bytes) {
  let offset = 0;
  if (signature[offset++] !== 0x30) {
    throw new Error("Invalid ECDSA signature");
  }

  offset = readDERLength(signature, offset).offset;

  if (signature[offset++] !== 0x02) {
    throw new Error("Invalid ECDSA signature");
  }
  const rInfo = readDERLength(signature, offset);
  offset = rInfo.offset;
  let rLength = rInfo.length;

  if (signature[offset] === 0) {
    offset += 1;
    rLength -= 1;
  }

  const r = signature.subarray(offset, offset + rLength);
  offset += rLength;

  if (signature[offset++] !== 0x02) {
    throw new Error("Invalid ECDSA signature");
  }
  const sInfo = readDERLength(signature, offset);
  offset = sInfo.offset;
  let sLength = sInfo.length;
  if (signature[offset] === 0) {
    offset += 1;
    sLength -= 1;
  }

  const s = signature.subarray(offset, offset + sLength);

  return base64URL(Buffer.concat([
    leftPad(r, bytes / 2),
    leftPad(s, bytes / 2),
  ]));
}

function readDERLength(buffer, offset) {
  let length = buffer[offset++];
  if (length < 0x80) {
    return { length, offset };
  }

  const bytes = length & 0x7f;
  length = 0;
  for (let index = 0; index < bytes; index += 1) {
    length = (length << 8) | buffer[offset++];
  }

  return { length, offset };
}

function leftPad(buffer, length) {
  if (buffer.length === length) {
    return buffer;
  }
  if (buffer.length > length) {
    return buffer.subarray(buffer.length - length);
  }

  return Buffer.concat([Buffer.alloc(length - buffer.length), buffer]);
}

function base64URL(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function serializeDebugState() {
  return {
    ...state,
    deviceTokens: Array.from(state.deviceTokens.values()),
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
