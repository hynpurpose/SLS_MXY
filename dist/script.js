// Demo content: replace these three stories and the final gift with your own details.
const stories = [
  {
    kicker: "01 / 大学 · 故事的起点",
    title: "那张最早的合照",
    story: "还记得我们第一次一起拍照的地方吗？照片里的我们有点拘谨，身后是熟悉的校园。后来再看，才发现一切都从那天慢慢开始。",
    clue: "从那一天起，普通的地方也开始有了特别的意义。",
    image: "./assets/editorial-weekend.png",
    alt: "地图和相机的示意插画"
  },
  {
    kicker: "02 / 城市 · 平常的一天",
    title: "一起走过的街角",
    story: "没有特别的计划，只是边走边聊。后来我们经过那条街，总会不约而同地想起那天的事。",
    clue: "有你一起走，寻常的路也会成为目的地。",
    image: "./assets/red-city.png",
    alt: "两个人走过城市的插画"
  },
  {
    kicker: "03 / 海边 · 下次还来",
    title: "舍不得结束的傍晚",
    story: "风吹得头发乱糟糟的，天快黑了，我们还是在海边多待了一会儿。你说过，下次还想再来。",
    clue: "下一站，我们再一起出发。",
    image: "./assets/shoreline-memory.png",
    alt: "两个人在海边散步的示意照片"
  }
];

const storageKey = "our-next-stop-demo-v1";
let found = new Set();
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
  if (Array.isArray(saved)) found = new Set(saved.filter((index) => Number.isInteger(index) && index >= 0 && index < stories.length));
} catch { /* Continue without saved progress. */ }

const storyDialog = document.querySelector("#story-dialog");
const revealDialog = document.querySelector("#reveal-dialog");
let activePlace = 0;

function updateProgress() {
  const remaining = stories.length - found.size;
  document.querySelector("#header-count").textContent = `${found.size} / ${stories.length}`;
  document.querySelector("#hero-progress-fill").style.width = `${(found.size / stories.length) * 100}%`;
  document.querySelector("#hero-progress-label").textContent = remaining ? `还有 ${remaining} 处回忆等你点亮` : "所有回忆都已点亮，去看看最后一站";

  document.querySelectorAll(".place-card").forEach((card, index) => {
    const isLit = found.has(index);
    card.classList.toggle("is-lit", isLit);
    card.querySelector("[data-status]").textContent = isLit ? "✳ 已点亮" : "尚未点亮";
    card.querySelector(".place-button").innerHTML = isLit ? '再看一次 <span aria-hidden="true">↗</span>' : '翻开这条线索 <span aria-hidden="true">↗</span>';
  });

  const ready = remaining === 0;
  document.querySelector("#gift-card").classList.toggle("is-ready", ready);
  document.querySelector("#gift-lock").textContent = ready ? "✳ 可以拆开了" : "◌ 未解锁";
  document.querySelector("#gift-overline").textContent = ready ? "现在，这封信可以拆开了" : `还有${remaining === 3 ? "三" : remaining === 2 ? "两" : "一"}条线索，礼物就会出现`;
  document.querySelector("#gift-card-title").textContent = ready ? "给你的下一站" : "一封尚未拆开的信";
  document.querySelector("#gift-card-hint").textContent = ready ? "你已经找齐所有线索。接下来，轮到我把计划告诉你。" : "把地图上的三处回忆全部点亮，再回来拆开。";
  const giftButton = document.querySelector("#gift-button");
  giftButton.disabled = !ready;
  giftButton.innerHTML = ready ? '拆开这封信 <span aria-hidden="true">↗</span>' : '等待解锁 <span aria-hidden="true">↗</span>';
}

document.querySelectorAll("[data-open]").forEach((button) => {
  button.addEventListener("click", () => {
    activePlace = Number(button.dataset.open);
    const data = stories[activePlace];
    document.querySelector("#dialog-kicker").textContent = data.kicker;
    document.querySelector("#dialog-title").textContent = data.title;
    document.querySelector("#dialog-story").textContent = data.story;
    document.querySelector("#dialog-clue").textContent = data.clue;
    const image = document.querySelector("#dialog-image");
    image.src = data.image;
    image.alt = data.alt;
    document.querySelector("#collect-button").innerHTML = found.has(activePlace) ? '回到地图 <span aria-hidden="true">↗</span>' : '收下线索，点亮这里 <span aria-hidden="true">✳</span>';
    storyDialog.showModal();
  });
});

document.querySelector("#collect-button").addEventListener("click", () => {
  found.add(activePlace);
  try { localStorage.setItem(storageKey, JSON.stringify([...found])); } catch { /* Progress works for this visit. */ }
  storyDialog.close();
  updateProgress();
  if (found.size === stories.length) document.querySelector("#gift").scrollIntoView({ behavior: "smooth" });
});

document.querySelector("[data-close]").addEventListener("click", () => storyDialog.close());
document.querySelector("#gift-button").addEventListener("click", () => revealDialog.showModal());
document.querySelectorAll("[data-reveal-close]").forEach((button) => button.addEventListener("click", () => revealDialog.close()));
document.querySelector("#reset-button").addEventListener("click", () => {
  found.clear();
  try { localStorage.removeItem(storageKey); } catch { /* Continue without storage. */ }
  updateProgress();
  document.querySelector("#top").scrollIntoView({ behavior: "smooth" });
});
for (const dialog of [storyDialog, revealDialog]) {
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
}
updateProgress();
