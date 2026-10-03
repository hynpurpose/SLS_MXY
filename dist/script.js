import { STAGE_IDS, getProgress } from './state.js';
import { setupMapStage } from './map-stage.js';
import { setupTvStage } from './tv-stage.js';
import { setupMemoryStage } from './memory-stage.js';

const lines = [
  '嘘，欢迎来到礼物寄存站。今晚，我一直在等你。',
  '狗蛋早就为你准备好了 2026 年的生日礼物。',
  '可是刚才，影子大盗趁没人注意，把礼物藏了起来。',
  '他自以为藏得天衣无缝，却不小心留下了三条线索。',
  '闯过三关，把线索一条条找回来，我们就能解开礼物的秘密。',
  '别担心，我会一直在这里等你。准备好开始了吗？'
];

const cluePreviews = {
  'clue-1': {
    number: '01', title: '墙上的地图',
    hint: '旅行照片散落了，先想想每张照片属于哪里。',
    play: '把照片逐张拖到地图上的对应位置，固定全部 17 张后找到线索。'
  },
  'clue-2': {
    number: '02', title: '地上散落的物品',
    hint: '散落的卡片里，藏着我们送过的礼物和一起留下的回忆。',
    play: '每次翻开两张卡片，找到相同的纪念物。配成全部 8 对，找回第二条线索。不计时，也不限制次数。'
  },
  'clue-3': {
    number: '03', title: '电视机',
    hint: '影子大盗把录像带的播放顺序弄乱了。',
    play: '逐盘观看录像，把带子拖进下方的播放顺序；已放的带子也能继续调整。'
  }
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
const searchGuide = document.querySelector('[data-search-guide]');
const searchGuideCopy = document.querySelector('[data-search-guide-copy]');
const clueMarkers = [...document.querySelectorAll('[data-clue]')];
const sceneTargets = [...document.querySelectorAll('[data-scene-target]')];
const clueDialog = document.querySelector('[data-clue-dialog]');
const closeClue = document.querySelector('[data-clue-close]');
const returnButton = document.querySelector('[data-return]');
const mapButton = document.querySelector('[data-scene-target="clue-1"]');
const tvButton = document.querySelector('[data-scene-target="clue-3"]');
const memoryButton = document.querySelector('[data-scene-target="clue-2"]');
let lastClueButton = null;
let currentLine = 0;
const transitionTime = matchMedia('(prefers-reduced-motion: reduce)').matches ? 20 : 1650;
const objectResponseTime = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 170;
let enteringStage = false;
const mapStage = setupMapStage({
  game,
  searchRoom,
  onProgressChange: renderProgress,
  onClose: () => mapButton.focus({ preventScroll: true }),
});
const tvStage = setupTvStage({
  searchRoom,
  onProgressChange: renderProgress,
  onClose: () => tvButton.focus({ preventScroll: true }),
});
const memoryStage = setupMemoryStage({
  searchRoom,
  onProgressChange: renderProgress,
  onClose: () => memoryButton.focus({ preventScroll: true }),
});

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
    if (!clueDialog.open) searchGuide.focus({ preventScroll: true });
  }, transitionTime);
}

function setHints(visible) {
  searchRoom.classList.toggle('is-hinting', visible);
  searchGuide.setAttribute('aria-expanded', String(visible));
  searchGuideCopy.textContent = visible
    ? '三个地方已经标出来了。再点一次可以收起。'
    : '点一下，把三个可疑的地方标出来。';
  clueMarkers.forEach((marker) => {
    marker.hidden = !visible;
  });
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

// The seasonal game stays separate from the main site. On a future private
// server, replace this local return URL with the main site's own address.
const homeLink = document.querySelector('[data-home-link]');
if (location.hostname !== '127.0.0.1' && location.hostname !== 'localhost') homeLink.hidden = true;

next.addEventListener('click', advance);
searchGuide.addEventListener('click', () => {
  setHints(!searchRoom.classList.contains('is-hinting'));
});

returnButton.addEventListener('click', () => {
  setHints(false);
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

clueMarkers.forEach((button) => {
  button.addEventListener('click', () => {
    const clue = cluePreviews[button.dataset.clue];
    lastClueButton = button;
    document.querySelector('[data-clue-number]').textContent = `线索 ${clue.number} / 03`;
    document.querySelector('[data-clue-title]').textContent = clue.title;
    document.querySelector('[data-clue-hint]').textContent = clue.hint;
    document.querySelector('[data-clue-play]').textContent = clue.play;
    clueDialog.showModal();
  });
});
closeClue.addEventListener('click', () => clueDialog.close());
clueDialog.addEventListener('click', (event) => {
  if (event.target === clueDialog) clueDialog.close();
});
clueDialog.addEventListener('close', () => lastClueButton?.focus());

sceneTargets.forEach((target) => {
  const id = target.dataset.sceneTarget;
  const lightObject = () => { searchRoom.dataset.activeObject = id; };
  const dimObject = () => {
    if (searchRoom.dataset.activeObject === id && !enteringStage) delete searchRoom.dataset.activeObject;
  };
  target.addEventListener('pointerenter', lightObject);
  target.addEventListener('pointerleave', dimObject);
  target.addEventListener('focus', lightObject);
  target.addEventListener('blur', dimObject);
  target.addEventListener('click', () => {
    if (enteringStage) return;
    enteringStage = true;
    lightObject();
    window.setTimeout(() => {
      enteringStage = false;
      delete searchRoom.dataset.activeObject;
      if (id === 'clue-1') {
        mapStage.open();
        return;
      }
      if (id === 'clue-3') {
        tvStage.open();
        return;
      }
      if (id === 'clue-2') memoryStage.open();
    }, objectResponseTime);
  });
});
renderProgress();
renderLine();
