# Contributing to gitfate

gitfate reads a developer's saju (Korean Four Pillars) from the time they signed up for GitHub. It is just for fun. Contributions that keep it fun, kind, and accurate are welcome.

## Adding a new language

All user-visible text lives in `locales/`. Korean (`ko`) is the base language that other locales are checked against; English (`en`) is the runtime fallback. Each language is a folder with eight JSON files: `meta`, `terms`, `ui`, `natal`, `daily`, `yearly`, `compat`, `yiji`.

1. Copy `locales/en` to `locales/<code>` (for example `locales/ja`).
2. Translate the values. Do not change the keys.
3. Register the language in `locales/index.json` with `"status": "partial"`:

   ```json
   { "code": "ja", "name": "日本語", "status": "partial" }
   ```

4. Run `npm run check:locales`. Errors must be fixed; warnings (missing or unused keys) are allowed while a language is `partial`. Missing keys fall back to English at runtime.
5. Open a pull request.

### Message syntax

- Placeholders look like `{{name}}`. Use only placeholders that the Korean text of the same key uses. The checker reports an error otherwise.
- A value can be an array of strings. The app picks one variant deterministically per user and day, so keep all variants interchangeable.
- Plurals: when a key has `count`, provide `key_one` and `key_other` (add other CLDR forms like `_few` if your language needs them).
- Keys are `namespace.path`, for example `daily.tenGod.zhengcai`, `terms.sign.辛`, `yiji.嫁娶`.

### Dev Signs and roles

Every language uses the same concept and the same pictures; only the words change.

- **Dev Signs** (`terms.sign.*`): the ten Signs, one per day stem (The Oak, The Vine, ... The Rain). Translate the names, and the one-line persona in `natal.archetype.<stem>.name`. Keep each Sign's image (an oak, a vine, a candle, ...) because the icon shows it.
- **Roles** (`terms.tenGod.*`): today's / this year's role, for example The Test Guardian. Translate them as roles a developer would recognize.
- **Traditional terms** (`terms.stem.*`, `terms.branch.*`, `terms.tenGodSaju.*`): the original saju names, shown only as hover text or small secondary text. Write them the way your language usually writes them, without hanja.
- **Icons are shared, not translated.** The Sign and element icons live in `src/icons/` as SVG and are the same in every language, on the page and on share cards. Do not add per-language icons or emoji.
- **Zodiac animals** (`terms.animal.*`, `terms.zodiacColor.*`, `terms.pillarName`): each pillar is also named as a color and an animal, for example "White Pig". Use the names your language uses for the Chinese zodiac.
- **No hanja on screen.** Hanja appear only as keys (`terms.sign.辛`, `yiji.嫁娶`), never in values, and the app never shows them. A test checks this.

### Style guide

- Main copy uses the Dev Sign vocabulary (Sign, today's role, your chart), not saju jargon. Korean may still say "사주" when explaining.
- Tone: developer-meme humor. Laugh with developers, never at them. No mocking, no insults, no ranking people. Scores attach to luck only, never to a person.
- Always keep the disclaimer in `ui.disclaimer` clear that this is for fun and says nothing about developer skill.

## Asking to be added to the blocklist

If you do not want your GitHub username to be read, either:

- open an [opt-out issue](https://github.com/Jiseoup/gitfate/issues/new?template=opt_out.yml) from that account (requests for someone else's account are closed), or
- open a pull request adding your lowercase username to `data/blocklist.json`.

## Pull requests

- Open an issue first for anything bigger than a small fix, so we can agree on the idea before you build it.
- PR titles follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`, optionally with a scope such as `feat(cards):` or `fix(i18n):`.
- Include before / after screenshots when a page or a share card changes.
- Keep pull requests focused on one change.

## Development

```bash
npm install
npm run dev
npm test
npm run lint
npm run check:locales
```

`src/i18n/generated.ts` is generated from `locales/` by `npm run gen:locales` (it runs automatically before `dev`, `build`, and `test`). Do not edit or commit it.
