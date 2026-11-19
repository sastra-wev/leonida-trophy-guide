// Leonida Trophy Guide — the hand-in program (Node 22, standard library only).
//
// The guide itself is the static web app in app/: plain files, no build step,
// which a browser opens at app/index.html and which loads nothing over the
// network. This program's whole job is to deliver it: copy app/ and
// screenshots/ into the output directory and write dossier.json there — the
// summary the judge reads — using buildDossier from the vendored make.fun
// library. vendor/makefun-frontend.ts stays exactly as the kit shipped it:
// the scorer rebuilds the dossier with its own copy and expects the bytes
// to match.
//
// Run it locally the way the grader does, with MAKEFUN_OUTPUT_DIR naming
// the output (the grader's container leaves it unset and /output is used):
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Try the guide itself with `node serve.ts`, then http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The app goes in whole: index.html, style.css, the js/ modules and
// data/trophies.json, exactly as a static server would serve them.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });

// Screenshots ride along at the top level; the first by name is the cover.
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The dossier, built under the scorer's own caps: the text view the judge
// reads is capped at 160 KiB, screenshots at 4 files of at most 256 KiB,
// and app/ at 993 entries and 48 MiB (it shares the output's 1,000-entry
// budget with screenshots/ and dossier.json itself).
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
