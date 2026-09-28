import { STAGE_IDS, getProgress } from './state.js';

const lines = [
  '嘘，欢迎来到礼物寄存站。今晚，我一直在等你。',
  '狗蛋早就为你准备好了 2026 年的生日礼物。',
  '可是刚才，影子大盗趁没人注意，把礼物藏了起来。',
  '他自以为藏得天衣无缝，却不小心留下了三条线索。',
  '闯过三关，把线索一条条找回来，我们就能解开礼物的秘密。',
  '别担心，我会一直在这里等你。准备好开始了吗？'
];

const dialogue = document.querySelector('[data-dialogue]');
const text = document.querySelector('[data-dialogue-text]');
const lineCount = document.querySelector('[data-line-count]');
const next = document.querySelector('[data-next]');
const hint = document.querySelector('[data-dialogue-hint]');
const mission = document.querySelector('[data-mission-note]');
const replay = document.querySelector('[data-replay]');
const thief = document.querySelector('[data-thief]');
let currentLine = 0;

function renderLine() {
  text.textContent = lines[currentLine];
  text.style.animation = 'none';
  void text.offsetWidth;
  text.style.animation = '';
  lineCount.textContent = `${String(currentLine + 1).padStart(2, '0')} / ${String(lines.length).padStart(2, '0')}`;
  hint.textContent = currentLine === lines.length - 1 ? '三条线索，在前方等你' : '点一下，听我慢慢说';
  next.firstChild.textContent = currentLine === lines.length - 1 ? '记下任务 ' : '继续听 ';
  thief.hidden = currentLine !== 2 && currentLine !== 3;
}

function advance() {
  if (currentLine < lines.length - 1) {
    currentLine += 1;
    renderLine();
    return;
  }
  dialogue.hidden = true;
  mission.hidden = false;
  replay.focus();
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
replay.addEventListener('click', () => {
  currentLine = 0;
  mission.hidden = true;
  dialogue.hidden = false;
  renderLine();
  next.focus();
});

renderProgress();
renderLine();
