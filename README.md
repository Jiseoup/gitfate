# gitfate

**English** | [한국어](README.ko.md)

Your dev destiny, read from your GitHub birthday.

gitfate is your dev horoscope. It takes the moment you signed up for GitHub as your developer birth time, reads it with the ancient almanac, and tells you which of ten Dev Signs you are, from The Oak to The Rain. Daily and yearly fortunes and developer compatibility come with it, all in developer memes. Just for fun, in English and Korean.

**Try it: [gitfate.vercel.app](https://gitfate.vercel.app)**. No sign-in, nothing to install.

<a href="https://gitfate.vercel.app/en/octocat">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://gitfate.vercel.app/api/card/natal/en/octocat.png?theme=github-dark">
    <img alt="gitfate birth chart card" src="https://gitfate.vercel.app/api/card/natal/en/octocat.png?theme=github-light">
  </picture>
</a>

## What you get

Open `https://gitfate.vercel.app/en/<your-login>` (or `/ko/<your-login>` for Korean).

- **Birth chart**: your Dev Sign ("<your name> is The Jewel"), your GitHub join date and GitHub age, the four pillars of your signup time as Sign icons in five-element colors, and your zodiac animal.
- **Today's fortune**: a luck score, today's role (The Test Guardian, The Incident Commander, ...), deploy / debug / review / merge stars, and what the ancient almanac says is good for and best avoided, translated into dev activities. It changes at your local midnight.
- **This year**: the year's Sign and role, and month-by-month luck next to your real contributions. Here a year starts at the start of spring (around February 4), not January 1.
- **Dev compatibility**: `/<locale>/<a>/vs/<b>` scores two developers and suggests who writes and who reviews.

## Put your card in your README

The **Add to your README** section at the bottom of your reading page lets you pick a card and a theme and copies the code for you. By hand:

```markdown
[![my gitfate](https://gitfate.vercel.app/api/card/daily/en/<your-login>.png)](https://gitfate.vercel.app/en/<your-login>)
```

- **Cards**: `natal` (birth chart), `daily` (changes every day), `yearly`.
- **Language**: `en` or `ko`.
- **Themes**: add `?theme=` with `light` (default), `dark`, `github-light` or `github-dark`.

To follow the reader's GitHub light or dark mode automatically:

```html
<a href="https://gitfate.vercel.app/en/<your-login>">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://gitfate.vercel.app/api/card/daily/en/<your-login>.png?theme=github-dark">
    <img alt="my gitfate" src="https://gitfate.vercel.app/api/card/daily/en/<your-login>.png?theme=github-light">
  </picture>
</a>
```

## URLs

| URL | What |
|---|---|
| `/<locale>/<login>` | Reading page (`locale` is `en` or `ko`) |
| `/<locale>/<a>/vs/<b>` | Compatibility page |
| `/api/card/{natal,daily,yearly}/<locale>/<login>.png` | 1200×630 card |
| `/api/card/compat/<locale>/<a>/<b>.png` | Compatibility card |

| Query | Works on | What |
|---|---|---|
| `?tz=<IANA time zone>` | Reading page, cards | Read the chart in a time zone you choose, for example `?tz=Europe/Berlin` |
| `?tzA=`, `?tzB=` | Compatibility page and card | The same, one per person |
| `?theme=` | Cards | `light`, `dark`, `github-light`, `github-dark` |

Shared links keep the query, so everyone sees the same result. Cards are also the preview images when a link is shared.

## How your birth time zone is decided

The almanac reads your local time of birth, but GitHub stores the signup time only in UTC. The time zone is picked in this order:

1. `?tz=` in the URL, if it is a valid IANA name (this is what the **Change birth country** picker sets).
2. The most common UTC offset among up to 5 of your own public commits from the first 90 days after signup.
3. The same, using up to 5 of your recent public commits.
4. Your profile location, if it maps to a time zone (for a country with several time zones, the city has to match).
5. UTC.

The page always says which rule was used.

## Privacy

- Only public data is read: profile (login, name, avatar, signup time, location), public repository languages, and contribution counts.
- To find a commit's time zone, gitfate reads only the `Date:` header line of that commit and keeps just the UTC offset. Author emails and code are never stored, returned, or logged.
- There is no database. Results are computed on request and cached by the hosting platform.

### Opting out

If you don't want your GitHub username to be read, open an [opt-out issue](https://github.com/Jiseoup/gitfate/issues/new?template=opt_out.yml) from that account, or open a pull request that adds your lowercase username to [`data/blocklist.json`](data/blocklist.json).

## Local development

Requires Node.js 20.9 or later.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set these in `.env.local`:

- `GITHUB_TOKEN` (required): a GitHub token for reading public data. A fine-grained token with **Public repositories (read-only)** access and no extra permissions is enough.
- `SITE_URL` (optional): the site's absolute origin, for example `https://gitfate.vercel.app`. Canonical links and preview image URLs are built from it. On Vercel it defaults to the production domain, and locally to `http://localhost:3000`.

Other commands: `npm test`, `npm run lint`, `npm run check:locales`, `npm run build`.

To run your own instance, import the repository into [Vercel](https://vercel.com/new) and set `GITHUB_TOKEN`.

## Contributing

Bug reports, translations, new fortune lines and fixes are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Disclaimer

Just for fun. It says nothing about your skills as a developer.

## License

[MIT](LICENSE)
