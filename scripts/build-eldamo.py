"""Build the app's large lexicons from Eldamo (eldamo.org, by Paul Strack, CC BY 4.0).

Input:  vendor-data/eldamo/eldamo-data.xml
Output: src/data/eldamo-sindarin.js, src/data/eldamo-quenya.js

Status codes written for each word (see src/data/sources.js):
  A  Tolkien's own word from his mature writings (Eldamo "q" / "s")
  D  normalised by Eldamo from Tolkien's compounds or inflected forms ("#")
  E  Tolkien's word from an earlier stage of the language, adapted (Neo list, no mark or "^")
  N  fan-invented Neo-Elvish ("!")
Rejected or abandoned forms ("-", "|") are left out.

Run:  python -I scripts/build-eldamo.py
"""
import json
import os
import re
import sys
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'vendor-data', 'eldamo', 'eldamo-data.xml')

POS = {'n': 'n', 'vb': 'v', 'adj': 'adj', 'adv': 'adv', 'prep': 'prep', 'pron': 'pron', 'conj': 'conj',
       'cardinal': 'num', 'ordinal': 'adj', 'interj': 'interj', 'particle': 'adv'}

WORKS = {
    'LotR': 'The Lord of the Rings', 'LotRI': 'The Lord of the Rings', 'RGEO': 'The Road Goes Ever On',
    'S': 'The Silmarillion', 'SI': 'The Silmarillion', 'SA': 'The Silmarillion, Appendix',
    'UT': 'Unfinished Tales', 'UTI': 'Unfinished Tales', 'Let': 'The Letters of J.R.R. Tolkien',
    'MR': "Morgoth's Ring", 'MRI': "Morgoth's Ring", 'WJ': 'The War of the Jewels', 'WJI': 'The War of the Jewels',
    'PM': 'The Peoples of Middle-earth', 'PMI': 'The Peoples of Middle-earth', 'SD': 'Sauron Defeated',
    'NM': 'The Nature of Middle-earth', 'LR': 'The Lost Road', 'LRI': 'The Lost Road', 'TI': 'The Treason of Isengard',
    'TII': 'The Treason of Isengard', 'WR': 'The War of the Ring', 'WRI': 'The War of the Ring',
    'RS': 'The Return of the Shadow', 'RSI': 'The Return of the Shadow', 'SM': 'The Shaping of Middle-earth',
    'SMI': 'The Shaping of Middle-earth', 'LB': 'The Lays of Beleriand', 'LBI': 'The Lays of Beleriand',
    'LT1': 'The Book of Lost Tales 1', 'LT1I': 'The Book of Lost Tales 1', 'LT1A': 'The Book of Lost Tales 1',
    'LT2': 'The Book of Lost Tales 2', 'LT2I': 'The Book of Lost Tales 2', 'LT2A': 'The Book of Lost Tales 2',
    'MC': 'The Monsters and the Critics', 'RC': "The Lord of the Rings: A Reader's Companion",
    'Ety': 'The Etymologies (1930s)', 'EtyAC': 'The Etymologies (1930s)',
    'QL': 'Qenya Lexicon (1910s)', 'GL': 'Gnomish Lexicon (1910s)', 'PE11': 'Gnomish Lexicon (1910s)', 'PE12': 'Qenya Lexicon (1910s)',
    'Plotz': 'The Plotz Letter', 'SDI1': 'Sauron Defeated', 'SDI2': 'Sauron Defeated',
}
# Most authoritative first: published books, then Tolkien's linguistic papers
RANK = ['LotR', 'LotRI', 'RGEO', 'S', 'SI', 'SA', 'UT', 'UTI', 'Let', 'MR', 'WJ', 'PM', 'NM', 'SD']


def work_label(code):
    if code in WORKS:
        return WORKS[code]
    m = re.match(r'^(VT|PE)(\d+)$', code)
    if m:
        name = 'Vinyar Tengwar' if m.group(1) == 'VT' else 'Parma Eldalamberon'
        return f'{name} {m.group(2)}'
    return code


def best_source(refs):
    codes = [r.get('source', '').split('/')[0] for r in refs if r.get('source')]
    if not codes:
        return None
    for c in RANK:
        if c in codes:
            return c
    return codes[0]


def clean_form(v, verb):
    v = re.sub(r'[¹²³⁴⁵⁶⁷⁸⁹⁰]', '', v).strip()
    v = re.sub(r'\([^)]*\)', '', v).strip()  # optional letters, e.g. na(n) → na
    if verb:
        v = v.rstrip('-')
    return v


# English grammar words are handled by the translator's own rules; letting dictionary glosses claim them
# ("they", "do not", "of stars") would override the grammar.
FUNCTION = set('''the a an of to in on at by for with from into onto upon and or nor but not no yes do does did done
will shall would should can could may might must i you he she it we they me him her us them my your his its our their
mine yours is are am was were be been being have has had that this these those who whom whose what which where when why
how there here so very as like than then if because all some any each every own self myself yourself thee thou thy'''.split())


def keys_from(gloss):
    if not gloss:
        return []
    g = re.sub(r'\([^)]*\)|\[[^\]]*\]', ' ', gloss)
    g = re.sub(r'[*†?!‽"“”]', '', g)
    out = []
    for part in re.split(r'[,;/]| or ', g):
        raw = part.strip().strip('.').strip()
        if raw[:1].isupper() and not raw.startswith('I '):
            continue  # a proper name or month ("March"), not an ordinary word
        p = re.sub(r'^(to|a|an|the|be)\s+', '', raw.lower())
        p = re.sub(r'\s+', ' ', p)
        if not p or len(p.split()) > 3 or not re.match(r"^[a-z][a-z' -]*$", p):
            continue
        if any(t in FUNCTION for t in p.split()):
            continue
        if p not in out:
            out.append(p)
    return out


def plural_of(word):
    forms = []
    for r in word.findall('ref'):
        for inf in r.findall('inflect'):
            if inf.get('form') == 'plural' and r.get('v') and not r.get('mark'):
                forms.append(r.get('v'))
    if not forms:
        return None
    lower = [f for f in forms if f[:1].islower()] or forms
    return max(set(lower), key=lower.count)


def notes_for(mark):
    notes = []
    if '†' in mark:
        notes.append('archaic or poetic word')
    if '*' in mark:
        notes.append('English meaning partly reconstructed')
    if '?' in mark:
        notes.append('form uncertain in Tolkien’s papers')
    return notes


def convert(lang_late, lang_neo):
    root = ET.parse(SRC).getroot()
    rows = {}

    def add(el, pos, st, src, keys, ex):
        k = (el, pos)
        if k in rows:
            old = rows[k]
            for key in keys:
                if key not in old['keys']:
                    old['keys'].append(key)
            return
        rows[k] = {'keys': keys, 'el': el, 'pos': pos, 'st': st, 'src': src, 'ex': ex}

    for w in root.iter('word'):
        l = w.get('l')
        if l not in (lang_late, lang_neo):
            continue
        pos = POS.get(w.get('speech'))
        if not pos:
            continue
        mark = w.get('mark') or ''
        if '-' in mark or '|' in mark or '⚠' in mark:
            continue
        v = w.get('v') or ''
        if v.startswith('-') or (pos != 'v' and v.endswith('-')) or ' ' in v.strip():
            continue
        keys = keys_from(w.get('gloss')) + [k for k in keys_from(w.get('ngloss')) if k not in keys_from(w.get('gloss'))]
        if not keys:
            continue
        el = clean_form(v, pos == 'v')
        if not el:
            continue
        ex = {}
        notes = notes_for(mark)
        if l == lang_late:
            if not w.findall('ref'):
                continue  # a cross-reference to another entry, not a word of its own
            st = 'D' if '#' in mark else 'A'
            if st == 'D':
                notes.append('form normalised from Tolkien’s compounds or inflections')
            src = work_label(best_source(w.findall('ref')) or '')
        else:
            if '!' in mark:
                st = 'N'
                who = w.get('created')
                src = f'Neo-Elvish, coined by {who}' if who else 'Neo-Elvish reconstruction'
            else:
                st = 'E'
                inner = [x for x in w.findall('word')]
                code = best_source([r for x in inner for r in x.iter('ref')]) if inner else None
                src = f'Adapted from {work_label(code)}' if code else 'Adapted from Tolkien’s earlier writings'
                if '^' in mark:
                    notes.append('from Tolkien’s earliest drafts (1910s–20s)')
        if pos == 'v':
            # vowel-final stems (lanta-, tyali-, liru-) take endings directly, like a-stems
            ex['cls'] = 'a' if re.search(r'[aeiouë]$', el) else 'i'
        if pos == 'n':
            pl = plural_of(w)
            if pl and pl != el:
                ex['pl'] = pl
        if notes:
            ex['note'] = '; '.join(notes)
        add(el, pos, st, src or 'Eldamo', keys, ex)

    out = []
    for r in rows.values():
        row = ['|'.join(r['keys']), r['el'], r['pos'], r['st'], r['src']]
        if r['ex']:
            row.append(r['ex'])
        out.append(row)
    order = {'A': 0, 'D': 1, 'E': 2, 'N': 3}
    out.sort(key=lambda x: (order[x[3]], x[1].lower()))
    return out


def write(name, const, rows, lang):
    path = os.path.join(ROOT, 'src', 'data', name)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(f'// Generated by scripts/build-eldamo.py from Eldamo (eldamo.org, Paul Strack, CC BY 4.0). Do not edit by hand.\n')
        f.write(f'// {len(rows)} {lang} words. Row: [english keys, form, part of speech, status, source, extras]\n')
        f.write(f'export const {const} = [\n')
        for r in rows:
            f.write('  ' + json.dumps(r, ensure_ascii=False) + ',\n')
        f.write(']\n')
    counts = {}
    for r in rows:
        counts[r[3]] = counts.get(r[3], 0) + 1
    print(name, len(rows), counts)


def phrases():
    """Every phrase or sentence Tolkien wrote in late Quenya or Sindarin, with his own English."""
    root = ET.parse(SRC).getroot()
    out, seen = [], set()
    for w in root.iter('word'):
        l = w.get('l')
        if l not in ('q', 's') or w.get('speech') != 'phrase':
            continue
        mark = w.get('mark') or ''
        if '-' in mark or '|' in mark:
            continue
        el = re.sub(r'[¹²³⁴⁵⁶⁷⁸⁹⁰]', '', w.get('v') or '').strip()
        gloss = (w.get('gloss') or '').strip()
        refs = w.findall('ref')
        if not el or not gloss or not refs or el.startswith('[') or (l, el) in seen:
            continue
        seen.add((l, el))
        ref = next((r.get('source') for r in refs if r.get('source', '').split('/')[0] in RANK), refs[0].get('source'))
        code = ref.split('/')[0]
        page = ref.split('/')[1].split('.')[0].lstrip('0') if '/' in ref else ''
        out.append({
            'lang': 'S' if l == 's' else 'Q',
            'elvish': el,
            'english': gloss.lstrip('*'),
            'uncertain': gloss.startswith('*') or '?' in gloss,
            'where': work_label(code) + (f', p. {page}' if page else ''),
        })
    path = os.path.join(ROOT, 'src', 'data', 'eldamo-phrases.js')
    with open(path, 'w', encoding='utf-8') as f:
        f.write('// Generated by scripts/build-eldamo.py from Eldamo (eldamo.org, Paul Strack, CC BY 4.0). Do not edit by hand.\n')
        f.write(f'// {len(out)} phrases and sentences Tolkien wrote in Quenya or Sindarin, with his own English.\n')
        f.write('export const TOLKIEN_PHRASES = [\n')
        for p in out:
            f.write('  ' + json.dumps(p, ensure_ascii=False) + ',\n')
        f.write(']\n')
    print('eldamo-phrases.js', len(out))


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    write('eldamo-sindarin.js', 'ELDAMO_SINDARIN', convert('s', 'ns'), 'Sindarin')
    write('eldamo-quenya.js', 'ELDAMO_QUENYA', convert('q', 'nq'), 'Quenya')
    phrases()
