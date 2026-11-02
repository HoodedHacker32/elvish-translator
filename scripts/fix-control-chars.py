"""Replace stray backspace characters (a shell-escaping accident) with the regex word boundary they stood for."""
import sys

BACKSPACE = chr(8)
WORD_BOUNDARY = chr(92) + 'b'  # a backslash followed by b

for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read()
    n = s.count(BACKSPACE)
    if n:
        open(p, 'w', encoding='utf-8').write(s.replace(BACKSPACE, WORD_BOUNDARY))
    print(p, 'fixed', n)
