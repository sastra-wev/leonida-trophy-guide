// render.js — turns the trophy data plus the reader's progress into the
// page: the progress header, the tracker cards (with expandable, sourced
// guides) and the staged roadmap. Pure DOM building; state lives in
// state.js and the wiring in app.js.

import { GRADE_POINTS, earnedPoints } from './state.js';

const GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
const KIND_LABEL = {
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  online: 'Online',
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// The spoiler shield hides a story trophy's name and description until the
// reader has earned it — the same promise PlayStation's hidden trophies make.
// The platinum is exempt: its name and description spoil nothing.
export function isMasked(trophy, ctx) {
  return ctx.spoilerOn && trophy.kind === 'story' && trophy.grade !== 'platinum' && !ctx.earned.has(trophy.id);
}

function displayName(trophy, ctx) {
  return isMasked(trophy, ctx) ? 'Hidden story trophy' : trophy.name;
}

function displayDescription(trophy, ctx) {
  return isMasked(trophy, ctx)
    ? 'A story trophy, hidden by your spoiler shield until you earn it.'
    : trophy.description;
}

function gradeBadge(trophy) {
  return el('span', `badge grade-${trophy.grade}`, GRADE_LABEL[trophy.grade]);
}

function earnedCheckbox(trophy, ctx) {
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = ctx.earned.has(trophy.id);
  box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
  box.addEventListener('change', () => ctx.onToggle(trophy.id, box.checked));
  return box;
}

/* ------------------------------ header ------------------------------ */

export function renderProgress(doc, earned) {
  const trophies = doc.trophies;
  const count = trophies.filter((t) => earned.has(t.id)).length;
  const percent = Math.round((count / trophies.length) * 100);
  document.getElementById('progress-count').textContent = `${count} of ${trophies.length} earned`;
  document.getElementById('progress-percent').textContent = `${percent}%`;
  const fill = document.getElementById('progress-fill');
  fill.style.width = `${percent}%`;
  fill.parentElement.setAttribute('aria-valuenow', String(percent));

  const perGrade = ['platinum', 'gold', 'silver', 'bronze'].map((grade) => {
    const all = trophies.filter((t) => t.grade === grade);
    const got = all.filter((t) => earned.has(t.id)).length;
    return `${GRADE_LABEL[grade]} ${got}/${all.length}`;
  });
  document.getElementById('progress-grades').textContent = perGrade.join(' · ');

  const points = earnedPoints(trophies, earned);
  document.getElementById('progress-points').textContent =
    `${points.got} of ${points.total} PSN points · platinum is worth ${GRADE_POINTS.platinum}`;
}

/* ------------------------------ tracker ------------------------------ */

function sourcesBlock(trophy) {
  const wrap = el('div', 'sources');
  wrap.append(el('span', '', 'Sources — where this guide\u2019s facts come from:'));
  const list = el('ul');
  for (const source of trophy.sources ?? []) {
    const item = el('li');
    const link = el('a', '', source.name);
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    item.append(link);
    list.append(item);
  }
  wrap.append(list);
  return wrap;
}

function guideBody(trophy) {
  const body = el('div', 'guide-body');
  if (trophy.missableNote) {
    const note = el('p', 'missable-note');
    const strong = el('strong', '', 'Missable warning. ');
    note.append(strong, document.createTextNode(trophy.missableNote));
    body.append(note);
  }
  body.append(el('p', '', trophy.guide));
  body.append(sourcesBlock(trophy));
  return body;
}

export function trophyCard(trophy, ctx) {
  const card = el('article', `trophy-card${ctx.earned.has(trophy.id) ? ' is-earned' : ''}`);
  card.dataset.trophyId = String(trophy.id);

  const checkCell = el('div', 'trophy-check');
  checkCell.append(earnedCheckbox(trophy, ctx));
  card.append(checkCell);

  const main = el('div', 'trophy-main');
  const head = el('div', 'trophy-head');
  const name = el('h3', `trophy-name${isMasked(trophy, ctx) ? ' masked' : ''}`, displayName(trophy, ctx));
  head.append(name, gradeBadge(trophy));
  if (trophy.missable) head.append(el('span', 'badge missable', 'Missable'));
  if (trophy.hidden) head.append(el('span', 'badge secret', 'Secret on PSN'));
  main.append(head);

  main.append(el('p', `trophy-desc${isMasked(trophy, ctx) ? ' masked' : ''}`, displayDescription(trophy, ctx)));

  const meta = el('div', 'trophy-meta');
  for (const kind of trophy.kinds ?? [trophy.kind]) {
    meta.append(el('span', 'badge kind', KIND_LABEL[kind] ?? kind));
  }
  meta.append(el('span', 'badge stage', `Roadmap stage ${trophy.stage}`));
  if (trophy.target) {
    const goal = typeof trophy.target === 'number' && trophy.target >= 1000
      ? trophy.target.toLocaleString('en-US')
      : String(trophy.target);
    meta.append(el('span', 'goal-chip', `Goal: ${goal}`));
  }
  const toggle = el('button', 'guide-toggle', ctx.expanded.has(trophy.id) ? 'Guide ▴' : 'Guide ▾');
  toggle.type = 'button';
  toggle.setAttribute('aria-expanded', String(ctx.expanded.has(trophy.id)));
  toggle.addEventListener('click', () => ctx.onGuideToggle(trophy.id));
  meta.append(toggle);
  main.append(meta);
  card.append(main);

  if (ctx.expanded.has(trophy.id)) card.append(guideBody(trophy));
  return card;
}

export function renderTracker(listEl, trophies, ctx) {
  listEl.replaceChildren(...trophies.map((t) => trophyCard(t, ctx)));
  return trophies.length;
}

/* ------------------------------ roadmap ------------------------------ */

export function renderMissableAlert(alertEl, doc) {
  alertEl.replaceChildren();
  const missables = doc.trophies.filter((t) => t.missable);
  const heading = el('h2', '', '⚠ Missable trophies — read this before Chapter 1 ends');
  alertEl.append(heading);
  if (!missables.length) {
    alertEl.append(el('p', '', 'No missable trophies are currently reported.'));
    return;
  }
  for (const t of missables) {
    const p = el('p');
    const strong = el('strong', '', `${t.name} (${GRADE_LABEL[t.grade]}, Stage ${t.stage}): `);
    p.append(strong, document.createTextNode(t.missableNote ?? t.guide));
    alertEl.append(p);
  }
  alertEl.append(el('p', '',
    'General protection for the whole run: the game has no mission replay, so keep a manual save at the start of every chapter and one from just before the final mission, and never use cheats on a trophy save — cheats disable trophies and saving (PowerPyx).'));
}

export function renderRoadmap(listEl, doc, ctx) {
  listEl.replaceChildren();
  for (const stage of doc.roadmap) {
    const trophies = doc.trophies.filter((t) => t.stage === stage.stage);
    const section = el('section', 'roadmap-stage');

    const head = el('div', 'roadmap-stage-head');
    head.append(el('div', 'stage-number', String(stage.stage)));
    const headText = el('div');
    headText.append(el('h2', '', stage.title));
    headText.append(el('p', '', stage.summary));
    head.append(headText);
    const got = trophies.filter((t) => ctx.earned.has(t.id)).length;
    head.append(el('span', 'stage-progress', `${got}/${trophies.length}`));
    section.append(head);

    const rows = el('div', 'roadmap-rows');
    for (const t of trophies) {
      const row = el('div', `roadmap-row${ctx.earned.has(t.id) ? ' is-earned' : ''}`);
      row.append(earnedCheckbox(t, ctx));
      row.append(el('span', `r-name${isMasked(t, ctx) ? ' masked' : ''}`, displayName(t, ctx)));
      row.append(gradeBadge(t));
      if (t.missable) row.append(el('span', 'badge missable', 'Missable'));
      row.append(el('span', 'r-desc', displayDescription(t, ctx)));
      rows.append(row);
    }
    section.append(rows);
    listEl.append(section);
  }
}
