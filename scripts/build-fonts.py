"""Subset Saboot's open-licence fonts to the glyphs the app actually uses.

Families (all OFL, google/fonts repo, downloaded once into .cache/fonts):
  Saboot Serif       Instrument Serif 400                  Latin headings (preloaded)
  Saboot Mono        JetBrains Mono var 400-500 or IBM Plex Mono 400+500, whichever is smaller
                     after subsetting                       Latin body/UI (preloaded)
  Saboot Deva Sans   Noto Sans Devanagari var 400-500       Hindi body/UI (lazy, on language switch)
  Saboot Deva Serif  Noto Serif Devanagari 400              Hindi headings (lazy)
  Saboot Guru Sans   Noto Sans Gurmukhi var 400-500         Punjabi body/UI (lazy)
  Saboot Guru Serif  Noto Serif Gurmukhi 400                Punjabi headings (lazy)

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
    'instrument': 'ofl/instrumentserif/InstrumentSerif-Regular.ttf',
    'jetbrains': 'ofl/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf',
    'plex400': 'ofl/ibmplexmono/IBMPlexMono-Regular.ttf',
    'plex500': 'ofl/ibmplexmono/IBMPlexMono-Medium.ttf',
    'deva-sans': 'ofl/notosansdevanagari/NotoSansDevanagari%5Bwdth,wght%5D.ttf',
    'deva-serif': 'ofl/notoserifdevanagari/NotoSerifDevanagari%5Bwdth,wght%5D.ttf',
    'guru-sans': 'ofl/notosansgurmukhi/NotoSansGurmukhi%5Bwdth,wght%5D.ttf',
    'guru-serif': 'ofl/notoserifgurmukhi/NotoSerifGurmukhi%5Bwght%5D.ttf',
}
DEVA = [(0x0900, 0x097F), (0xA8E0, 0xA8FF), (0x1CD0, 0x1CFF)]
GURU = [(0x0A00, 0x0A7F), (0x0964, 0x0965)]
JOINERS = [0x200C, 0x200D, 0x25CC]
# Spaces and punctuation inside Hindi/Punjabi text must come from the Indic face, not the mono fallback
# (digits and Latin letters stay in mono on purpose: tabular numbers, product names).
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

    serif = load('instrument', None)
    data, cps = subset_font(serif, latin, latin_feat)
    write('serif-latin.woff2', data)
    css.append("@font-face{font-family:'Saboot Serif';src:url(fonts/serif-latin.woff2) format('woff2');"
               "font-weight:400;font-style:normal;font-display:swap;unicode-range:%s}" % unicode_range(cps))

    # Mono: compare JetBrains Mono (one variable file) with IBM Plex Mono (two static files).
    jb, jb_cps = subset_font(load('jetbrains', {'wght': (400, 500)}), latin, mono_feat)
    p4, p4_cps = subset_font(load('plex400', None), latin, mono_feat)
    p5, _ = subset_font(load('plex500', None), latin, mono_feat)
    print('mono candidates: JetBrains Mono var %.1f KB | IBM Plex Mono 400+500 %.1f KB' % (len(jb) / 1024, (len(p4) + len(p5)) / 1024))
    if len(jb) <= len(p4) + len(p5):
        mono_name = 'JetBrains Mono'
        write('mono-latin.woff2', jb)
        css.append("@font-face{font-family:'Saboot Mono';src:url(fonts/mono-latin.woff2) format('woff2');"
                   "font-weight:400 500;font-style:normal;font-display:swap;unicode-range:%s}" % unicode_range(jb_cps))
        mono_web = load('jetbrains', {'wght': 400})
    else:
        mono_name = 'IBM Plex Mono'
        write('mono-latin.woff2', p4)
        write('mono-latin-500.woff2', p5)
        ur = unicode_range(p4_cps)
        css.append("@font-face{font-family:'Saboot Mono';src:url(fonts/mono-latin.woff2) format('woff2');"
                   "font-weight:400;font-style:normal;font-display:swap;unicode-range:%s}" % ur)
        css.append("@font-face{font-family:'Saboot Mono';src:url(fonts/mono-latin-500.woff2) format('woff2');"
                   "font-weight:500;font-style:normal;font-display:swap;unicode-range:%s}" % ur)
        mono_web = load('plex400', None)
    print('mono: using', mono_name)

    indic = [
        ('Saboot Deva Sans', 'deva-sans', {'wdth': 100, 'wght': (400, 500)}, deva, DEVA, '400 500'),
        ('Saboot Deva Serif', 'deva-serif', {'wdth': 100, 'wght': 400}, deva, DEVA, '400'),
        ('Saboot Guru Sans', 'guru-sans', {'wdth': 100, 'wght': (400, 500)}, guru, GURU, '400 500'),
        ('Saboot Guru Serif', 'guru-serif', {'wght': 400}, guru, GURU, '400'),
    ]
    for family, key, axes, text, ranges, weight in indic:
        data, cps = subset_font(load(key, axes), text, ['*'])
        write(key + '.woff2', data)
        cps = {cp for cp in cps if in_ranges(chr(cp), ranges) or cp in JOINERS or cp in INDIC_PUNCT}
        css.append("@font-face{font-family:'%s';src:url(fonts/%s.woff2) format('woff2');"
                   "font-weight:%s;font-style:normal;font-display:swap;unicode-range:%s}" % (family, key, weight, unicode_range(cps)))

    fbs = [
        fallback('Saboot Serif Fallback', ['Times New Roman', 'TimesNewRomanPSMT', 'Liberation Serif', 'Tinos', 'Noto Serif'],
                 TTFont(fetch('instrument')), os.path.join(WINFONTS, 'times.ttf'), LATIN_SAMPLE),
        fallback('Saboot Mono Fallback', ['Courier New', 'CourierNewPSMT', 'Liberation Mono', 'Cousine', 'Droid Sans Mono'],
                 mono_web, os.path.join(WINFONTS, 'cour.ttf'), LATIN_SAMPLE),
        fallback('Saboot Deva Fallback', ['Nirmala UI', 'Kohinoor Devanagari', 'Noto Sans Devanagari', 'Mangal'],
                 load('deva-sans', {'wdth': 100, 'wght': 400}), os.path.join(WINFONTS, 'Nirmala.ttc'), DEVA_SAMPLE),
        fallback('Saboot Guru Fallback', ['Nirmala UI', 'Gurmukhi MN', 'Noto Sans Gurmukhi', 'Raavi'],
                 load('guru-sans', {'wdth': 100, 'wght': 400}), os.path.join(WINFONTS, 'Nirmala.ttc'), GURU_SAMPLE),
    ]
    css += [f for f in fbs if f]
    with open(CSS, 'w', encoding='utf8', newline='\n') as fh:  # LF on Windows too
        fh.write('\n'.join(css) + '\n')
    for k, v in sizes.items():
        print('%-22s %6.1f KB' % (k, v / 1024))
    print('wrote', os.path.relpath(CSS, ROOT))


if __name__ == '__main__':
    sys.exit(build())
