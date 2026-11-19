// state.js — the tracker's memory: which trophies are earned, and the
// spoiler-shield setting. Everything lives in localStorage on this device;
// nothing is sent anywhere. Progress can be exported to a JSON file and
// imported back (the import also understands a plain array of trophy ids,
// or an array of trophy names, so files from other simple checklists work).

const EARNED_KEY = 'leonida-trophy-guide:earned:v1';
const SPOILER_KEY = 'leonida-trophy-guide:spoiler-shield:v1';

// PlayStation trophy points by grade (bronze 15, silver 30, gold 90,
// platinum 300 — the full list totals 1,350, as PSNProfiles lists it).
export const GRADE_POINTS = { bronze: 15, silver: 30, gold: 90, platinum: 300 };

export function loadEarned() {
  try {
    const raw = localStorage.getItem(EARNED_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(ids) ? ids.filter((n) => Number.isInteger(n)) : []);
  } catch {
    return new Set();
  }
}

export function saveEarned(earned) {
  try {
    localStorage.setItem(EARNED_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
  } catch {
    // Storage full or blocked: the tracker still works for this session.
  }
}

export function loadSpoilerShield() {
  // On by default: a fresh visitor sees no story spoilers.
  return localStorage.getItem(SPOILER_KEY) !== 'off';
}

export function saveSpoilerShield(on) {
  try {
    localStorage.setItem(SPOILER_KEY, on ? 'on' : 'off');
  } catch {
    // Non-fatal, as above.
  }
}

// The file a reader downloads from Export: small, explicit, and versioned.
export function progressToFile(earned) {
  return JSON.stringify(
    { app: 'leonida-trophy-guide', version: 1, earned: [...earned].sort((a, b) => a - b) },
    null,
    2,
  );
}

// Accepts this app's export, a bare array of ids, or a bare array of trophy
// names. Returns a Set of ids, or null when the file holds nothing usable.
export function progressFromFile(text, trophies) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  const list = Array.isArray(parsed) ? parsed : parsed?.earned;
  if (!Array.isArray(list)) return null;
  const byName = new Map(trophies.map((t) => [t.name, t.id]));
  const ids = new Set();
  for (const item of list) {
    if (Number.isInteger(item) && byName.size >= item && item >= 1) ids.add(item);
    else if (typeof item === 'string' && byName.has(item)) ids.add(byName.get(item));
  }
  return ids.size || list.length === 0 ? ids : null;
}

export function earnedPoints(trophies, earned) {
  let got = 0;
  let total = 0;
  for (const t of trophies) {
    const points = GRADE_POINTS[t.grade] ?? 0;
    total += points;
    if (earned.has(t.id)) got += points;
  }
  return { got, total };
}
