import { completeStage } from './state.js';
import { placeTape, removeTape } from './tv-order.js';
import { tvTapes } from './tv-tapes.js';

const byId = new Map(tvTapes.map((tape) => [tape.id, tape]));
const answer = [...tvTapes].sort((a, b) => a.sequence - b.sequence).map((tape) => tape.id);

export function setupTvStage({ searchRoom, onProgressChange, onClose }) {
  const stage = document.querySelector('[data-tv-stage]');
  const shelf = stage.querySelector('[data-tv-shelf]');
  const rail = stage.querySelector('[data-tv-slots]');
  const ghost = stage.querySelector('[data-tv-ghost]');
  const feedback = stage.querySelector('[data-tv-feedback]');
  const video = stage.querySelector('[data-tv-video]');
  const placeholder = stage.querySelector('[data-tv-placeholder]');
  const screen = stage.querySelector('[data-tv-screen]');
  const replay = stage.querySelector('[data-tv-replay]');
  const armButton = stage.querySelector('[data-tv-arm]');
  const mobilePlacer = stage.querySelector('[data-tv-mobile-placer]');
  const mobileArmButton = stage.querySelector('[data-tv-mobile-arm]');
  const check = stage.querySelector('[data-tv-check]');
  const finish = stage.querySelector('[data-tv-finish]');
  let slots = Array(tvTapes.length).fill(null);
  let seen = new Set();
  let currentTape = null;
  let armedTape = null;
  let drag = null;
  let previewIndex = null;
  let justDraggedUntil = 0;
  let completed = false;
  let ghostFrame = 0;
  let settleFrame = 0;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tapeCards = new Map();
  const slotButtons = [];

  const setFeedback = (message) => { feedback.textContent = message; };

  function renderArming() {
    stage.classList.toggle('is-armed', Boolean(armedTape));
    armButton.disabled = !currentTape;
    armButton.textContent = armedTape ? '取消选择' : '选择位置 ↗';
    mobilePlacer.hidden = !currentTape;
    stage.querySelector('[data-tv-mobile-label]').textContent = armedTape
      ? `录像带 ${byId.get(armedTape).label} · 点一个位置`
      : `当前：录像带 ${byId.get(currentTape)?.label ?? ''}`;
    mobileArmButton.textContent = armedTape ? '取消' : '选择位置 ↗';
  }

  function makeTape(tape) {
    if (tapeCards.has(tape.id)) return tapeCards.get(tape.id);
    const face = document.createElement('span');
    face.className = 'tv-tape-face';
    face.innerHTML = '<i class="tv-reel"></i><i class="tv-reel"></i>';
    const label = document.createElement('span');
    label.className = 'tv-tape-label';
    label.textContent = `录像带 ${tape.label}`;
    face.append(label);
    const card = document.createElement('span');
    card.className = 'tv-tape-card';
    card.dataset.tvTape = tape.id;
    card.append(face);
    tapeCards.set(tape.id, card);
    return card;
  }

  function buildSlots() {
    tvTapes.forEach((_, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tv-order-slot';
      button.dataset.tvSlot = String(index);
      const number = document.createElement('span');
      number.className = 'tv-slot-number';
      number.textContent = String(index + 1).padStart(2, '0');
      const empty = document.createElement('span');
      empty.className = 'tv-slot-empty';
      empty.textContent = '放在这里';
      button.append(number, empty);
      slotButtons.push(button);
      rail.append(button);
    });
  }

  function renderSlots() {
    slotButtons.forEach((button, index) => {
      const id = slots[index];
      button.classList.toggle('has-tape', Boolean(id));
      button.classList.remove('is-preview');
      button.querySelector('.tv-slot-empty').hidden = Boolean(id);
      button.setAttribute('aria-label', id
        ? `第 ${index + 1} 位：录像带 ${byId.get(id).label}；点击播放，可拖动调整`
        : `第 ${index + 1} 位：空位；把录像带拖到这里`);
      if (id) {
        const card = makeTape(byId.get(id));
        card.classList.add('is-on-rail');
        button.append(card);
      }
    });
  }

  function renderShelf() {
    const buttons = [];
    tvTapes.filter((tape) => !slots.includes(tape.id)).forEach((tape) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tv-shelf-tape';
      button.dataset.tvTape = tape.id;
      button.setAttribute('aria-label', `播放录像带 ${tape.label}；拖动到播放顺序`);
      button.setAttribute('aria-keyshortcuts', 'Space');
      const card = makeTape(tape);
      card.classList.remove('is-on-rail');
      button.append(card);
      buttons.push(button);
    });
    shelf.replaceChildren(...buttons);
    shelf.classList.toggle('is-empty', slots.every(Boolean));
  }

  function captureCardRects() {
    return new Map([...tapeCards].map(([id, card]) => [id, card.isConnected ? card.getBoundingClientRect() : null]));
  }

  function clearPreview() {
    slotButtons.forEach((button) => button.classList.remove('is-preview'));
    tapeCards.forEach((card) => {
      card.style.transform = '';
      card.style.opacity = '';
    });
    previewIndex = null;
  }

  function animateToSlots(previous, draggedId, dragOrigin) {
    if (reducedMotion) return;
    tapeCards.forEach((card, id) => {
      const from = id === draggedId && dragOrigin ? dragOrigin : previous.get(id);
      if (!from?.width || !card.isConnected) return;
      const to = card.getBoundingClientRect();
      if (!dragOrigin && (from.bottom < 0 || from.top > innerHeight)) {
        if (id === draggedId) card.animate([
          { transform: 'scale(.88)', opacity: .35 },
          { transform: 'scale(1)', opacity: 1 },
        ], { duration: 220, easing: 'cubic-bezier(.18,.8,.25,1)' });
        return;
      }
      const dx = from.left - to.left;
      const dy = from.top - to.top;
      if (Math.abs(dx) + Math.abs(dy) < 2) return;
      card.getAnimations().forEach((animation) => animation.cancel());
      card.animate([
        { transform: `translate3d(${dx}px, ${dy}px, 0) scale(${from.width / to.width}, ${from.height / to.height})` },
        { transform: 'translate3d(0, 0, 0) scale(1)' },
      ], { duration: id === draggedId ? 300 : 250, easing: 'cubic-bezier(.18,.8,.25,1)' });
    });
  }

  function renderCounts() {
    stage.querySelector('[data-tv-count]').textContent = `已看 ${seen.size} / ${tvTapes.length}`;
    stage.querySelector('[data-tv-placed]').textContent = `${slots.filter(Boolean).length} / ${tvTapes.length} 已放入`;
    check.disabled = slots.some((id) => !id) || seen.size < tvTapes.length;
  }

  function render(draggedId = null, dragOrigin = null) {
    const previous = captureCardRects();
    stage.classList.add('is-settling');
    clearPreview();
    renderSlots();
    renderShelf();
    renderCounts();
    animateToSlots(previous, draggedId, dragOrigin);
    cancelAnimationFrame(settleFrame);
    settleFrame = requestAnimationFrame(() => stage.classList.remove('is-settling'));
  }

  function playTape(id) {
    const tape = byId.get(id);
    if (!tape) return;
    currentTape = id;
    armedTape = null;
    seen.add(id);
    video.pause();
    if (tape.src) {
      placeholder.hidden = true;
      video.hidden = false;
      video.src = tape.src;
      video.load();
      video.play().catch(() => {});
    } else {
      video.hidden = true;
      video.removeAttribute('src');
      placeholder.hidden = false;
      stage.querySelector('[data-tv-screen-code]').textContent = `TAPE ${tape.label} · PLACEHOLDER`;
      stage.querySelector('[data-tv-screen-title]').textContent = '录像画面占位';
      stage.querySelector('[data-tv-screen-time]').textContent = tape.time;
      screen.classList.remove('is-playing');
      void screen.offsetWidth;
      screen.classList.add('is-playing');
    }
    stage.querySelector('[data-tv-now-playing]').textContent = `正在播放：录像带 ${tape.label}`;
    replay.disabled = false;
    renderArming();
    tapeCards.forEach((card, tapeId) => card.classList.toggle('is-seen', seen.has(tapeId)));
    renderCounts();
  }

  function insert(id, index, dragOrigin = null) {
    const next = placeTape(slots, id, index);
    if (next.every((value, position) => value === slots[position])) {
      clearPreview();
      return;
    }
    slots = next;
    armedTape = null;
    renderArming();
    render(id, dragOrigin);
    setFeedback(`录像带 ${byId.get(id).label} 已放在第 ${index + 1} 位。`);
  }

  function arm(id) {
    armedTape = armedTape === id ? null : id;
    setFeedback(armedTape
      ? `已选录像带 ${byId.get(id).label}，现在选择一个顺序位置。`
      : '已取消选择。');
    renderArming();
  }

  function moveGhost(x, y) {
    if (ghostFrame) cancelAnimationFrame(ghostFrame);
    ghostFrame = requestAnimationFrame(() => {
      ghost.style.translate = `${x + 14}px ${y + 14}px`;
      ghostFrame = 0;
    });
  }

  function updatePreview(index) {
    if (previewIndex === index) return;
    previewIndex = index;
    slotButtons.forEach((button) => button.classList.remove('is-preview'));
    tapeCards.forEach((card) => {
      card.style.transform = '';
      card.style.opacity = card.dataset.tvTape === drag.id ? '.22' : '';
    });
    if (index === null) return;
    slotButtons[index].classList.add('is-preview');
    const projected = placeTape(slots, drag.id, index);
    slots.forEach((id, fromIndex) => {
      if (!id || id === drag.id) return;
      const toIndex = projected.indexOf(id);
      if (toIndex === fromIndex || toIndex < 0) return;
      const from = slotButtons[fromIndex].getBoundingClientRect();
      const to = slotButtons[toIndex].getBoundingClientRect();
      tapeCards.get(id).style.transform = `translate3d(${to.left - from.left}px, ${to.top - from.top}px, 0)`;
    });
  }

  function endDrag(event, cancelled = false) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (drag.active) {
      if (ghostFrame) cancelAnimationFrame(ghostFrame);
      ghostFrame = 0;
      ghost.style.translate = `${event.clientX + 14}px ${event.clientY + 14}px`;
      const origin = ghost.querySelector('.tv-tape-card')?.getBoundingClientRect() ?? null;
      if (!cancelled && previewIndex !== null) insert(drag.id, previewIndex, origin);
      else if (!cancelled && drag.fromSlot !== -1 && document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-tv-shelf]')) {
        slots = removeTape(slots, drag.id);
        render(drag.id, origin);
        setFeedback(`录像带 ${byId.get(drag.id).label} 已放回抽屉。`);
      } else clearPreview();
      justDraggedUntil = Date.now() + 250;
    }
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    ghost.hidden = true;
    ghost.replaceChildren();
    stage.classList.remove('is-dragging');
    drag = null;
    previewIndex = null;
  }

  stage.addEventListener('pointerdown', (event) => {
    if (stage.hidden || event.button !== 0) return;
    const tapeButton = event.target.closest('[data-tv-tape]');
    if (!tapeButton || !stage.contains(tapeButton)) return;
    const id = tapeButton.dataset.tvTape;
    const slot = tapeButton.closest('[data-tv-slot]');
    drag = { pointerId: event.pointerId, id, fromSlot: slot ? Number(slot.dataset.tvSlot) : -1,
      startX: event.clientX, startY: event.clientY, active: false };
  });

  window.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.pointerId || stage.hidden) return;
    if (!drag.active && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 7) {
      drag.active = true;
      stage.setPointerCapture(event.pointerId);
      const card = tapeCards.get(drag.id);
      ghost.replaceChildren(card.cloneNode(true));
      ghost.style.width = `${Math.min(185, Math.max(116, card.getBoundingClientRect().width))}px`;
      ghost.hidden = false;
      stage.classList.add('is-dragging');
      card.style.opacity = '.22';
    }
    if (!drag.active) return;
    event.preventDefault();
    moveGhost(event.clientX, event.clientY);
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-tv-slot]');
    updatePreview(target && stage.contains(target) ? Number(target.dataset.tvSlot) : null);
  }, { passive: false });

  window.addEventListener('pointerup', (event) => endDrag(event));
  window.addEventListener('pointercancel', (event) => endDrag(event, true));
  stage.addEventListener('click', (event) => {
    if (Date.now() < justDraggedUntil) { event.preventDefault(); event.stopPropagation(); return; }
    const slot = event.target.closest('[data-tv-slot]');
    if (slot && armedTape) { insert(armedTape, Number(slot.dataset.tvSlot)); return; }
    const id = slot ? slots[Number(slot.dataset.tvSlot)] : event.target.closest('[data-tv-tape]')?.dataset.tvTape;
    if (id) playTape(id);
  }, true);

  stage.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
      const id = event.target.closest('[data-tv-tape]')?.dataset.tvTape
        ?? slots[Number(event.target.closest('[data-tv-slot]')?.dataset.tvSlot)];
      if (id) { event.preventDefault(); arm(id); }
    }
    if (event.key === 'Escape' && !stage.hidden) {
      event.preventDefault();
      if (armedTape) { arm(armedTape); return; }
      close();
    }
  });

  replay.addEventListener('click', () => {
    if (currentTape) playTape(currentTape);
  });
  armButton.addEventListener('click', () => { if (currentTape) arm(currentTape); });
  mobileArmButton.addEventListener('click', () => { if (currentTape) arm(currentTape); });
  check.addEventListener('click', () => {
    if (slots.some((id) => !id) || seen.size < tvTapes.length) return;
    if (slots.every((id, index) => id === answer[index])) {
      if (!completed) {
        completed = true;
        completeStage('clue-3');
        onProgressChange();
      }
      finish.hidden = false;
      stage.querySelector('[data-tv-finish-view]').focus({ preventScroll: true });
    } else setFeedback('顺序还不对。可以重看录像，再调整带子。');
  });
  stage.querySelector('[data-tv-finish-view]').addEventListener('click', () => {
    finish.hidden = true;
    check.focus({ preventScroll: true });
  });
  stage.querySelector('[data-tv-finish-back]').addEventListener('click', () => close());
  stage.querySelector('[data-tv-back]').addEventListener('click', () => close());

  function open() {
    stage.hidden = false;
    stage.inert = false;
    searchRoom.inert = true;
    finish.hidden = !completed;
    render();
    stage.querySelector('[data-tv-back]').focus({ preventScroll: true });
  }

  function close() {
    if (drag) {
      ghost.hidden = true;
      ghost.replaceChildren();
      drag = null;
      clearPreview();
      stage.classList.remove('is-dragging');
    }
    if (ghostFrame) cancelAnimationFrame(ghostFrame);
    ghostFrame = 0;
    video.pause();
    armedTape = null;
    renderArming();
    stage.hidden = true;
    stage.inert = true;
    searchRoom.inert = false;
    onClose();
  }

  buildSlots();
  render();
  renderArming();
  return { open, close };
}
