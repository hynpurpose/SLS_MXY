// Demo content. Replace the scene text, target positions and pictures with your own memories.
const scenes = [
  {
    count: "STAGE 01 / 03",
    title: "第一张照片，<br /><em>还记得吗？</em>",
    story: "大学时的那天晚上，小店门口留下了我们的第一张照片。仔细看，画面里藏着三个线索。",
    instruction: "在照片里找到：月亮、那杯饮料，还有门口的灯。",
    hint: "仔细看左上方的窗、女孩的手边和右上角。",
    label: "ARCHIVE / FIRST FRAME",
    control: "点击照片，寻找线索",
    clearTitle: "第一处回忆，点亮了。",
    clue: "故事从那天晚上的小店开始。下一条线索，藏在我们走过的街上。",
    image: "./assets/hero-first-photo.jpg",
    targets: [
      { name: "月亮", x: 26, y: 24 },
      { name: "饮料", x: 22, y: 62 },
      { name: "门口的灯", x: 93, y: 14 }
    ]
  },
  {
    count: "STAGE 02 / 03",
    title: "那条路，<br /><em>再走一遍。</em>",
    story: "走过许多街以后，有一段路总会留在记忆里。按那天的顺序，把路重新连起来。",
    instruction: "依次点亮：路灯 → 我们 → 桥。顺序错了，要从头再走。",
    hint: "路灯在左上角；我们在画面中央；桥在右边远处。",
    label: "ARCHIVE / CITY WALK",
    control: "按照顺序点亮路径",
    clearTitle: "第二处回忆，点亮了。",
    clue: "那段一起走过的路，终于连成了下一条线。终点在海边。",
    image: "./assets/red-city.jpg",
    targets: [
      { name: "路灯", x: 30, y: 9 },
      { name: "我们", x: 43, y: 58 },
      { name: "桥", x: 76, y: 59 }
    ]
  },
  {
    count: "STAGE 03 / 03",
    title: "把海边的那天，<br /><em>拼回来。</em>",
    story: "那天风很大，海平线却很平静。照片被打乱了，把它还原成我们记得的样子。",
    instruction: "先选一块，再选另一块交换。让海平线和两个人重新连起来。",
    hint: "先看海平线，再看两个人的位置。点击任意两块就能交换。",
    label: "ARCHIVE / BY THE SEA",
    control: "点两块照片，交换位置",
    clearTitle: "最后一处回忆，也亮了。",
    clue: "说过“下次还来”的地方已经找到。现在，看看我为下一站准备了什么。",
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
  $("#header-progress").textContent = `线索 ${completed} / 3`;
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
  $("#next-button").innerHTML = index === 2 ? '解锁礼物 <span aria-hidden="true">→</span>' : '去下一站 <span aria-hidden="true">→</span>';
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
    feedback(`找到了「${target.name}」！`);
    if (found.size === data.targets.length) clearStage(0);
  }, "寻找"));
  board.addEventListener("click", () => feedback("这里没有线索，再仔细看看照片里的物品。", true));
  $("#scene").replaceChildren(board);
  renderMission(data.targets.map((item) => item.name), found);
  feedback("轻触照片里的目标，开始寻找。");
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
      feedback("顺序不对，从路灯重新出发。", true);
      return;
    }
    button.classList.add("found");
    routeStep += 1;
    path.setAttribute("points", data.targets.slice(0, routeStep).map((item) => `${item.x},${item.y}`).join(" "));
    renderMission(data.targets.map((item) => item.name), new Set(Array.from({ length: routeStep }, (_, i) => i)));
    feedback(`第 ${routeStep} 站：${target.name}。`);
    if (routeStep === data.targets.length) clearStage(1);
  }, "点亮"));
  buttons.push(...board.querySelectorAll(".hotspot"));
  board.addEventListener("click", () => feedback("点照片上的光点，按路灯、我们、桥的顺序前进。", true));
  $("#scene").replaceChildren(board);
  renderMission(data.targets.map((item) => item.name), new Set());
  feedback("从路灯开始，沿着照片走一遍。");
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
        feedback("再选一块照片，两块就会交换。");
        return;
      }
      if (selectedPiece === position) {
        selectedPiece = null;
        renderPuzzlePieces();
        feedback("已取消选择。再选两块照片交换。");
        return;
      }
      [puzzleOrder[selectedPiece], puzzleOrder[position]] = [puzzleOrder[position], puzzleOrder[selectedPiece]];
      selectedPiece = null;
      renderPuzzlePieces();
      const correct = new Set(puzzleOrder.flatMap((piece, index) => piece === index ? [index] : []));
      renderMission(["左边", "中间", "右边"], correct);
      if (correct.size === 3) {
        feedback("照片拼好了！");
        clearStage(2);
      } else feedback(`已经拼对 ${correct.size} 块，继续试试。`);
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
  feedback("选两块照片交换，让海平线连起来。");
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
