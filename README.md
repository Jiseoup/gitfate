# gitfate

Your dev destiny, read from your GitHub birthday. gitfate casts a saju (Korean Four Pillars fortune) for the moment you signed up for GitHub and tells you which of ten Dev Signs you are, from The Oak to The Rain. A just-for-fun project, in English and Korean (개발자 사주).

![gitfate natal card for torvalds](https://gitfate.vercel.app/api/card/natal/en/torvalds.png)

![gitfate daily card for torvalds](https://gitfate.vercel.app/api/card/daily/ko/torvalds.png)

## What you get

Open `https://gitfate.vercel.app/en/<your-login>` (or `/ko/...` for Korean). No sign-in, nothing to install.

- **Birth chart**: your Dev Sign ("Linus is The Jewel"), your GitHub join date and "GitHub age", the four pillars of your GitHub signup time as Sign icons in five-element colors, and your zodiac animal.
- **Today's fortune**: a luck score, today's role (The Test Guardian, The Incident Commander, ...), deploy / debug / review / merge stars, and what the ancient almanac says is good for and best avoided, translated into dev activities. Changes at your local midnight.
- **This year**: the year's Sign and role, and month-by-month luck bars next to your real contributions. A saju year starts at the start of spring (around February 4), not January 1.
- **Dev compatibility**: `/<locale>/<a>/vs/<b>` scores two developers and suggests who writes and who reviews.

## URLs

| URL | What |
|---|---|
| `/<locale>/<login>` | Reading page (`locale` is `ko` or `en`) |
| `/<locale>/<a>/vs/<b>` | Compatibility page |
| `/api/card/{natal,daily,yearly}/<locale>/<login>.png` | 1200×630 share card |
| `/api/card/compat/<locale>/<a>/<b>.png` | Compatibility card |

Add `?tz=<IANA time zone>` (for example `?tz=Asia/Seoul` or `?tz=Europe/Berlin`) to read a chart in a time zone you choose. Compatibility URLs take `?tzA=` and `?tzB=`, one per person. The same query works on the card URLs, and shared links keep it, so everyone sees the same result.

Cards are also used as the Open Graph preview images for shared links.

### Put your card in your README

```markdown
![my gitfate](https://gitfate.vercel.app/api/card/natal/en/<your-login>.png)
```

Use `ko` instead of `en` for Korean, or `daily` instead of `natal` for a card that changes every day.

## How your birth time zone is decided

Saju uses the local time of birth, and GitHub stores the signup time only in UTC. The time zone is picked in this order:

1. `?tz=` in the URL, if it is a valid IANA name (this is what the "change birth country" picker sets).
2. The most common UTC offset among up to 5 of your own public commits from the first 90 days after signup.
3. The same, using up to 5 of your recent public commits.
4. Your profile location, if it maps to a time zone (for a country with several time zones, the city has to match).
5. UTC.

The page always says which rule was used.

### Privacy

- Only public data is read: profile (login, name, avatar, signup time, location), public repository languages, and contribution counts.
- To find a commit's time zone, gitfate reads only the `Date:` header line of that commit and keeps just the UTC offset. Author emails and code are never stored, returned, or logged.
- There is no database. Results are computed on request and cached by the hosting platform.

### Opting out

If you do not want your GitHub username to be read, open an issue asking to be added to the blocklist, or open a pull request that adds your lowercase username to [`data/blocklist.json`](data/blocklist.json).

## Local development

Requires Node.js 20.9 or later.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set these in `.env.local`:

- `GITHUB_TOKEN` (required): a GitHub token for reading public data. A fine-grained token with no extra permissions is enough.
- `SITE_URL` (optional): the site's absolute origin, for example `https://gitfate.vercel.app`. Canonical links and Open Graph image URLs are built from it. On Vercel it defaults to the production domain, and locally to `http://localhost:3000`.

Other commands: `npm test`, `npm run lint`, `npm run check:locales`, `npm run build`.

## Contributing

Translations, almanac translations, and fixes are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Disclaimer

Just for fun. It says nothing about your skills as a developer.

## License

[MIT](LICENSE)
