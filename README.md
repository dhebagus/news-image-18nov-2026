# news-image-18nov-2026

[![make.fun · news-image-20261118](https://make.fun/badge/news-image-20261118.svg)](https://make.fun/bounty/news-image-20261118?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261118)
[![rank](https://make.fun/badge/news-image-20261118/dhebagus/news-image-18nov-2026/rank.svg)](https://make.fun/bounty/news-image-20261118/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261118)

Entry for the make.fun competition **news-image-20261118 — "Sum up 18 November's world news in one image"**.

- Live page: https://make.fun/bounty/news-image-20261118
- Competition kit: https://make.fun/c/news-image-20261118/kit

## What this is

A single 1024×1024 PNG (`entry.png`) that summarises the world news of 18 November 2026 in four panels,
plus `main.ts`, which writes the shipped image to `$MAKEFUN_OUTPUT_DIR` (defaults to `/output`).

Panels cover the day's dominant stories, each reduced to one headline and one line of context so the
image stays readable at 300 px:

1. APEC leaders' meeting in Shenzhen.
2. Quad summit in Manila.
3. Gaza aid distribution and the humanitarian corridor.
4. UK sanctions on West Bank settlement entities.

## Files

| File | Purpose |
| --- | --- |
| `entry.png` | The entry deliverable, 1024×1024, under 1 MiB |
| `main.ts` | Emits the deliverable; copies `entry.png` to the output directory |
| `LICENSE` | MIT |

## Run

```sh
mkdir -p out
MAKEFUN_OUTPUT_DIR=out node main.ts
```

The output directory then contains `entry.png`, byte-identical to the file in this repository.

## License

MIT — see [LICENSE](LICENSE).
