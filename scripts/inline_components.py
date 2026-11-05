#!/usr/bin/env python3
"""Copy components/*.html into each page's <div id="NAME-placeholder"> so crawlers
that don't run JS still see the nav, footer and reviews. Re-run after editing a component:

    python3 scripts/inline_components.py
"""
import pathlib, re

root = pathlib.Path(__file__).resolve().parent.parent
components = {p.stem: p.read_text().strip() for p in (root / "components").glob("*.html")}

BLOCK = re.compile(r'<!-- inline:([a-z-]+) -->.*?<!-- /inline:\1 -->', re.S)
EMPTY = re.compile(r'(<div id="([a-z-]+)-placeholder"[^>]*>)\s*(</div>)')

def inline(html):
    html = BLOCK.sub("", html)  # drop earlier output so components are re-copied fresh
    while True:  # repeat: components can contain placeholders (marketing -> dashboard mock)
        new = EMPTY.sub(lambda m: m.group(0) if m.group(2) not in components else
                        f"{m.group(1)}<!-- inline:{m.group(2)} -->\n{components[m.group(2)]}\n<!-- /inline:{m.group(2)} -->{m.group(3)}", html)
        if new == html:
            return html
        html = new

if __name__ == "__main__":
    changed = []
    for page in sorted(root.glob("*.html")):
        old = page.read_text()
        new = inline(old)
        if new != old:
            page.write_text(new)
            changed.append(page.name)
    print("updated:", ", ".join(changed) or "nothing")
