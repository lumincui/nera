const events = {
  permission: {
    id: "perm-20260502-001",
    kind: "权限请求",
    title: "Codex 请求执行命令",
    body: "Codex 需要你确认这次执行是否允许。",
    agent: "Codex",
    task: "touchpoint 原型",
    permission: "访问本地依赖缓存",
    command: "npm test",
    actions: ["Deny", "Approve", "Always"],
    result: "权限响应会通过 relay 回传给 sidecar",
    mode: "permission",
    route: "touchpoint -> relay -> sidecar -> pending permission hook",
  },
  question: {
    id: "question-20260502-001",
    kind: "Question",
    title: "Codex 需要你澄清",
    body: "接下来 touchpoint 应该优先验证哪些通知交互？",
    agent: "Codex",
    task: "交互设计",
    choices: ["权限请求", "Question", "完成提醒"],
    result: "选择和输入内容会通过 relay 回传给 sidecar",
    mode: "mixed-question",
    text: true,
    route: "touchpoint -> relay -> sidecar -> pending question action",
  },
  questionMixed: {
    id: "question-20260502-001",
    kind: "Question",
    title: "Codex 需要你澄清",
    body: "接下来 touchpoint 应该优先验证哪些通知交互？",
    agent: "Codex",
    task: "交互设计",
    choices: ["权限请求", "Question", "完成提醒"],
    result: "选择和输入内容会通过 relay 回传给 sidecar",
    mode: "mixed-question",
    text: true,
    route: "touchpoint -> relay -> sidecar -> pending question action",
  },
  idle: {
    id: "idle-20260502-001",
    kind: "完成提醒",
    title: "Codex 已完成任务",
    body: "touchpoint 通知原型已生成，可以进入 review。",
    agent: "Codex",
    task: "prototype",
    actions: ["稍后", "Review"],
    result: "idle 消息已发送为完成通知",
    mode: "idle",
    text: false,
    route: "sidecar stop hook -> relay -> touchpoint notification",
  },
};

const hardcodedPairing = {
  pair_id: "dev-pair-local-001",
  sidecar_id: "sidecar-mac-dev",
  touchpoint_id: "touchpoint-ios-dev",
  relay_channel: "relay-dev-hardcoded",
};

const pathCopy = {
  permission: ["收到 permission request", "展示可操作通知", "等待用户选择"],
  "mixed-question": ["收到 question", "展开交互式 action", "等待选择和文本回复"],
  idle: ["收到 idle", "发送完成通知", "等待稍后或 review"],
};

const notification = document.querySelector("#primaryNotification");
const notificationKind = document.querySelector("#notificationKind");
const notificationTitle = document.querySelector("#notificationTitle");
const notificationBody = document.querySelector("#notificationBody");
const notificationMeta = document.querySelector("#notificationMeta");
const permissionDetails = document.querySelector("#permissionDetails");
const detailTask = document.querySelector("#detailTask");
const detailPermission = document.querySelector("#detailPermission");
const detailCommand = document.querySelector("#detailCommand");
const actionRow = document.querySelector("#actionRow");
const questionActions = document.querySelector("#questionActions");
const multiChoice = document.querySelector("#multiChoice");
const primaryAction = document.querySelector("#primaryAction");
const secondaryAction = document.querySelector("#secondaryAction");
const resultBanner = document.querySelector("#resultBanner");
const resultText = document.querySelector("#resultText");
const textReply = document.querySelector("#textReply");
const replyInput = document.querySelector("#replyInput");
const flowSteps = document.querySelector("#flowSteps");
const payloadPreview = document.querySelector("#payloadPreview");
const messageLog = document.querySelector("#messageLog");
const pathQuestion = document.querySelector("#pathQuestion");
const pathIdle = document.querySelector("#pathIdle");
const pairingStatus = document.querySelector("#pairingStatus");

let currentEvent = events.permission;
let sequence = 0;

function buildPayload(item, action, extra = {}) {
  const base = {
    message_id: `msg-${String(++sequence).padStart(3, "0")}`,
    request_id: item.id,
    agent: item.agent,
    task: item.task,
    route: item.route,
    pairing: hardcodedPairing,
    created_at: new Date().toISOString(),
  };

  if (item.mode === "mixed-question") {
    return {
      ...base,
      type: "answer_question",
      action,
      selected_choices: extra.selectedChoices || [],
      text: extra.text || "",
    };
  }

  if (item.mode === "idle") {
    return {
      ...base,
      type: action === "Review" ? "open_review" : "completion_notification",
      action,
      notification_title: item.title,
      preview: item.body,
    };
  }

  return {
    ...base,
    type: "permission_response",
    action,
    command: item.command,
    permission: item.permission,
  };
}

function buildIncomingPayload(item) {
  const base = {
    message_id: `msg-${String(++sequence).padStart(3, "0")}`,
    request_id: item.id,
    agent: item.agent,
    task: item.task,
    route: item.route,
    pairing: hardcodedPairing,
    created_at: new Date().toISOString(),
  };

  if (item.mode === "mixed-question") {
    return {
      ...base,
      type: "question_request",
      choices: item.choices,
      text_input: Boolean(item.text),
    };
  }

  if (item.mode === "idle") {
    return {
      ...base,
      type: "completion_notification",
      notification_title: item.title,
      preview: item.body,
    };
  }

  return {
    ...base,
    type: "permission_request",
    command: item.command,
    permission: item.permission,
  };
}

function setEvent(name) {
  const item = events[name];
  currentEvent = item;
  notificationKind.textContent = item.kind;
  notificationTitle.textContent = item.title;
  notificationBody.textContent = item.body;
  notificationMeta.textContent = `${item.agent} · ${item.task}`;
  detailTask.textContent = item.task;
  detailPermission.textContent = item.permission || "不适用";
  detailCommand.textContent = item.command || "不适用";
  permissionDetails.hidden = item.mode !== "permission";
  actionRow.hidden = item.mode !== "permission";
  questionActions.hidden = item.mode !== "idle";
  multiChoice.hidden = item.mode !== "mixed-question";
  renderChoices(item.choices || []);
  renderActions(item.actions || []);
  if (item.mode === "idle") {
    secondaryAction.textContent = item.actions[0];
    primaryAction.textContent = item.actions[1];
  }
  textReply.hidden = !item.text;
  primaryAction.hidden = item.text;
  resultText.textContent = item.result;
  resultBanner.classList.remove("visible");
  notification.classList.remove("handled");
  replyInput.value = "";
  renderFlow(item);
  setActiveDock(name);

  const receivedPayload = buildIncomingPayload(item);
  if (item.mode === "idle") {
    resultBanner.classList.add("visible");
    appendLog("idle 已发送完成通知", receivedPayload);
    markPath(pathIdle, "done");
    markPath(pathQuestion, "idle");
  } else {
    appendLog(`${item.kind} 已送达 touchpoint`, receivedPayload);
    markPath(pathQuestion, item.mode === "mixed-question" ? "active" : "idle");
    markPath(pathIdle, "idle");
  }
}

function renderChoices(choices) {
  multiChoice.innerHTML = "";
  choices.forEach((label) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.className = "choice";
    button.addEventListener("click", () => button.classList.toggle("selected"));
    multiChoice.appendChild(button);
  });
}

function renderActions(actions) {
  actionRow.innerHTML = "";
  actions.forEach((label) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.className = label === "Deny" || label === "拒绝" ? "secondary" : "primary";
    if (label === "Always") button.classList.add("strong");
    button.addEventListener("click", () => handleAction(label));
    actionRow.appendChild(button);
  });
}

function renderFlow(item, completedLabel) {
  flowSteps.innerHTML = "";
  const steps = [...pathCopy[item.mode]];
  if (completedLabel) steps.push(completedLabel);
  steps.forEach((label, index) => {
    const li = document.createElement("li");
    li.textContent = label;
    if (index === steps.length - 1 && completedLabel) li.classList.add("complete");
    flowSteps.appendChild(li);
  });
}

function appendLog(label, payload) {
  payloadPreview.textContent = JSON.stringify(payload, null, 2);
  const item = document.createElement("li");
  const title = document.createElement("strong");
  const meta = document.createElement("span");
  title.textContent = label;
  meta.textContent = `${payload.type} · ${payload.message_id}`;
  item.append(title, meta);
  messageLog.prepend(item);
  if (messageLog.children.length > 5) messageLog.lastElementChild.remove();
}

function markPath(element, state) {
  element.classList.remove("active", "done", "idle");
  element.classList.add(state);
}

function setActiveDock(name) {
  document.querySelectorAll(".dock button").forEach((button) => {
    button.classList.toggle("active", button.dataset.event === name);
  });
}

function handleAction(label, extra = {}) {
  const payload = buildPayload(currentEvent, label, extra);
  const routeLabel =
    currentEvent.mode === "mixed-question"
      ? "question action 已回传"
      : currentEvent.mode === "idle"
        ? `${label} 通知响应已发送`
        : `${label} 已发送`;

  resultText.textContent = routeLabel;
  resultBanner.classList.add("visible");
  notification.classList.add("handled");
  renderFlow(currentEvent, routeLabel);
  appendLog(routeLabel, payload);

  if (currentEvent.mode === "mixed-question") markPath(pathQuestion, "done");
  if (currentEvent.mode === "idle") markPath(pathIdle, "done");
}

document.querySelectorAll(".dock button").forEach((button) => {
  button.addEventListener("click", () => setEvent(button.dataset.event));
});

primaryAction.addEventListener("click", () => handleAction(primaryAction.textContent));
secondaryAction.addEventListener("click", () => handleAction(secondaryAction.textContent));
textReply.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = replyInput.value.trim();
  const selected = [...multiChoice.querySelectorAll(".selected")].map((button) => button.textContent);
  const parts = [];
  if (selected.length) parts.push(`选择：${selected.join("、")}`);
  if (value) parts.push(`补充：${value}`);
  handleAction(parts.length ? parts.join("；") : "已发送回复", {
    selectedChoices: selected,
    text: value,
  });
  replyInput.value = "";
});

setEvent("permission");
pairingStatus.textContent = `${hardcodedPairing.sidecar_id} -> ${hardcodedPairing.touchpoint_id}`;
