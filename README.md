# Leonida Trophy Guide

[![Competition](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/sastra-wev/leonida-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/sastra-wev/leonida-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline trophy guide and tracker for **Grand Theft Auto VI on PlayStation 5**, built for the make.fun bounty [Build the best GTA 6 trophy guide](https://make.fun/bounty/gta6-trophy-guide-01).

## What it does

- **All 55 trophies, with cited guides.** Every trophy shows its official name, description and grade exactly as PlayStation publishes them, plus a guide written for this app in its own words — what to do, where and how as far as sources support it, and when it can be missed. Each guide names its sources beside it, and launch-week claims no guide has confirmed yet are labelled unconfirmed instead of dressed up as fact.
- **A roadmap to the platinum.** Six stages in the order to play them: a careful Chapter 1, the two-protagonist unlock, the mid-story robbery toolkit, the finale, free-roam cleanup, and the 100% checklist — with the game's one potentially missable trophy, *Positive Mental Attitude* (Lucia's Chapter 1 balcony meditation), flagged in place and in a warning box at the top of the roadmap.
- **A tracker that remembers.** Tick trophies off as you earn them; progress is saved in the browser (localStorage), summarised in the header (earned count, percentage, per-grade counts, PSN points), and can be exported to a JSON file and imported back.
- **Filters and search.** Filter by kind (story, missable, collectibles, activities, online — the game has no online trophies, and the guide says so), by grade, or by text search.
- **A spoiler shield.** On by default: story trophies' names and descriptions stay hidden until you mark them earned, so the checklist itself never spoils the campaign.

## Running it

Serve the `app/` folder with the tiny bundled server and open it in a browser:

```sh
node serve.ts            # then open http://localhost:8080
```

Any static file server with `app/` at its root works just as well. The app is plain HTML, CSS and JavaScript with no build step, and it makes no network requests: every file it loads sits under `app/`, and the only outbound links are the source citations, which open only if a reader follows them.

To produce the competition hand-in (copies `app/` and `screenshots/` to the output and writes `dossier.json` with the vendored make.fun library):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Data and sources

`app/data/trophies.json` holds the guide's data: the official 55-trophy list (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden on PlayStation until earned) and, per trophy, the guide text, kind, roadmap stage, missable flag and cited sources. The official names, descriptions and grades are as listed by [Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/) and PSNProfiles. Guides draw on [PowerPyx's GTA 6 Trophy Guide & Roadmap](https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/), [Output Lag's trophy list](https://outputlag.com/guides/gta-6-trophy-list/) and [Push Square's trophy guide](https://www.pushsquare.com/guides/gta-6-trophy-guide-and-roadmap), cited per trophy in the app. Difficulty 4/10 and roughly 200 hours to the platinum are PowerPyx's estimates.

## Notes

This is a fan-made tool. It is not affiliated with Rockstar Games, Take-Two Interactive or PlayStation, and it contains no logos, artwork or screenshots from the game — the Leonida dusk look is plain CSS. Trophy names and descriptions are shown as PlayStation publishes them.
