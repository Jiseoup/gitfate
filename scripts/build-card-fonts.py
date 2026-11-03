"""Build the share-card fonts in assets/fonts/ from Noto Sans KR.

Cards are drawn on the server, which has no Korean fonts, so the renderer needs font files.
This writes static 400 and 700 instances of the variable font, cut down to the characters
cards draw: the 2,350 common Hangul syllables (KS X 1001), Hangul jamo, Latin, common
punctuation, and every character in locales/ and src/cards/. Characters outside this set
(rare names, hanja, kana) are fetched from Google Fonts per card, see src/cards/fonts.ts.

Needs fontTools (pip install fonttools). Run from the repository root:

    curl -L -o /tmp/NotoSansKR.ttf "https://github.com/google/fonts/raw/main/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf"
    python3 scripts/build-card-fonts.py /tmp/NotoSansKR.ttf
"""

import re
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "fonts"
WEIGHTS = (400, 700)
HAN = re.compile(r"[㐀-鿿豈-﫿]")


def ks_x_1001_hangul() -> set[str]:
    chars = set()
    for lead in range(0xB0, 0xC9):
        for trail in range(0xA1, 0xFF):
            try:
                chars.add(bytes([lead, trail]).decode("euc-kr"))
            except UnicodeDecodeError:
                pass
    return chars


def ranges(*spans: tuple[int, int]) -> set[str]:
    return {chr(c) for start, end in spans for c in range(start, end + 1)}


def project_text() -> set[str]:
    files = [*ROOT.glob("locales/**/*.json"), *ROOT.glob("src/cards/**/*.tsx"), *ROOT.glob("src/cards/**/*.ts")]
    return {c for f in files for c in f.read_text(encoding="utf-8") if not HAN.match(c)}


def main(source: str) -> None:
    chars = ks_x_1001_hangul() | project_text() | ranges(
        (0x20, 0x7E),  # ASCII
        (0xA0, 0x17F),  # Latin-1 and Latin Extended-A, for names
        (0x2010, 0x2027),  # dashes, quotes, bullets, ellipsis
        (0x2030, 0x203A),
        (0x2190, 0x2193),  # arrows
        (0x2605, 0x2606),  # stars
        (0x3131, 0x318E),  # Hangul compatibility jamo
    )
    chars = {c for c in chars if c.isprintable() or c == " "}
    OUT.mkdir(parents=True, exist_ok=True)
    for weight in WEIGHTS:
        font = instantiateVariableFont(TTFont(source), {"wght": weight})
        options = subset.Options()
        options.hinting = False
        options.name_IDs = ["*"]
        options.notdef_outline = True
        subsetter = subset.Subsetter(options)
        subsetter.populate(unicodes=sorted(ord(c) for c in chars))
        subsetter.subset(font)
        path = OUT / f"NotoSansKR-{weight}.ttf"
        font.save(path)
        print(f"{path.relative_to(ROOT)}: {len(font.getBestCmap())} characters, {path.stat().st_size // 1024} KB")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
