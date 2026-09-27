// Demo content. Replace the scene text, target positions and pictures with your own memories.
const scenes = [
  {
    count: "01 / 03",
    title: "第一张照片",
    story: "大学时，小店门口的那一晚。",
    instruction: "找出月亮、饮料和门口的灯。",
    hint: "月亮在窗边；饮料在她手中；灯在右上角。",
    label: "那天晚上",
    control: "点击照片寻找",
    clearTitle: "第一站，已找到。",
    clue: "从那张照片开始。下一站，回到走过的街。",
    image: "./assets/hero-first-photo.jpg",
    targets: [
      { name: "月亮", x: 26, y: 24 },
      { name: "饮料", x: 22, y: 62 },
      { name: "门口的灯", x: 93, y: 14 }
    ]
  },
  {
    count: "02 / 03",
    title: "重走那条街",
    story: "从路灯走到桥边，身旁是彼此。",
    instruction: "按顺序选择：路灯 → 我们 → 桥。",
    hint: "路灯在左上角；我们在画面中央；桥在右边远处。",
    label: "走过的街",
    control: "按顺序选择画面中的三处",
    clearTitle: "第二站，已找到。",
    clue: "下一站，在海边。",
    image: "./assets/red-city.jpg",
    targets: [
      { name: "路灯", x: 30, y: 9 },
      { name: "我们", x: 43, y: 58 },
      { name: "桥", x: 76, y: 59 }
    ]
  },
  {
    count: "03 / 03",
    title: "还原海边照片",
    story: "把被打乱的画面拼回去。",
    instruction: "选两块照片交换，拼回原来的画面。",
    hint: "先看海平线，再看两个人的位置。",
    label: "海边",
    control: "点击两块照片交换",
    clearTitle: "第三站，已找到。",
    clue: "三处回忆都齐了。接下来是新的目的地。",
    image: "./assets/shoreline-memory.jpg"
  }
];

const storageKey = "next-stop-game-v2";
let completed = 0;
try {
  const saved = Number(JSON.parse(localStorage.getItem(storageKey) || "0"));
  completed = Number.isInteger(saved) ? Math.min(3, Math.max(0, saved)) : 0;
} catch { /* The game works without browser storage. */ }
let currentStage = completed;
let found = new Set();
let routeStep = 0;
let puzzleOrder = [2, 0, 1];
let selectedPiece = null;
let hintsVisible = false;
const $ = (selector) => document.querySelector(selector);

function updateTrack() {
  $("#header-progress").textContent = `已完成 ${completed} / 3`;
  document.querySelectorAll(".track-stop").forEach((stop, index) => {
    stop.classList.toggle("done", index < completed);
    stop.classList.toggle("active", index === completed);
  });
}
function feedback(message, error = false) {
  $("#feedback").textContent = message;
  $("#feedback").classList.toggle("error", error);
}
function renderMission(names, doneIndices) {
  $("#mission-count").textContent = `${doneIndices.size} / ${names.length}`;
  $("#mission-items").replaceChildren(...names.map((name, index) => {
    const item = document.createElement("span");
    item.className = `mission-item${doneIndices.has(index) ? " found" : ""}`;
    item.textContent = `${doneIndices.has(index) ? "✓ " : "○ "}${name}`;
    return item;
  }));
}
function setStage(index) {
  currentStage = index;
  hintsVisible = false;
  const data = scenes[index];
  $("#game-screen").hidden = false;
  $("#final-screen").hidden = true;
  $("#stage-clear").hidden = true;
  $("#stage-count").textContent = data.count;
  $("#stage-title").innerHTML = data.title;
  $("#stage-story").textContent = data.story;
  $("#mission-instruction").textContent = data.instruction;
  $("#hint-text").textContent = data.hint;
  $("#hint-text").hidden = true;
  $("#hint-button").setAttribute("aria-expanded", "false");
  $("#hint-button").textContent = "显示提示";
  $("#scene-label").textContent = data.label;
  $("#scene-control").textContent = data.control;
  if (index === 0) renderSearchScene();
  if (index === 1) renderRouteScene();
  if (index === 2) renderPuzzleScene();
  updateTrack();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function makePhotoBoard(data, className) {
  const board = document.createElement("div");
  board.className = `photo-board ${className}`;
  const image = document.createElement("img");
  image.src = data.image;
  image.alt = className === "search-board" ? "夜晚小店门口，女孩坐着，男孩站在旁边" : "两个人走过有路灯和桥的城市街道";
  board.append(image);
  return board;
}
function addHotspot(board, target, index, onClick, prefix) {
  const button = document.createElement("button");
  button.className = "hotspot";
  button.type = "button";
  button.setAttribute("aria-label", `${prefix}${target.name}`);
  button.style.left = `${target.x}%`;
  button.style.top = `${target.y}%`;
  button.addEventListener("click", (event) => { event.stopPropagation(); onClick(button, index, target); });
  board.append(button);
}
function clearStage(index) {
  completed = Math.max(completed, index + 1);
  try { localStorage.setItem(storageKey, JSON.stringify(completed)); } catch { /* Continue without saved progress. */ }
  updateTrack();
  $("#clear-title").textContent = scenes[index].clearTitle;
  $("#clear-clue").textContent = scenes[index].clue;
  $(".clear-label").textContent = `第 0${index + 1} 站完成`;
  $("#next-button").innerHTML = index === 2 ? '查看礼物 <span aria-hidden="true">→</span>' : '继续 <span aria-hidden="true">→</span>';
  $("#stage-clear").hidden = false;
  $("#next-button").focus();
}
function renderSearchScene() {
  found = new Set();
  const data = scenes[0];
  const board = makePhotoBoard(data, "search-board");
  data.targets.forEach((target, index) => addHotspot(board, target, index, (button) => {
    if (found.has(index)) return;
    found.add(index);
    button.classList.add("found");
    button.setAttribute("aria-label", `已找到${target.name}`);
    renderMission(data.targets.map((item) => item.name), found);
    feedback(`已找到：${target.name}`);
    if (found.size === data.targets.length) clearStage(0);
  }, "寻找"));
  board.addEventListener("click", () => feedback("试试照片里的其他位置。", true));
  $("#scene").replaceChildren(board);
  renderMission(data.targets.map((item) => item.name), found);
  feedback("点击画面中的物件。");
}
function renderRouteScene() {
  routeStep = 0;
  const data = scenes[1];
  const board = makePhotoBoard(data, "route-board");
  const line = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  line.setAttribute("class", "route-line");
  line.setAttribute("viewBox", "0 0 100 100");
  line.setAttribute("preserveAspectRatio", "none");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  path.setAttribute("points", "");
  line.append(path);
  board.append(line);
  const buttons = [];
  data.targets.forEach((target, index) => addHotspot(board, target, index, (button) => {
    if (index !== routeStep) {
      routeStep = 0;
      buttons.forEach((item) => item.classList.remove("found"));
      path.setAttribute("points", "");
      renderMission(data.targets.map((item) => item.name), new Set());
      feedback("顺序有误，请从路灯开始。", true);
      return;
    }
    button.classList.add("found");
    routeStep += 1;
    path.setAttribute("points", data.targets.slice(0, routeStep).map((item) => `${item.x},${item.y}`).join(" "));
    renderMission(data.targets.map((item) => item.name), new Set(Array.from({ length: routeStep }, (_, i) => i)));
    feedback(`已到：${target.name}`);
    if (routeStep === data.targets.length) clearStage(1);
  }, "点亮"));
  buttons.push(...board.querySelectorAll(".hotspot"));
  board.addEventListener("click", () => feedback("按路灯、我们、桥的顺序选择。", true));
  $("#scene").replaceChildren(board);
  renderMission(data.targets.map((item) => item.name), new Set());
  feedback("从路灯开始。");
}
function renderPuzzlePieces() {
  const board = $(".puzzle-board");
  board.replaceChildren(...puzzleOrder.map((fragment, position) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `puzzle-piece${selectedPiece === position ? " selected" : ""}`;
    button.setAttribute("aria-label", `第 ${position + 1} 块照片碎片`);
    button.style.backgroundImage = `url("${scenes[2].image}")`;
    button.style.backgroundPosition = `${fragment * 50}% center`;
    button.addEventListener("click", () => {
      if (selectedPiece === null) {
        selectedPiece = position;
        renderPuzzlePieces();
        feedback("再选一块交换。");
        return;
      }
      if (selectedPiece === position) {
        selectedPiece = null;
        renderPuzzlePieces();
        feedback("已取消选择。");
        return;
      }
      [puzzleOrder[selectedPiece], puzzleOrder[position]] = [puzzleOrder[position], puzzleOrder[selectedPiece]];
      selectedPiece = null;
      renderPuzzlePieces();
      const correct = new Set(puzzleOrder.flatMap((piece, index) => piece === index ? [index] : []));
      renderMission(["左边", "中间", "右边"], correct);
      if (correct.size === 3) {
        feedback("照片已还原。");
        clearStage(2);
      } else feedback(`已还原 ${correct.size} 块。`);
    });
    return button;
  }));
}
function renderPuzzleScene() {
  puzzleOrder = [2, 0, 1];
  selectedPiece = null;
  const board = document.createElement("div");
  board.className = "puzzle-board";
  board.setAttribute("role", "group");
  board.setAttribute("aria-label", "被打乱成三块的海边照片");
  $("#scene").replaceChildren(board);
  renderPuzzlePieces();
  renderMission(["左边", "中间", "右边"], new Set());
  feedback("点击两块照片交换。");
}
function renderFinal() {
  $("#game-screen").hidden = true;
  $("#final-screen").hidden = false;
  $("#gift-reveal").hidden = true;
  $("#open-gift").hidden = false;
  updateTrack();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
$("#hint-button").addEventListener("click", () => {
  hintsVisible = !hintsVisible;
  $("#hint-text").hidden = !hintsVisible;
  $("#hint-button").setAttribute("aria-expanded", String(hintsVisible));
  $("#hint-button").textContent = hintsVisible ? "收起提示" : "显示提示";
  $(".photo-board")?.classList.toggle("show-hints", hintsVisible);
});
$("#reset-button").addEventListener("click", () => {
  completed = 0;
  try { localStorage.removeItem(storageKey); } catch { /* Continue without storage. */ }
  setStage(0);
});
$("#next-button").addEventListener("click", () => {
  if (completed === 3) renderFinal();
  else setStage(completed);
});
$("#open-gift").addEventListener("click", () => {
  $("#open-gift").hidden = true;
  $("#gift-reveal").hidden = false;
});
if (completed === 3) renderFinal();
else setStage(completed);
