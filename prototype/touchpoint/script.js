const events = {
  permission: {
    kind: "权限请求",
    title: "Codex 请求执行命令",
    body: "`npm test` 需要访问本地依赖缓存。是否允许？",
    agent: "Codex",
    task: "touchpoint 原型",
    primary: "Approve",
    secondary: "拒绝",
    result: "权限响应会通过 relay 回传给 sidecar",
  },
  question: {
    kind: "Question",
    title: "Codex 需要你澄清",
    body: "这个通知原型是否只聚焦 approve 和 question？",
    agent: "Codex",
    task: "交互设计",
    primary: "确认",
    secondary: "稍后",
    result: "回答会通过 relay 回传给 sidecar",
    text: false,
  },
  questionChoice: {
    kind: "Question",
    title: "Codex 需要你澄清",
    body: "这个通知原型是否只聚焦 approve 和 question？",
    agent: "Codex",
    task: "交互设计",
    primary: "确认",
    secondary: "稍后",
    result: "回答会通过 relay 回传给 sidecar",
    text: false,
  },
  questionText: {
    kind: "Question",
    title: "Codex 需要开放回答",
    body: "你希望我接下来优先验证哪种通知交互？",
    agent: "Codex",
    task: "交互设计",
    primary: "发送",
    secondary: "稍后",
    result: "文本或听写内容会通过 relay 回传给 sidecar",
    text: true,
  },
  idle: {
    kind: "完成提醒",
    title: "Codex 已完成任务",
    body: "touchpoint 通知原型已生成，可以进入 review。",
    agent: "Codex",
    task: "prototype",
    primary: "Review",
    secondary: "稍后",
    result: "Review 会打开对应任务上下文",
    text: false,
  },
};

const notification = document.querySelector("#primaryNotification");
const notificationKind = document.querySelector("#notificationKind");
const notificationTitle = document.querySelector("#notificationTitle");
const notificationBody = document.querySelector("#notificationBody");
const contextAgent = document.querySelector("#contextAgent");
const contextTask = document.querySelector("#contextTask");
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
  contextAgent.textContent = item.agent;
  contextTask.textContent = item.task;
  primaryAction.textContent = item.primary;
  secondaryAction.textContent = item.secondary;
  textReply.hidden = !item.text;
  primaryAction.hidden = item.text;
  resultText.textContent = item.result;
  resultBanner.classList.remove("visible");
  notification.classList.remove("handled");
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
  handleAction(value ? `已回复：${value}` : "已发送文本回复");
  replyInput.value = "";
});

setEvent("permission");
