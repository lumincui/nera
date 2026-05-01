const state = {
  permission: {
    island: "等待权限",
    liveTitle: "权限请求",
    liveMeta: "Codex 等待 approve 后继续",
    title: "Codex 请求权限",
    body: "运行 `npm test` 需要访问本地依赖缓存。",
    actions: ["拒绝", "Approve"],
  },
  question: {
    island: "等待回答",
    liveTitle: "需要澄清",
    liveMeta: "Codex 有一个 question",
    title: "Codex 需要澄清",
    body: "是否优先设计通知交互，而不是 App 内 review？",
    actions: ["稍后", "回答"],
  },
  idle: {
    island: "等待 review",
    liveTitle: "任务已完成",
    liveMeta: "Codex 已整理 3 个 touchpoint 状态",
    title: "Codex 已完成任务",
    body: "可以查看结果并进入 review。",
    actions: ["忽略", "Review"],
  },
  working: {
    island: "Codex 正在工作",
    liveTitle: "设计 touchpoint",
    liveMeta: "正在生成交互原型",
    title: "Codex 正在工作",
    body: "当前无需操作，状态会持续更新。",
    actions: ["关闭", "查看"],
  },
};

const islandText = document.querySelector("#islandText");
const liveTitle = document.querySelector("#liveTitle");
const liveMeta = document.querySelector("#liveMeta");
const notification = document.querySelector("#notification");
const notificationTitle = document.querySelector("#notificationTitle");
const notificationBody = document.querySelector("#notificationBody");
const approveButton = document.querySelector("#approveButton");
const denyButton = document.querySelector("#denyButton");
const appView = document.querySelector("#appView");
const openTaskButton = document.querySelector("#openTaskButton");
const backButton = document.querySelector("#backButton");
const progressButton = document.querySelector("#progressButton");
const composer = document.querySelector("#composer");
const commandInput = document.querySelector("#commandInput");
const timeline = document.querySelector("#timeline");

function setEvent(type) {
  const event = state[type];
  islandText.textContent = event.island;
  liveTitle.textContent = event.liveTitle;
  liveMeta.textContent = event.liveMeta;
  notificationTitle.textContent = event.title;
  notificationBody.textContent = event.body;
  denyButton.textContent = event.actions[0];
  approveButton.textContent = event.actions[1];
  notification.classList.remove("hidden");
}

function addMessage(text, from = "human") {
  const article = document.createElement("article");
  article.className = `bubble ${from}`;
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  article.appendChild(paragraph);
  timeline.appendChild(article);
  timeline.scrollTop = timeline.scrollHeight;
}

document.querySelectorAll(".dock button").forEach((button) => {
  button.addEventListener("click", () => setEvent(button.dataset.event));
});

approveButton.addEventListener("click", () => {
  addMessage(`${approveButton.textContent} 已发送`);
  notification.classList.add("hidden");
  islandText.textContent = "Codex 继续工作";
  liveTitle.textContent = "请求已处理";
  liveMeta.textContent = "Relay 已回传响应";
});

denyButton.addEventListener("click", () => {
  addMessage(`${denyButton.textContent} 已发送`);
  notification.classList.add("hidden");
  islandText.textContent = "等待下一步";
  liveTitle.textContent = "请求已拒绝";
  liveMeta.textContent = "Codex 等待新的指令";
});

openTaskButton.addEventListener("click", () => {
  appView.classList.add("open");
});

backButton.addEventListener("click", () => {
  appView.classList.remove("open");
});

progressButton.addEventListener("click", () => {
  addMessage("请汇报当前进度");
  addMessage("已完成 touchpoint 入口整理，正在等待 review。", "agent");
});

composer.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = commandInput.value.trim();
  if (!value) return;
  addMessage(value);
  commandInput.value = "";
});

setEvent("permission");
