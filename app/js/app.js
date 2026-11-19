// app.js — Leonida Trophy Guide's wiring: loads the trophy data, holds the
// filter and view state, and connects the toolbar to the renderers in
// render.js and the saved progress in state.js. The app fetches exactly one
// thing — its own data/trophies.json sitting beside it — and works offline.

import {
  loadEarned, saveEarned, loadSpoilerShield, saveSpoilerShield,
  progressToFile, progressFromFile,
} from './state.js';
import { renderProgress, renderTracker, renderRoadmap, renderMissableAlert, isMasked } from './render.js';

const doc = await (await fetch('data/trophies.json')).json();

const state = {
  earned: loadEarned(),
  spoilerOn: loadSpoilerShield(),
  expanded: new Set(),
  kind: 'all',
  grade: 'all',
  query: '',
  hideEarned: false,
  view: location.hash === '#roadmap' ? 'roadmap' : 'tracker',
};

const listEl = document.getElementById('trophy-list');
const emptyEl = document.getElementById('empty-state');
const resultCountEl = document.getElementById('result-count');
const statusEl = document.getElementById('status-line');
const trackerView = document.getElementById('tracker-view');
const roadmapView = document.getElementById('roadmap-view');

function setStatus(message) {
  statusEl.textContent = message;
}

// A trophy is searchable by what the reader can actually see: with the
// spoiler shield up, a masked story trophy must not leak through search.
function matchesQuery(trophy) {
  if (!state.query) return true;
  const ctx = { earned: state.earned, spoilerOn: state.spoilerOn };
  const name = isMasked(trophy, ctx) ? 'hidden story trophy' : trophy.name;
  const description = isMasked(trophy, ctx) ? '' : trophy.description;
  return `${name} ${description}`.toLowerCase().includes(state.query);
}

function visibleTrophies() {
  return doc.trophies.filter((t) => {
    if (state.kind !== 'all' && !(t.kinds ?? [t.kind]).includes(state.kind)) return false;
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (state.hideEarned && state.earned.has(t.id)) return false;
    return matchesQuery(t);
  });
}

function render() {
  const ctx = {
    earned: state.earned,
    spoilerOn: state.spoilerOn,
    expanded: state.expanded,
    onToggle,
    onGuideToggle,
  };
  renderProgress(doc, state.earned);

  const shown = visibleTrophies();
  renderTracker(listEl, shown, ctx);
  resultCountEl.textContent = shown.length === doc.trophies.length
    ? `Showing all ${shown.length} trophies`
    : `Showing ${shown.length} of ${doc.trophies.length} trophies`;

  if (shown.length === 0) {
    emptyEl.hidden = false;
    emptyEl.textContent = state.kind === 'online'
      ? 'GTA VI has no online trophies: all 55 are earned offline in single player (PowerPyx lists 0 online trophies). Pick another kind to keep hunting.'
      : 'No trophies match these filters. Loosen the search or pick another kind or grade.';
  } else {
    emptyEl.hidden = true;
  }

  renderMissableAlert(document.getElementById('missable-alert'), doc);
  renderRoadmap(document.getElementById('roadmap-list'), doc, ctx);

  trackerView.hidden = state.view !== 'tracker';
  roadmapView.hidden = state.view !== 'roadmap';
  document.getElementById('view-tracker').classList.toggle('is-active', state.view === 'tracker');
  document.getElementById('view-roadmap').classList.toggle('is-active', state.view === 'roadmap');
  document.getElementById('view-tracker').setAttribute('aria-selected', String(state.view === 'tracker'));
  document.getElementById('view-roadmap').setAttribute('aria-selected', String(state.view === 'roadmap'));
  document.getElementById('filters').style.display = state.view === 'tracker' ? '' : 'none';
}

function onToggle(id, checked) {
  if (checked) state.earned.add(id);
  else state.earned.delete(id);
  saveEarned(state.earned);
  render();
}

function onGuideToggle(id) {
  if (state.expanded.has(id)) state.expanded.delete(id);
  else state.expanded.add(id);
  render();
}

function setView(view) {
  state.view = view;
  history.replaceState(null, '', view === 'roadmap' ? '#roadmap' : '#tracker');
  render();
  window.scrollTo({ top: 0 });
}

/* ------------------------------ controls ------------------------------ */

document.getElementById('view-tracker').addEventListener('click', () => setView('tracker'));
document.getElementById('view-roadmap').addEventListener('click', () => setView('roadmap'));

document.getElementById('search').addEventListener('input', (event) => {
  state.query = event.target.value.trim().toLowerCase();
  render();
});

document.getElementById('kind-chips').addEventListener('click', (event) => {
  const chip = event.target.closest('[data-kind]');
  if (!chip) return;
  state.kind = chip.dataset.kind;
  for (const c of document.querySelectorAll('#kind-chips .chip')) {
    c.classList.toggle('is-active', c === chip);
  }
  render();
});

document.getElementById('grade').addEventListener('change', (event) => {
  state.grade = event.target.value;
  render();
});

const spoilerToggle = document.getElementById('spoiler-toggle');
spoilerToggle.checked = state.spoilerOn;
spoilerToggle.addEventListener('change', () => {
  state.spoilerOn = spoilerToggle.checked;
  saveSpoilerShield(state.spoilerOn);
  setStatus(state.spoilerOn
    ? 'Spoiler shield on: story trophies stay hidden until you earn them.'
    : 'Spoiler shield off: story trophy names and descriptions are visible. Careful out there.');
  render();
});

document.getElementById('hide-earned').addEventListener('change', (event) => {
  state.hideEarned = event.target.checked;
  render();
});

document.getElementById('export').addEventListener('click', () => {
  const blob = new Blob([progressToFile(state.earned)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'leonida-trophy-progress.json';
  link.click();
  URL.revokeObjectURL(link.href);
  setStatus(`Exported ${state.earned.size} earned trophies to leonida-trophy-progress.json.`);
});

document.getElementById('import').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  const ids = progressFromFile(await file.text(), doc.trophies);
  if (!ids) {
    setStatus('That file did not contain readable trophy progress — nothing was changed.');
    return;
  }
  state.earned = ids;
  saveEarned(state.earned);
  setStatus(`Imported progress: ${ids.size} trophies marked earned.`);
  render();
});

document.getElementById('reset').addEventListener('click', () => {
  if (!state.earned.size) {
    setStatus('Nothing to reset — no trophies are marked earned.');
    return;
  }
  state.earned = new Set();
  saveEarned(state.earned);
  setStatus('Progress reset. A fresh run at Leonida awaits.');
  render();
});

render();
