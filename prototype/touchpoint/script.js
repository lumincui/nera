const events = {
  permission: {
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
  },
  question: {
    kind: "Question",
    title: "Codex 需要你澄清",
    body: "接下来 touchpoint 应该优先验证哪些通知交互？",
    agent: "Codex",
    task: "交互设计",
    choices: ["权限请求", "Question", "完成提醒"],
    result: "选择和输入内容会通过 relay 回传给 sidecar",
    mode: "mixed-question",
    text: true,
  },
  questionMixed: {
    kind: "Question",
    title: "Codex 需要你澄清",
    body: "接下来 touchpoint 应该优先验证哪些通知交互？",
    agent: "Codex",
    task: "交互设计",
    choices: ["权限请求", "Question", "完成提醒"],
    result: "选择和输入内容会通过 relay 回传给 sidecar",
    mode: "mixed-question",
    text: true,
  },
  idle: {
    kind: "完成提醒",
    title: "Codex 已完成任务",
    body: "touchpoint 通知原型已生成，可以进入 review。",
    agent: "Codex",
    task: "prototype",
    actions: ["稍后", "Review"],
    result: "Review 会打开对应任务上下文",
    mode: "question",
    text: false,
  },
};

const notification = document.querySelector("#primaryNotification");
const notificationKind = document.querySelector("#notificationKind");
const notificationTitle = document.querySelector("#notificationTitle");
const notificationBody = document.querySelector("#notificationBody");
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

function setEvent(name) {
  const item = events[name];
  notificationKind.textContent = item.kind;
  notificationTitle.textContent = item.title;
  notificationBody.textContent = item.body;
  detailTask.textContent = item.task;
  detailPermission.textContent = item.permission || "不适用";
  detailCommand.textContent = item.command || "不适用";
  permissionDetails.hidden = item.mode !== "permission";
  actionRow.hidden = item.mode !== "permission";
  questionActions.hidden = item.mode === "permission" || item.text || item.mode === "mixed-question";
  multiChoice.hidden = item.mode !== "mixed-question";
  renderChoices(item.choices || []);
  renderActions(item.actions || []);
  if (item.mode !== "permission" && !item.text) {
    secondaryAction.textContent = item.actions[0];
    primaryAction.textContent = item.actions[1];
  }
  textReply.hidden = !item.text;
  primaryAction.hidden = item.text;
  resultText.textContent = item.result;
  resultBanner.classList.remove("visible");
  notification.classList.remove("handled");
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
    button.textContent = label;
    button.className = label === "Deny" || label === "拒绝" ? "secondary" : "primary";
    if (label === "Always") button.classList.add("strong");
    button.addEventListener("click", () => handleAction(label));
    actionRow.appendChild(button);
  });
}

function handleAction(label) {
  resultText.textContent = `${label} 已发送`;
  resultBanner.classList.add("visible");
  notification.classList.add("handled");
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
  handleAction(parts.length ? parts.join("；") : "已发送回复");
  replyInput.value = "";
});

setEvent("permission");
