// Calendar days since 2021-10-21, midnight in China (the start date is day 0).
function getTogetherDays(now = new Date()) {
  const start = Date.parse("2021-10-21T00:00:00+08:00");
  return Math.max(0, Math.floor((now.getTime() - start) / 86_400_000));
}

const togetherCounter = document.querySelector("[data-together-days]");
let togetherTimer;
function updateTogetherDays() {
  const now = new Date();
  if (togetherCounter) togetherCounter.textContent = String(getTogetherDays(now));
  clearTimeout(togetherTimer);
  const day = 86_400_000;
  const chinaOffset = 8 * 60 * 60 * 1000;
  const nextMidnight = (Math.floor((now.getTime() + chinaOffset) / day) + 1) * day - chinaOffset;
  togetherTimer = setTimeout(updateTogetherDays, nextMidnight - now.getTime() + 100);
}
updateTogetherDays();
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) updateTogetherDays();
});
window.addEventListener("pageshow", updateTogetherDays);

const stories = [
  { id: "sea", category: "photos", title: "去海边走了走，风比想象中大", note: "没有安排的周末，也很好。", image: "./assets/shoreline-memory.png", alt: "两个人在海边散步的示意照片", paragraphs: ["路上买了喝的，到了以后待到天快黑。没有特别的安排，就沿着海边慢慢走。", "风比想象中大，照片里头发也有点乱。但那天很开心，所以还是想把它留下来。"] },
  { id: "first", category: "photos", title: "第 01 期：先把最近的事放上来", note: "我们的第一份小小存档。", image: "./assets/editorial-weekend.png", alt: "两个人看地图、拍照的插画", paragraphs: ["两个人的照片、去过的地方，还有最近发生的小事。先从这些开始。", "不着急一次整理完，想到什么，就继续往里加。"] },
  { id: "photos", category: "photos", title: "手机里那几百张照片，终于开始整理了", note: "舍不得删的，都有一个理由。", paragraphs: ["先挑了一小部分放上来。接下来按地点和日期慢慢归档，想找一张照片会方便很多。", "有些照片拍得并不完美，但看到它的时候，就能想起那一天。"] },
  { id: "train", category: "places", title: "下一趟旅行，先定个方向", note: "目的地待定，同行的人已经确定。", image: "./assets/train-window.png", alt: "列车窗外的海与山插画", paragraphs: ["下一趟去哪里，还没有想好。先把想去的地方记下来，再慢慢挑一个有空的周末。", "也想给沿途的风景留一点时间。毕竟车窗外，总有计划之外的好看。"] },
  { id: "city", category: "places", title: "收藏夹里那几个想去的城市", note: "下次一起去。", image: "./assets/red-city.png", alt: "两个人在城市街道上的插画", paragraphs: ["收藏夹里攒了几个想去的城市，也存了不少小店和街道。", "先给它们留一个位置。以后真的去了，再把照片和当时的故事补上。"] },
  { id: "list", category: "places", title: "我们把旅行清单写到了第 18 条", note: "想做的事情，可以慢慢完成。", paragraphs: ["清单越写越长，暂时也不急着全部完成。", "去过的地方，拍过的照片，和那些说过“下次还来”的小店，都想好好记下来。"] },
  { id: "food", category: "days", title: "上周吃的那家店，值得再去一次", note: "记下来，下次就不用再想吃什么。", paragraphs: ["有些店吃过就忘了，有些店，走出来的时候就已经在说下次再来。", "把喜欢的那几道菜记下来，留给下一次不知道吃什么的时候。"] },
  { id: "song", category: "days", title: "最近车上一直循环的几首歌", note: "一听到，就想起一起在路上的时候。", paragraphs: ["最近在车上反复听的几首歌，还没有听腻。", "后来才发现，记住的不只是旋律，还有窗外的风景和坐在旁边的人。"] },
];
const collections = {
  photos: { label: "照片", subtitle: "拍得好不好不重要，那天很开心就好。", english: "MOMENTS WE KEEP" },
  places: { label: "旅行", subtitle: "去过的地方，还有下一次想一起去的。", english: "PLACES WITH YOU" },
  days: { label: "日常", subtitle: "一顿饭，一首歌，和一些小事。", english: "THE LITTLE THINGS" },
  all: { label: "全部记录", subtitle: "两个人的照片、地点和小事。", english: "OUR COLLECTION" },
};
const archiveDialog = document.querySelector("[data-archive-dialog]");
const archiveContent = document.querySelector("[data-dialog-content]");
const backButton = document.querySelector("[data-dialog-back]");
const dialogEyebrow = document.querySelector("[data-dialog-eyebrow]");
const searchDialog = document.querySelector("[data-search-dialog]");
const searchField = document.querySelector("#site-search");
const searchResults = document.querySelector("[data-search-results]");
const searchCount = document.querySelector("[data-search-count]");
let currentCollection = null;
let lastStoryId = null;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}
function arrowIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "icon");
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", "#arrow-up");
  svg.append(use);
  return svg;
}
function makeStoryRow(story, index, fromCollection = null) {
  const button = element("button", "dialog-item");
  button.type = "button";
  const copy = element("div");
  copy.append(element("h3", "", story.title), element("p", "", story.note));
  button.append(element("span", "item-number", String(index + 1).padStart(2, "0")), copy, arrowIcon());
  button.addEventListener("click", () => {
    if (searchDialog.open) searchDialog.close();
    openStory(story.id, fromCollection);
  });
  return button;
}
function showArchive() {
  if (!archiveDialog.open) archiveDialog.showModal();
  archiveDialog.scrollTop = 0;
}
function openCollection(key) {
  currentCollection = key;
  const collection = collections[key];
  const matching = key === "all" ? stories : stories.filter(story => story.category === key);
  const heading = element("div", "dialog-heading");
  const title = element("h2", "", collection.label);
  title.id = "dialog-title";
  heading.append(title, element("p", "", collection.subtitle));
  const list = element("div", "dialog-list");
  matching.forEach((story, index) => list.append(makeStoryRow(story, index, key)));
  archiveContent.replaceChildren(heading, list);
  dialogEyebrow.textContent = `${collection.english} / ${String(matching.length).padStart(2, "0")}`;
  backButton.hidden = true;
  showArchive();
  document.querySelector("[data-dialog-close]").focus({ preventScroll: true });
}
function openStory(id, fromCollection = null) {
  const story = stories.find(item => item.id === id);
  if (!story) return;
  lastStoryId = id;
  currentCollection = fromCollection;
  const title = element("h2", "memory-title", story.title);
  title.id = "dialog-title";
  const content = [element("span", "memory-category", collections[story.category].label), title];
  if (story.image) {
    const image = element("img", "memory-image");
    image.src = story.image;
    image.alt = story.alt;
    content.push(image);
  }
  const body = element("div", "memory-body");
  story.paragraphs.forEach(paragraph => body.append(element("p", "", paragraph)));
  const end = element("div", "memory-end");
  const next = element("button", "", "再翻一条 ↗");
  next.type = "button";
  next.addEventListener("click", openRandomStory);
  end.append(element("span", "", "A LITTLE MEMORY, S&M."), next);
  content.push(body, end);
  archiveContent.replaceChildren(...content);
  backButton.hidden = !fromCollection;
  dialogEyebrow.textContent = collections[story.category].english;
  showArchive();
  document.querySelector("[data-dialog-close]").focus({ preventScroll: true });
}
function openRandomStory() {
  const candidates = stories.filter(story => story.id !== lastStoryId);
  const next = candidates[Math.floor(Math.random() * candidates.length)];
  openStory(next.id);
}
function renderSearch(query = "") {
  const value = query.trim().toLocaleLowerCase("zh-CN");
  const matching = stories.filter(story => `${story.title} ${story.note} ${collections[story.category].label} ${story.paragraphs.join(" ")}`.toLocaleLowerCase("zh-CN").includes(value));
  searchResults.replaceChildren();
  searchCount.textContent = value ? `找到 ${matching.length} 条相关记录` : "从这些小事开始翻翻";
  matching.forEach((story, index) => searchResults.append(makeStoryRow(story, index)));
  if (!matching.length) searchResults.append(element("p", "empty-result", "还没找到，换个词再试试。"));
}

document.querySelectorAll("[data-collection]").forEach(button => button.addEventListener("click", () => openCollection(button.dataset.collection)));
document.querySelectorAll("[data-story]").forEach(button => button.addEventListener("click", () => openStory(button.dataset.story)));
document.querySelector("[data-all]").addEventListener("click", () => openCollection("all"));
document.querySelector("[data-random]").addEventListener("click", openRandomStory);
backButton.addEventListener("click", () => currentCollection && openCollection(currentCollection));
document.querySelector("[data-dialog-close]").addEventListener("click", () => archiveDialog.close());
document.querySelector("[data-search-open]").addEventListener("click", () => {
  renderSearch(searchField.value);
  searchDialog.showModal();
  searchField.focus();
});
document.querySelector("[data-search-close]").addEventListener("click", () => searchDialog.close());
searchField.addEventListener("input", () => renderSearch(searchField.value));
[archiveDialog, searchDialog].forEach(dialog => {
  let backdropPress = false;
  const outside = event => {
    const box = dialog.getBoundingClientRect();
    return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
  };
  dialog.addEventListener("pointerdown", event => { backdropPress = event.target === dialog && outside(event); });
  dialog.addEventListener("click", event => { if (backdropPress && event.target === dialog && outside(event)) dialog.close(); backdropPress = false; });
});
const navLinks = [...document.querySelectorAll(".nav-link")];
function updateNavigation() {
  const line = window.scrollY + window.innerHeight * .38;
  let active = "#top";
  for (const id of ["collections", "recent"]) {
    if (document.getElementById(id).offsetTop <= line) active = `#${id}`;
  }
  navLinks.forEach(link => {
    const selected = link.getAttribute("href") === active;
    link.classList.toggle("is-active", selected);
    if (selected) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}
window.addEventListener("scroll", updateNavigation, { passive: true });
updateNavigation();
