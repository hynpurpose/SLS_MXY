import { STAGE_IDS, getProgress } from './state.js';

const lines = [
  '嘘，欢迎来到礼物寄存站。今晚，我一直在等你。',
  '狗蛋早就为你准备好了 2026 年的生日礼物。',
  '可是刚才，影子大盗趁没人注意，把礼物藏了起来。',
  '他自以为藏得天衣无缝，却不小心留下了三条线索。',
  '闯过三关，把线索一条条找回来，我们就能解开礼物的秘密。',
  '别担心，我会一直在这里等你。准备好开始了吗？'
];

const cluePreviews = {
  'clue-1': { number: '01', title: '墙上的地图', description: '地图上的路线似乎通向某个地方。这条线索的挑战，即将从这里开始。' },
  'clue-2': { number: '02', title: '地上散落的物品', description: '信封、缎带、旧票和照片散了一地。真正重要的东西，还得仔细找找。' },
  'clue-3': { number: '03', title: '电视机', description: '屏幕还没有亮起来。它会是第三条线索的入口。' }
};

const game = document.querySelector('.game');
const dialogue = document.querySelector('[data-dialogue]');
const text = document.querySelector('[data-dialogue-text]');
const lineCount = document.querySelector('[data-line-count]');
const next = document.querySelector('[data-next]');
const hint = document.querySelector('[data-dialogue-hint]');
const thief = document.querySelector('[data-thief]');
const npc = document.querySelector('[data-npc]');
const introRoom = document.querySelector('[data-intro-room]');
const searchRoom = document.querySelector('[data-search-room]');
const searchTitle = document.querySelector('[data-search-title]');
const clueDialog = document.querySelector('[data-clue-dialog]');
const closeClue = document.querySelector('[data-clue-close]');
const returnButton = document.querySelector('[data-return]');
let lastClueButton = null;
let currentLine = 0;
const transitionTime = matchMedia('(prefers-reduced-motion: reduce)').matches ? 20 : 1650;

function renderLine() {
  text.textContent = lines[currentLine];
  text.style.animation = 'none';
  void text.offsetWidth;
  text.style.animation = '';
  lineCount.textContent = `${String(currentLine + 1).padStart(2, '0')} / ${String(lines.length).padStart(2, '0')}`;
  hint.textContent = currentLine === lines.length - 1 ? '三条线索，在前方等你' : '点一下，听我慢慢说';
  next.firstChild.textContent = currentLine === lines.length - 1 ? '开始寻找线索 ' : '继续听 ';
  thief.hidden = currentLine !== 2 && currentLine !== 3;
}

function advance() {
  if (currentLine < lines.length - 1) {
    currentLine += 1;
    renderLine();
    return;
  }
  dialogue.hidden = true;
  introRoom.inert = true;
  searchRoom.inert = false;
  game.classList.add('is-searching');
  window.setTimeout(() => {
    if (!game.classList.contains('is-searching')) return;
    npc.hidden = true;
    if (!clueDialog.open) searchTitle.focus({ preventScroll: true });
  }, transitionTime);
}

function renderProgress() {
  const completed = getProgress().completedStages;
  document.querySelector('[data-progress-count]').innerHTML = `${completed.length} <small>/ ${STAGE_IDS.length}</small>`;
  const slots = document.querySelector('[data-progress-slots]');
  slots.setAttribute('aria-label', `已收集 ${completed.length} 条线索，共 ${STAGE_IDS.length} 条`);
  slots.querySelectorAll('[data-slot]').forEach((slot, index) => {
    slot.classList.toggle('is-found', completed.includes(STAGE_IDS[index]));
    slot.textContent = completed.includes(STAGE_IDS[index]) ? '✓' : String(index + 1);
  });
}

// The game is isolated from the main site. This local return link is hidden
// on the hosted game until a public main-site URL is available.
const homeLink = document.querySelector('[data-home-link]');
if (location.hostname !== '127.0.0.1' && location.hostname !== 'localhost') homeLink.hidden = true;

next.addEventListener('click', advance);
returnButton.addEventListener('click', () => {
  npc.hidden = false;
  introRoom.inert = false;
  searchRoom.inert = true;
  game.classList.remove('is-searching');
  dialogue.hidden = false;
  renderLine();
  window.setTimeout(() => {
    if (!game.classList.contains('is-searching')) next.focus({ preventScroll: true });
  }, transitionTime);
});

document.querySelectorAll('[data-clue]').forEach((button) => {
  button.addEventListener('click', () => {
    const clue = cluePreviews[button.dataset.clue];
    lastClueButton = button;
    document.querySelector('[data-clue-number]').textContent = `线索 ${clue.number} / 03`;
    document.querySelector('[data-clue-title]').textContent = clue.title;
    document.querySelector('[data-clue-description]').textContent = clue.description;
    clueDialog.showModal();
  });
});
closeClue.addEventListener('click', () => clueDialog.close());
clueDialog.addEventListener('click', (event) => {
  if (event.target === clueDialog) clueDialog.close();
});
clueDialog.addEventListener('close', () => lastClueButton?.focus());

renderProgress();
renderLine();
