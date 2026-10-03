import { completeStage, getProgress } from './state.js';
import { memoryItems } from './memory-items.js';

function shuffledDeck() {
  const deck = memoryItems.flatMap((item) => [item, item]);
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[other]] = [deck[other], deck[index]];
  }
  return deck;
}

export function setupMemoryStage({ searchRoom, onProgressChange, onClose }) {
  const stage = document.querySelector('[data-memory-stage]');
  const grid = stage.querySelector('[data-memory-grid]');
  const status = stage.querySelector('[data-memory-status]');
  const count = stage.querySelector('[data-memory-count]');
  const collection = stage.querySelector('[data-memory-collection]');
  const detail = stage.querySelector('[data-memory-detail]');
  const empty = stage.querySelector('[data-memory-empty]');
  const finish = stage.querySelector('[data-memory-finish]');
  const mobileRecall = stage.querySelector('[data-memory-mobile-recall]');
  const back = stage.querySelector('[data-memory-back]');
  const deck = shuffledDeck();
  const found = new Set();
  const cards = [];
  const keepsakes = new Map();
  let selected = [];
  let pendingTurn = 0;
  let pendingFinish = 0;
  let pendingRecall = 0;
  let lastMemory = null;
  let locked = false;

  function say(message) {
    status.textContent = message;
  }

  function showMemory(item) {
    lastMemory = item.id;
    empty.hidden = true;
    detail.hidden = false;
    detail.style.setProperty('--memory-color', item.color);
    detail.querySelector('img').src = item.image;
    detail.querySelector('[data-memory-category]').textContent = item.category;
    detail.querySelector('[data-memory-title]').textContent = item.label;
    detail.querySelector('[data-memory-copy]').textContent = item.memory;
    window.clearTimeout(pendingRecall);
    mobileRecall.querySelector('strong').textContent = item.label;
    mobileRecall.querySelector('p').textContent = item.memory;
    mobileRecall.hidden = false;
    pendingRecall = window.setTimeout(() => {
      pendingRecall = 0;
      mobileRecall.hidden = true;
    }, 4500);
    keepsakes.forEach((button, id) => {
      button.classList.toggle('is-current', id === item.id);
      button.setAttribute('aria-pressed', String(id === item.id));
    });
  }

  function renderCards() {
    cards.forEach((button, index) => {
      const item = deck[index];
      const matched = found.has(item.id);
      const revealed = matched || selected.includes(index);
      button.classList.toggle('is-flipped', revealed);
      button.classList.toggle('is-matched', matched);
      button.querySelector('.memory-card-front').setAttribute('aria-hidden', String(!revealed));
      button.querySelector('.memory-card-back').setAttribute('aria-hidden', String(revealed));
      button.setAttribute('aria-pressed', String(revealed));
      button.setAttribute('aria-label', revealed
        ? `第 ${index + 1} 张：${item.label}${matched ? '，已配对，点击查看回忆' : '，已翻开'}`
        : `翻开第 ${index + 1} 张卡片`);
    });
    count.textContent = `${found.size} / ${memoryItems.length} 对`;
    keepsakes.forEach((button, id) => {
      const matched = found.has(id);
      button.hidden = !matched;
    });
    stage.querySelector('[data-memory-collected]').textContent = `已找回 ${found.size} / ${memoryItems.length}`;
    collection.hidden = found.size === 0;
  }

  function revealFinish() {
    pendingFinish = 0;
    if (stage.hidden) return;
    finish.hidden = false;
    grid.inert = true;
    stage.querySelector('[data-memory-finish-view]').focus({ preventScroll: true });
  }

  function flip(index) {
    if (stage.hidden || !finish.hidden || locked) return;
    const item = deck[index];
    if (found.has(item.id)) {
      showMemory(item);
      say(item.memory);
      return;
    }
    if (selected.includes(index)) return;
    selected.push(index);
    renderCards();
    if (selected.length === 1) {
      say(`翻到了${item.label}。再翻一张，找找它的另一张。`);
      return;
    }
    const first = deck[selected[0]];
    if (first.id === item.id) {
      found.add(item.id);
      selected = [];
      showMemory(item);
      renderCards();
      say(`配对成功。${item.memory}`);
      if (found.size === memoryItems.length) {
        completeStage('clue-2');
        onProgressChange();
        // Leave the last memory visible before the clue appears.
        pendingFinish = window.setTimeout(revealFinish, 1100);
      }
      return;
    }
    locked = true;
    say('这两张不一样。记住它们的位置，再试一次。');
    pendingTurn = window.setTimeout(() => {
      pendingTurn = 0;
      selected = [];
      locked = false;
      renderCards();
      say('卡片翻回去了，继续找找看。');
    }, 1200);
  }

  deck.forEach((item, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'memory-card';
    button.dataset.memoryCard = String(index);
    button.style.setProperty('--memory-color', item.color);
    button.style.setProperty('--card-tilt', `${[-2, 1.5, -1, 2][index % 4]}deg`);
    // Labels are assigned with textContent so memories can safely be edited.
    button.innerHTML = '<span class="memory-card-turn"><span class="memory-card-back" aria-hidden="true"><span class="memory-back-corner">✦</span><span class="memory-back-emblem"><span>✳</span></span><span class="memory-back-caption">礼物寄存站</span><span class="memory-back-line"></span><span class="memory-back-corner memory-back-corner-bottom">✦</span></span><span class="memory-card-front" aria-hidden="true"><span class="memory-card-art"><img alt="" draggable="false" /></span><span class="memory-card-label"></span><span class="memory-card-found" aria-hidden="true">✓</span></span></span>';
    button.querySelector('img').src = item.image;
    button.querySelector('.memory-card-label').textContent = item.label;
    button.addEventListener('click', () => flip(index));
    grid.append(button);
    cards.push(button);
  });

  memoryItems.forEach((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'memory-keepsake';
    button.hidden = true;
    button.setAttribute('aria-label', `查看${item.label}的回忆`);
    button.setAttribute('aria-pressed', 'false');
    const image = document.createElement('img');
    image.src = item.image;
    image.alt = '';
    button.append(image);
    button.addEventListener('click', () => {
      showMemory(item);
      say(item.memory);
    });
    collection.append(button);
    keepsakes.set(item.id, button);
  });

  // Arrow keys move between cards; Enter and Space use native button clicks.
  grid.addEventListener('keydown', (event) => {
    const index = Number(event.target.closest('[data-memory-card]')?.dataset.memoryCard);
    if (!Number.isInteger(index)) return;
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4 }[event.key];
    if (!step) return;
    event.preventDefault();
    cards[(index + step + cards.length) % cards.length].focus({ preventScroll: false });
  });

  function open() {
    stage.hidden = false;
    stage.inert = false;
    stage.scrollTop = 0;
    searchRoom.inert = true;
    const completed = found.size === memoryItems.length;
    // Reconcile the clue if another stage has reset overall progress.
    if (completed && !getProgress().completedStages.includes('clue-2')) {
      completeStage('clue-2');
      onProgressChange();
    }
    finish.hidden = !completed;
    grid.inert = completed;
    renderCards();
    say(completed ? '所有回忆都找回来了。' : '每次翻开两张，找到相同的纪念物。慢慢来，不用着急。');
    if (completed) stage.querySelector('[data-memory-finish-view]').focus({ preventScroll: true });
    else back.focus({ preventScroll: true });
  }

  function close() {
    window.clearTimeout(pendingTurn);
    window.clearTimeout(pendingFinish);
    window.clearTimeout(pendingRecall);
    pendingTurn = 0;
    pendingFinish = 0;
    pendingRecall = 0;
    mobileRecall.hidden = true;
    selected = [];
    locked = false;
    renderCards();
    stage.hidden = true;
    stage.inert = true;
    searchRoom.inert = false;
    onClose();
  }

  back.addEventListener('click', close);
  stage.querySelector('[data-memory-finish-back]').addEventListener('click', close);
  stage.querySelector('[data-memory-finish-view]').addEventListener('click', () => {
    finish.hidden = true;
    grid.inert = false;
    const index = deck.findIndex((item) => item.id === lastMemory);
    cards[Math.max(index, 0)].focus({ preventScroll: true });
  });
  stage.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  });

  renderCards();
  return { open, close };
}
