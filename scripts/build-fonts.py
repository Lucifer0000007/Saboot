"""Subset Saboot's open-licence fonts to the glyphs the app actually uses.

Families (all OFL, google/fonts repo, downloaded once into .cache/fonts; docs/DESIGN.md, "Type"):
  Saboot Display       Anek Latin 600, width 87.5            Latin headings and big numbers (preloaded)
  Saboot Sans          Noto Sans var 400-700                 Latin body/UI (preloaded)
  Saboot Mono          JetBrains Mono var 400-500            hashes and codes only
  Saboot Deva Sans     Noto Sans Devanagari var 400-500      Hindi body/UI (lazy, on language switch)
  Saboot Deva Display  Anek Devanagari 600, width 87.5       Hindi headings (lazy)
  Saboot Guru Sans     Noto Sans Gurmukhi var 400-500        Punjabi body/UI (lazy)
  Saboot Guru Display  Anek Gurmukhi 600, width 87.5         Punjabi headings (lazy)

Scans src/ for every character used, subsets with full OpenType layout closure for Indic scripts
(conjuncts must still shape), writes WOFF2 to public/fonts/ and src/styles/fonts.css with
unicode-range'd @font-face rules plus metric-matched local() fallbacks (size-adjust and
ascent/descent/line-gap overrides) so font swaps cause no layout shift.

Usage: python scripts/build-fonts.py      (needs: pip install fonttools brotli)
"""
import glob
import io
import os
import sys
import urllib.request

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, '.cache', 'fonts')
OUT = os.path.join(ROOT, 'public', 'fonts')
CSS = os.path.join(ROOT, 'src', 'styles', 'fonts.css')
BASE = 'https://github.com/google/fonts/raw/main/'
WINFONTS = os.path.join(os.environ.get('WINDIR', 'C:/Windows'), 'Fonts')

SOURCES = {
    'anek-latin': 'ofl/aneklatin/AnekLatin%5Bwdth,wght%5D.ttf',
    'noto-sans': 'ofl/notosans/NotoSans%5Bwdth,wght%5D.ttf',
    'jetbrains': 'ofl/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf',
    'deva-sans': 'ofl/notosansdevanagari/NotoSansDevanagari%5Bwdth,wght%5D.ttf',
    'anek-deva': 'ofl/anekdevanagari/AnekDevanagari%5Bwdth,wght%5D.ttf',
    'guru-sans': 'ofl/notosansgurmukhi/NotoSansGurmukhi%5Bwdth,wght%5D.ttf',
    'anek-guru': 'ofl/anekgurmukhi/AnekGurmukhi%5Bwdth,wght%5D.ttf',
}
DISPLAY = {'wght': 600, 'wdth': 87.5}
DEVA = [(0x0900, 0x097F), (0xA8E0, 0xA8FF), (0x1CD0, 0x1CFF)]
GURU = [(0x0A00, 0x0A7F), (0x0964, 0x0965)]
JOINERS = [0x200C, 0x200D, 0x25CC]
# Spaces and punctuation inside Hindi/Punjabi text must come from the Indic face, not the mono fallback
# (digits and Latin letters stay in the Latin faces on purpose: tabular numbers, product names).
INDIC_PUNCT = [0x20, 0xA0, 0xB7] + list(range(0x21, 0x30)) + list(range(0x3A, 0x41)) + list(range(0x5B, 0x61)) + list(range(0x7B, 0x7F)) + list(range(0x2010, 0x2015)) + [0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2026]
LATIN_EXTRA = [(0x00A0, 0x024F), (0x2000, 0x2BFF), (0x20B9, 0x20B9)]


def fetch(key):
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, key + '.ttf')
    if not os.path.exists(path):
        print('downloading', key)
        urllib.request.urlretrieve(BASE + SOURCES[key], path)
    return path


def in_ranges(c, ranges):
    o = ord(c)
    return any(a <= o <= b for a, b in ranges)


def used_chars():
    chars = set()
    for f in glob.glob(os.path.join(ROOT, 'src', '**', '*.ts*'), recursive=True):
        with open(f, encoding='utf8') as fh:
            chars.update(fh.read())
    with open(os.path.join(ROOT, 'index.html'), encoding='utf8') as fh:
        chars.update(fh.read())
    return chars


def unicode_range(cps):
    cps = sorted(cps)
    parts, start, prev = [], None, None
    for cp in cps:
        if start is None:
            start = prev = cp
        elif cp == prev + 1:
            prev = cp
        else:
            parts.append((start, prev))
            start = prev = cp
    if start is not None:
        parts.append((start, prev))
    return ','.join('U+%X' % a if a == b else 'U+%X-%X' % (a, b) for a, b in parts)


def load(key, axes):
    font = TTFont(fetch(key))
    if 'fvar' in font and axes:
        tags = {a.axisTag for a in font['fvar'].axes}
        font = instancer.instantiateVariableFont(font, {k: v for k, v in axes.items() if k in tags})
        buf = io.BytesIO()
        font.save(buf)  # round-trip: the subsetter needs fully materialised gvar data
        buf.seek(0)
        font = TTFont(buf)
    return font


def subset_font(font, text, features):
    cmap = font.getBestCmap()
    text = {c for c in text if ord(c) in cmap}
    opts = subset.Options()
    opts.layout_features = features
    opts.flavor = 'woff2'
    opts.hinting = False
    opts.desubroutinize = True
    opts.name_IDs = [0, 1, 2, 3, 4, 5, 6]
    opts.notdef_outline = True
    opts.drop_tables += ['DSIG']
    sub = subset.Subsetter(opts)
    sub.populate(text=''.join(sorted(text)))
    sub.subset(font)
    font.flavor = 'woff2'
    buf = io.BytesIO()
    font.save(buf)
    return buf.getvalue(), {ord(c) for c in text}


def avg_width(font, sample):
    cmap = font.getBestCmap()
    hmtx = font['hmtx']
    w = [hmtx[cmap[ord(ch)]][0] for ch in sample if ord(ch) in cmap]
    return sum(w) / len(w) / font['head'].unitsPerEm


def vmetrics(font):
    upm = font['head'].unitsPerEm
    os2 = font['OS/2']
    if os2.fsSelection & (1 << 7):  # USE_TYPO_METRICS
        return os2.sTypoAscender / upm, abs(os2.sTypoDescender) / upm, os2.sTypoLineGap / upm
    h = font['hhea']
    return h.ascent / upm, abs(h.descent) / upm, h.lineGap / upm


LATIN_SAMPLE = 'the quick brown fox jumps over the lazy dog THE CLOCK STARTS 0123456789'
DEVA_SAMPLE = 'खेत में बाढ़ का पता चला रिपोर्ट करने का समय'
GURU_SAMPLE = 'ਖੇਤ ਵਿੱਚ ਹੜ੍ਹ ਦਾ ਪਤਾ ਲੱਗਿਆ ਰਿਪੋਰਟ ਕਰਨ ਦਾ ਸਮਾਂ'


def fallback(name, locals_, web, ref_path, sample, font_number=0):
    if not os.path.exists(ref_path):
        print('  (no reference font for %s: %s)' % (name, ref_path))
        return None
    ref = TTFont(ref_path, fontNumber=font_number)
    sa = avg_width(web, sample) / avg_width(ref, sample)
    asc, desc, gap = vmetrics(web)
    src = ','.join("local('%s')" % l for l in locals_)
    return ("@font-face{font-family:'%s';src:%s;size-adjust:%.2f%%;ascent-override:%.2f%%;"
            "descent-override:%.2f%%;line-gap-override:%.2f%%}" % (name, src, sa * 100, asc / sa * 100, desc / sa * 100, gap / sa * 100))


def build():
    chars = used_chars()
    os.makedirs(OUT, exist_ok=True)
    latin = {chr(c) for c in range(0x20, 0x7F)} | {c for c in chars if in_ranges(c, LATIN_EXTRA)}
    deva = {c for c in chars if in_ranges(c, DEVA)} | {chr(c) for c in JOINERS + INDIC_PUNCT}
    guru = {c for c in chars if in_ranges(c, GURU)} | {chr(c) for c in JOINERS + INDIC_PUNCT}
    latin_feat = ['kern', 'liga', 'ccmp', 'locl', 'mark', 'mkmk']
    mono_feat = ['ccmp', 'locl', 'mark', 'mkmk']  # no 'calt': JetBrains Mono's code ligatures stay off
    css = ['/* Generated by scripts/build-fonts.py — do not edit. */']
    sizes = {}

    def write(fname, data):
        with open(os.path.join(OUT, fname), 'wb') as fh:
            fh.write(data)
        sizes[fname] = len(data)

    # Remove stale outputs (previous builds used other names).
    for old in glob.glob(os.path.join(OUT, '*.woff2')):
        os.remove(old)

    display = load('anek-latin', DISPLAY)
    data, cps = subset_font(display, latin, latin_feat + ['tnum'])
    write('display-latin.woff2', data)
    css.append("@font-face{font-family:'Saboot Display';src:url(fonts/display-latin.woff2) format('woff2');"
               "font-weight:600;font-style:normal;font-display:swap;unicode-range:%s}" % unicode_range(cps))

    data, cps = subset_font(load('noto-sans', {'wdth': 100, 'wght': (400, 700)}), latin, latin_feat + ['tnum'])
    write('sans-latin.woff2', data)
    css.append("@font-face{font-family:'Saboot Sans';src:url(fonts/sans-latin.woff2) format('woff2');"
               "font-weight:400 700;font-style:normal;font-display:swap;unicode-range:%s}" % unicode_range(cps))

    data, cps = subset_font(load('jetbrains', {'wght': (400, 500)}), latin, mono_feat)
    write('mono-latin.woff2', data)
    css.append("@font-face{font-family:'Saboot Mono';src:url(fonts/mono-latin.woff2) format('woff2');"
               "font-weight:400 500;font-style:normal;font-display:swap;unicode-range:%s}" % unicode_range(cps))

    indic = [
        ('Saboot Deva Sans', 'deva-sans', {'wdth': 100, 'wght': (400, 500)}, deva, DEVA, '400 500'),
        ('Saboot Deva Display', 'anek-deva', DISPLAY, deva, DEVA, '600'),
        ('Saboot Guru Sans', 'guru-sans', {'wdth': 100, 'wght': (400, 500)}, guru, GURU, '400 500'),
        ('Saboot Guru Display', 'anek-guru', DISPLAY, guru, GURU, '600'),
    ]
    for family, key, axes, text, ranges, weight in indic:
        data, cps = subset_font(load(key, axes), text, ['*'])
        fname = key.replace('anek-', '') + '-display.woff2' if key.startswith('anek-') else key + '.woff2'
        write(fname, data)
        cps = {cp for cp in cps if in_ranges(chr(cp), ranges) or cp in JOINERS or cp in INDIC_PUNCT}
        css.append("@font-face{font-family:'%s';src:url(fonts/%s) format('woff2');"
                   "font-weight:%s;font-style:normal;font-display:swap;unicode-range:%s}" % (family, fname, weight, unicode_range(cps)))

    fbs = [
        fallback('Saboot Display Fallback', ['Arial', 'ArialMT', 'Roboto', 'Liberation Sans', 'Arimo'],
                 display, os.path.join(WINFONTS, 'arial.ttf'), LATIN_SAMPLE),
        fallback('Saboot Sans Fallback', ['Arial', 'ArialMT', 'Roboto', 'Liberation Sans', 'Arimo'],
                 load('noto-sans', {'wdth': 100, 'wght': 400}), os.path.join(WINFONTS, 'arial.ttf'), LATIN_SAMPLE),
        fallback('Saboot Mono Fallback', ['Courier New', 'CourierNewPSMT', 'Liberation Mono', 'Cousine', 'Droid Sans Mono'],
                 load('jetbrains', {'wght': 400}), os.path.join(WINFONTS, 'cour.ttf'), LATIN_SAMPLE),
        fallback('Saboot Deva Fallback', ['Nirmala UI', 'Kohinoor Devanagari', 'Noto Sans Devanagari', 'Mangal'],
                 load('deva-sans', {'wdth': 100, 'wght': 400}), os.path.join(WINFONTS, 'Nirmala.ttc'), DEVA_SAMPLE),
        fallback('Saboot Guru Fallback', ['Nirmala UI', 'Gurmukhi MN', 'Noto Sans Gurmukhi', 'Raavi'],
                 load('guru-sans', {'wdth': 100, 'wght': 400}), os.path.join(WINFONTS, 'Nirmala.ttc'), GURU_SAMPLE),
        fallback('Saboot Deva Display Fallback', ['Nirmala UI', 'Kohinoor Devanagari', 'Noto Sans Devanagari', 'Mangal'],
                 load('anek-deva', DISPLAY), os.path.join(WINFONTS, 'Nirmala.ttc'), DEVA_SAMPLE),
        fallback('Saboot Guru Display Fallback', ['Nirmala UI', 'Gurmukhi MN', 'Noto Sans Gurmukhi', 'Raavi'],
                 load('anek-guru', DISPLAY), os.path.join(WINFONTS, 'Nirmala.ttc'), GURU_SAMPLE),
    ]
    css += [f for f in fbs if f]
    with open(CSS, 'w', encoding='utf8', newline='\n') as fh:  # LF on Windows too
        fh.write('\n'.join(css) + '\n')
    for k, v in sizes.items():
        print('%-22s %6.1f KB' % (k, v / 1024))
    print('wrote', os.path.relpath(CSS, ROOT))


if __name__ == '__main__':
    sys.exit(build())
