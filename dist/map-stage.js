import { completeStage, resetFromStage } from './state.js';
import { MAP_CITIES, MAP_STOPS, MAP_VIEWS, mapPoint } from './map-data.js';
import { photoSources } from './photo-sources.js';

const viewIds = Object.keys(MAP_VIEWS);
const introLines = [
  '影子大盗把旅行照片弄散了。帮我把它们放回地图。',
  '一次一张。看照片，选地图页，再把照片拖到对应的位置。',
  '17 张都放好，就能找到第一条线索。',
];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const percentX = (x) => `${x / 12}%`;
const percentY = (y) => `${y / 8.6}%`;

function renderPhotoWindow(container, stop) {
  container.replaceChildren();
  const src = photoSources[stop.id];
  container.setAttribute('aria-label', src ? '旅行照片' : '空白照片占位卡');
  if (src) {
    const image = document.createElement('img');
    image.src = src;
    image.alt = '旅行照片';
    image.loading = 'lazy';
    container.append(image);
    return;
  }
  // An empty image area never exposes the answer in the final photo card.
}

function placeMiniPhotos(stops, viewId) {
  // Cards remain physically attached to their exact pins. Try several nearby
  // positions so dense areas such as Kansai and the Pearl River Delta stay clear.
  const occupied = [];
  const remaining = MAP_STOPS.filter((candidate) =>
    candidate.view === viewId && !stops.some((stop) => stop.id === candidate.id)
  ).map((stop) => mapPoint(stop, viewId));
  const options = [
    [-50, -147], [34, -135], [-140, -70], [43, -61], [-54, 30], [45, 24],
    [-155, 25], [95, -126], [-180, -140], [105, 35],
  ];
  return stops.map((stop) => {
    const pin = mapPoint(stop, viewId);
    let best;
    for (const [dx, dy] of options) {
      const x = clamp(pin.x + dx, 10, 1082);
      const y = clamp(pin.y + dy, 8, 722);
      const rect = { x, y, w: 108, h: 130 };
      let score = Math.hypot(x + 54 - pin.x, y + 63 - pin.y) * .04;
      for (const other of occupied) {
        const overlapX = Math.max(0, Math.min(x + rect.w, other.x + other.w) - Math.max(x, other.x));
        const overlapY = Math.max(0, Math.min(y + rect.h, other.y + other.h) - Math.max(y, other.y));
        score += overlapX * overlapY * 2;
      }
      for (const target of remaining) {
        if (target.x > x - 16 && target.x < x + rect.w + 16 && target.y > y - 16 && target.y < y + rect.h + 16) {
          score += 50000;
        }
      }
      if (!best || score < best.score) best = { rect, score };
    }
    occupied.push(best.rect);
    return { stop, pin, card: best.rect };
  });
}

export function setupMapStage({ game, searchRoom, onProgressChange, onClose }) {
  const stage = document.querySelector('[data-map-stage]');
  const sheet = stage.querySelector('.atlas-sheet');
  const intro = stage.querySelector('[data-map-intro]');
  const introText = stage.querySelector('[data-map-intro-text]');
  const introNumber = stage.querySelector('[data-map-intro-number]');
  const introNext = stage.querySelector('[data-map-intro-next]');
  const views = stage.querySelector('[data-map-views]');
  const mapCanvas = stage.querySelector('[data-map-canvas]');
  const mapImage = stage.querySelector('[data-map-image]');
  const regionLayer = stage.querySelector('[data-map-regions]');
  const cityLayer = stage.querySelector('[data-map-cities]');
  const pinsLayer = stage.querySelector('[data-map-pins]');
  const card = stage.querySelector('[data-map-card]');
  const ghost = stage.querySelector('[data-map-drag-card]');
  const feedback = stage.querySelector('[data-map-feedback]');
  const stamps = stage.querySelector('[data-map-stamps]');
  const resetButton = stage.querySelector('[data-map-reset]');
  const finish = stage.querySelector('[data-map-finish]');
  let pinned = [];
  let introSeen = false;
  let activeView = 'all';
  let dragging = null;
  let introLine = 0;
  let resetTimer = null;
  let nextViewTimer = null;
  let awaitingNext = false;
  const devMode = new URLSearchParams(location.search).get('mapDev') === '1';
  const mapScroll = stage.querySelector('[data-map-scroll]');
  const nextButton = stage.querySelector('[data-map-next]');
  const devLabel = stage.querySelector('[data-map-dev]');

  // The region sheets are small enough to cache while the station master speaks.
  // This avoids showing labels for one region over the previous map image.
  for (const view of Object.values(MAP_VIEWS)) {
    const image = new Image();
    image.src = view.image;
  }

  function currentStop() { return MAP_STOPS.find((place) => !pinned.includes(place.id)) || null; }
  function announce(message, kind = '') { feedback.textContent = message; feedback.dataset.kind = kind; }

  function renderViewTabs() {
    views.replaceChildren();
    viewIds.forEach((id, index) => {
      const view = MAP_VIEWS[id];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'atlas-view-tab';
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', String(activeView === id));
      button.setAttribute('aria-label', `${view.label}地图`);
      button.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span><strong>${view.label}</strong>`;
      button.addEventListener('click', () => focusView(id));
      views.append(button);
    });
  }

  function renderCard() {
    const stop = currentStop();
    stage.querySelector('.atlas-photo-desk h3').textContent = !stop ? '全部归位' : awaitingNext ? '已固定' : '待放照片';
    card.hidden = !stop || awaitingNext;
    stage.querySelector('.atlas-card-pad').hidden = !stop || awaitingNext;
    nextButton.hidden = !awaitingNext || !stop;
    resetButton.hidden = !stop || pinned.length === 0;
    devLabel.hidden = !devMode || !stop || awaitingNext;
    if (!stop) return;
    const index = MAP_STOPS.indexOf(stop);
    stage.querySelector('[data-map-card-index]').textContent = `${String(index + 1).padStart(2, '0')} / ${MAP_STOPS.length}`;
    devLabel.textContent = devMode ? `DEV · ${stop.name}（${stop.note}）` : '';
    card.setAttribute('aria-label', `拖动第 ${index + 1} 张旅行照片到地图`);
    renderPhotoWindow(stage.querySelector('[data-map-card-photo]'), stop);
  }

  function renderProgress() {
    stage.querySelector('[data-map-count]').textContent = pinned.length;
    stage.querySelector('[data-map-stamp-count]').textContent = `${pinned.length} / ${MAP_STOPS.length}`;
    stamps.replaceChildren();
    MAP_STOPS.forEach((stop, index) => {
      const stamp = document.createElement('span');
      stamp.className = 'atlas-stamp' + (pinned.includes(stop.id) ? ' is-done' : '');
      stamp.textContent = pinned.includes(stop.id) ? '✓' : String(index + 1);
      stamp.title = `第 ${index + 1} 张：${pinned.includes(stop.id) ? '已固定' : '待放置'}`;
      stamps.append(stamp);
    });
    renderCard();
    renderViewTabs();
  }

  function renderCityLabels() {
    cityLayer.replaceChildren();
    const createSvg = (tag) => document.createElementNS('http://www.w3.org/2000/svg', tag);
    const placed = [];
    const points = [];
    for (const city of MAP_CITIES[activeView]) {
      const point = mapPoint(city, activeView);
      if (point.x < 12 || point.x > 1188 || point.y < 12 || point.y > 848) continue;
      const width = city.name.length * (activeView === 'all' ? 16 : 18) + 16;
      const height = activeView === 'all' ? 23 : 27;
      const options = [
        [9, -height - 4], [9, 6], [-width - 9, -height - 4], [-width - 9, 6],
        [-width / 2, -height - 13], [-width / 2, 14],
      ];
      let best = null;
      for (const [dx, dy] of options) {
        const x = clamp(point.x + dx, 5, 1195 - width);
        const y = clamp(point.y + dy, 5, 855 - height);
        let score = Math.hypot(x + width / 2 - point.x, y + height / 2 - point.y) * .08;
        for (const other of placed) {
          const overlapX = Math.max(0, Math.min(x + width, other.x + other.w) - Math.max(x, other.x));
          const overlapY = Math.max(0, Math.min(y + height, other.y + other.h) - Math.max(y, other.y));
          score += overlapX * overlapY;
        }
        if (!best || score < best.score) best = { x, y, w: width, h: height, score };
      }
      placed.push(best);
      points.push(point);
      const marker = createSvg('g');
      marker.classList.add('atlas-city-marker');
      if (activeView === 'all') marker.classList.add('is-overview');
      marker.setAttribute('data-city', city.name);
      const backing = createSvg('rect');
      backing.setAttribute('x', best.x); backing.setAttribute('y', best.y);
      backing.setAttribute('width', width); backing.setAttribute('height', height);
      backing.setAttribute('rx', 5);
      const label = createSvg('text');
      label.setAttribute('x', best.x + 8); label.setAttribute('y', best.y + height / 2 + 1);
      label.textContent = city.name;
      marker.append(backing, label);
      cityLayer.append(marker);
    }
    points.forEach((point) => {
      const dot = createSvg('circle');
      dot.classList.add('atlas-city-dot');
      dot.setAttribute('cx', point.x); dot.setAttribute('cy', point.y);
      dot.setAttribute('r', activeView === 'all' ? 4 : 5);
      cityLayer.append(dot);
    });
  }

  function renderPins() {
    pinsLayer.replaceChildren();
    if (activeView === 'all') {
      pinned.forEach((id) => {
        const stop = MAP_STOPS.find((item) => item.id === id);
        const point = mapPoint(stop, 'all');
        const marker = document.createElement('span');
        marker.className = 'atlas-overview-pin';
        marker.style.left = percentX(point.x);
        marker.style.top = percentY(point.y);
        marker.setAttribute('role', 'img');
        marker.setAttribute('aria-label', `已钉好：${stop.name}`);
        pinsLayer.append(marker);
      });
      return;
    }
    const visible = MAP_STOPS.filter((stop) => stop.view === activeView && pinned.includes(stop.id));
    placeMiniPhotos(visible, activeView).forEach(({ stop, pin, card: position }, index) => {
      const lineSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      lineSvg.classList.add('atlas-pin-line');
      lineSvg.setAttribute('viewBox', '0 0 1200 860');
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', pin.x); line.setAttribute('y1', pin.y);
      line.setAttribute('x2', position.x + 54); line.setAttribute('y2', position.y + 14);
      lineSvg.append(line);
      pinsLayer.append(lineSvg);
      const tack = document.createElement('span');
      tack.className = 'atlas-pin-head';
      tack.style.left = percentX(pin.x);
      tack.style.top = percentY(pin.y);
      pinsLayer.append(tack);
      const mini = document.createElement('span');
      mini.className = 'atlas-mini-photo';
      if (stop.id === pinned[pinned.length - 1]) mini.classList.add('is-new');
      mini.style.left = percentX(position.x);
      mini.style.top = percentY(position.y);
      mini.style.setProperty('--angle', `${[-4, 3, -2, 4, -3][index % 5]}deg`);
      mini.setAttribute('role', 'img');
      mini.setAttribute('aria-label', `已钉好：${stop.name}`);
      const media = document.createElement('span');
      media.className = 'atlas-mini-media';
      renderPhotoWindow(media, stop);
      mini.append(media);
      pinsLayer.append(mini);
    });
  }

  function focusView(id) {
    activeView = id;
    const view = MAP_VIEWS[id];
    mapImage.src = view.image;
    mapImage.alt = id === 'all' ? '完整中国及周边国家与日本的地图' : `${view.label}地区放大地图`;
    stage.querySelector('[data-map-view-code]').textContent = `${String(viewIds.indexOf(id) + 1).padStart(2, '0')} / 08 · ${id === 'all' ? 'OVERVIEW' : 'CLOSE-UP'}`;
    stage.querySelector('[data-map-view-title]').textContent = id === 'all' ? '地图' : `${view.label}地图`;
    renderViewTabs();
    regionLayer.replaceChildren();
    renderCityLabels();
    renderPins();
    mapScroll.scrollTo({
      left: Math.max(0, mapCanvas.clientWidth * (id === 'all' ? .6 : .5) - mapScroll.clientWidth / 2),
      top: Math.max(0, (mapCanvas.clientHeight - mapScroll.clientHeight) / 2),
    });
  }

  function showFinish() {
    if (stage.hidden) return;
    finish.hidden = false;
    sheet.inert = true;
    stage.querySelector('[data-map-finish-back]').focus({ preventScroll: true });
  }

  function placeAt(x, y) {
    const stop = currentStop();
    if (!stop || awaitingNext) return;
    if (activeView === 'all') {
      announce('请先选择地图页。', 'retry');
      return;
    }
    if (activeView !== stop.view) {
      announce('地图页不对。', 'retry');
      return;
    }
    const exact = mapPoint(stop, activeView);
    const tolerance = { kansai: 65, pearl: 63, zhejiang: 74, fujian: 76 }[activeView] || 92;
    if (Math.hypot(x - exact.x, y - exact.y) > tolerance) {
      announce('位置不对。', 'retry');
      card.classList.remove('is-shaking');
      void card.offsetWidth;
      card.classList.add('is-shaking');
      return;
    }
    pinned.push(stop.id);
    card.classList.remove('is-shaking');
    const next = currentStop();
    awaitingNext = !!next;
    renderProgress();
    renderCityLabels();
    renderPins();
    announce('已固定。', 'success');
    if (!next) {
      completeStage('clue-1');
      onProgressChange();
      nextViewTimer = window.setTimeout(showFinish, 700);
    }
  }

  function canvasPoint(clientX, clientY) {
    const rect = mapCanvas.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null;
    return { x: (clientX - rect.left) / rect.width * 1200, y: (clientY - rect.top) / rect.height * 860 };
  }

  function renderIntro() {
    introText.textContent = introLines[introLine];
    introNumber.textContent = `${String(introLine + 1).padStart(2, '0')} / ${String(introLines.length).padStart(2, '0')}`;
    introNext.textContent = introLine === introLines.length - 1 ? '开始贴照片 →' : '继续听 →';
  }

  function open() {
    clearTimeout(resetTimer); clearTimeout(nextViewTimer);
    resetTimer = null; nextViewTimer = null;
    resetButton.textContent = '从第一张重新摆放';
    dragging = null;
    awaitingNext = false;
    ghost.hidden = true;
    finish.hidden = true;
    stage.hidden = false;
    stage.inert = false;
    sheet.inert = false;
    searchRoom.inert = true;
    game.classList.add('is-map');
    renderProgress();
    focusView('all');
    intro.hidden = introSeen;
    if (introSeen) {
      if (!currentStop()) showFinish();
      else stage.querySelector('[data-map-back]').focus({ preventScroll: true });
    } else {
      sheet.inert = true;
      introLine = 0;
      renderIntro();
      window.setTimeout(() => introNext.focus({ preventScroll: true }), 300);
    }
  }

  function close() {
    clearTimeout(resetTimer); clearTimeout(nextViewTimer);
    dragging = null;
    ghost.hidden = true;
    stage.hidden = true;
    stage.inert = true;
    game.classList.remove('is-map');
    searchRoom.inert = false;
    onClose();
  }

  introNext.addEventListener('click', () => {
    if (introLine < introLines.length - 1) { introLine += 1; renderIntro(); return; }
    intro.hidden = true;
    sheet.inert = false;
    introSeen = true;
    focusView('all');
    if (!currentStop()) showFinish();
    else stage.querySelector('[data-map-back]').focus({ preventScroll: true });
  });
  stage.querySelector('[data-map-back]').addEventListener('click', close);
  stage.querySelector('[data-map-finish-back]').addEventListener('click', close);
  stage.querySelector('[data-map-finish-view]').addEventListener('click', () => {
    finish.hidden = true; sheet.inert = false; focusView('all'); stage.querySelector('[data-map-back]').focus({ preventScroll: true });
  });
  nextButton.addEventListener('click', () => {
    awaitingNext = false;
    announce('');
    renderCard();
  });
  resetButton.addEventListener('click', () => {
    if (!resetTimer) {
      resetButton.textContent = `再点一次，清空 ${pinned.length} 张照片`;
      resetTimer = window.setTimeout(() => { resetTimer = null; resetButton.textContent = '从第一张重新摆放'; }, 6000);
      return;
    }
    clearTimeout(resetTimer); clearTimeout(nextViewTimer);
    resetTimer = null; nextViewTimer = null;
    resetButton.textContent = '从第一张重新摆放';
    pinned = [];
    resetFromStage('clue-1');
    onProgressChange();
    awaitingNext = false;
    renderProgress(); focusView('all');
    announce('已重置。');
    stage.querySelector('[data-map-back]').focus({ preventScroll: true });
  });

  card.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || !currentStop() || awaitingNext || !intro.hidden) return;
    event.preventDefault();
    dragging = { x: event.clientX, y: event.clientY, moved: false, type: event.pointerType, pointerId: event.pointerId };
  });
  window.addEventListener('pointermove', (event) => {
    if (!dragging || event.pointerId !== dragging.pointerId) return;
    const threshold = dragging.type === 'touch' ? 12 : 7;
    if (!dragging.moved && Math.hypot(event.clientX - dragging.x, event.clientY - dragging.y) > threshold) {
      dragging.moved = true;
      ghost.innerHTML = card.innerHTML;
      ghost.hidden = false;
    }
    if (!dragging.moved) return;
    ghost.style.left = `${event.clientX}px`;
    ghost.style.top = `${event.clientY}px`;
  });
  window.addEventListener('pointerup', (event) => {
    if (!dragging || event.pointerId !== dragging.pointerId) return;
    const moved = dragging.moved;
    dragging = null;
    ghost.hidden = true;
    if (!moved) return;
    const point = canvasPoint(event.clientX, event.clientY);
    if (point) placeAt(point.x, point.y);
    else announce('请放在地图内。', 'retry');
  });
  window.addEventListener('pointercancel', (event) => {
    if (!dragging || event.pointerId !== dragging.pointerId) return;
    dragging = null;
    ghost.hidden = true;
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !stage.hidden) close(); });
  return { open };
}
