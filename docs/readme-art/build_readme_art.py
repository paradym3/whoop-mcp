"""Build the whoop-mcp README graphics in light and dark versions, matching the project website
(warm paper, near-black ink, signal green, Inter Tight + JetBrains Mono, crosshair mark).
Text is outlined to paths because GitHub shows README SVGs as <img> and won't load web fonts.

Usage (from the repo root): python3 docs/readme-art/build_readme_art.py <fonts_dir> images/readme
  fonts_dir must contain inter-tight-latin-{500,700}-normal.woff2 and jetbrains-mono-latin-{400,500}-normal.woff2
  (npm i @fontsource/inter-tight @fontsource/jetbrains-mono → node_modules/@fontsource/*/files)
"""
import os, re, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

FD, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
def F(name):
    for root, _, files in os.walk(FD):
        if name in files: return TTFont(os.path.join(root, name))
    raise SystemExit(f"missing font {name}")
FACES = {"bold": F("inter-tight-latin-700-normal.woff2"), "med": F("inter-tight-latin-500-normal.woff2"),
         "mono": F("jetbrains-mono-latin-400-normal.woff2"), "monom": F("jetbrains-mono-latin-500-normal.woff2")}

def text(s, face, size, x=0, y=0, anchor="start", tracking=0.0):
    f = FACES[face]; gs = f.getGlyphSet(); cmap = f.getBestCmap(); hmtx = f["hmtx"]; sc = size / f["head"].unitsPerEm
    w = sum(hmtx[cmap[ord(c)]][0] * sc + tracking for c in s if ord(c) in cmap) - tracking
    x0 = x - w if anchor == "end" else x - w / 2 if anchor == "middle" else x
    pen = SVGPathPen(gs); cx = 0.0
    for c in s:
        g = cmap.get(ord(c))
        if not g: continue
        gs[g].draw(TransformPen(pen, (sc, 0, 0, -sc, x0 + cx, y))); cx += hmtx[g][0] * sc + tracking
    return re.sub(r"-?\d+\.\d+", lambda m: f"{float(m.group()):.1f}".rstrip("0").rstrip("."), pen.getCommands()), w

def T(s, face, size, x, y, fill, anchor="start", tracking=0.0):
    d, w = text(s, face, size, x, y, anchor, tracking); return f'<path d="{d}" fill="{fill}"/>', w

THEMES = {
    "light": dict(bg="#F3F1EA", card="#FBFAF6", ink="#16150F", ink2="#5E5C55", hair="#CFCBBF", signal="#1F9D46", user="#16150F", user_ink="#F3F1EA"),
    "dark":  dict(bg="#16150F", card="#201F19", ink="#F3F1EA", ink2="#A7A398", hair="#3A382F", signal="#30D158", user="#F3F1EA", user_ink="#16150F"),
}

def mark(t, x, y, s):
    """Crosshair-ring mark from the site favicon, at (x, y) with size s."""
    k = s / 32
    return (f'<g transform="translate({x} {y}) scale({k:.4f})"><circle cx="16" cy="16" r="9" fill="none" stroke="{t["ink"]}" stroke-width="2.5"/>'
            f'<circle cx="16" cy="16" r="3" fill="{t["ink"]}"/><path d="M16 4v3M16 25v3M4 16h3M25 16h3" stroke="{t["ink"]}" stroke-width="2.5"/></g>')

def svg(name, th, W, H, body):
    open(os.path.join(OUT, f"{name}-{th}.svg"), "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{body}</svg>')

def tick(t, x, y):
    return f'<circle cx="{x}" cy="{y}" r="9" fill="{t["signal"]}"/><path d="M{x-4} {y}l3 3l5-6" fill="none" stroke="{t["bg"]}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'

for th, t in THEMES.items():
    # ---------- banner 1280×400: headline left, a real question and the tools it calls on the right
    W, H = 1280, 400
    p = [f'<rect width="{W}" height="{H}" fill="{t["bg"]}"/>',
         f'<rect x="24.5" y="24.5" width="{W-49}" height="{H-49}" fill="none" stroke="{t["ink"]}"/>',
         f'<path d="M24.5 92.5H{W-24.5}" stroke="{t["ink"]}"/>', mark(t, 56, 42, 32)]
    p.append(T("WHOOP MCP", "bold", 22, 100, 66, t["ink"], tracking=.2)[0])
    p.append(T("Unofficial, read-only MCP server", "med", 16, W - 56, 65, t["ink2"], "end")[0])
    p.append(T("Your WHOOP data.", "bold", 58, 56, 186, t["ink"], tracking=-1.6)[0])
    p.append(T("A conversation away.", "bold", 58, 56, 254, t["ink"], tracking=-1.6)[0])
    p.append(T("Recovery, sleep, HRV and training trends", "med", 21, 56, 312, t["ink2"])[0])
    p.append(T("in the AI assistant you already use.", "med", 21, 56, 341, t["ink2"])[0])
    # transcript card
    cx, cy, cw, ch = 680, 124, 544, 222
    p.append(f'<rect x="{cx}.5" y="{cy}.5" width="{cw}" height="{ch}" rx="10" fill="{t["card"]}" stroke="{t["hair"]}"/>')
    q, qw = T("How am I doing today?", "med", 19, 0, 0, t["user_ink"])
    bw = qw + 36; bx = cx + cw - 20 - bw
    p.append(f'<rect x="{bx:.1f}" y="{cy+20}" width="{bw:.1f}" height="42" rx="21" fill="{t["user"]}"/>')
    p.append(T("How am I doing today?", "med", 19, bx + 18, cy + 47, t["user_ink"])[0])
    rows = [("get_today", "recovery, sleep, strain, latest workout"), ("get_baselines", "how today compares with your history"), ("get_sleep_debt", "observed sleep deficit")]
    for i, (tool, note) in enumerate(rows):
        y = cy + 98 + i * 44
        p.append(tick(t, cx + 34, y - 6))
        p.append(T(tool, "monom", 17, cx + 56, y, t["ink"])[0])
        p.append(T(note, "med", 15, cx + 56 + 168, y, t["ink2"])[0])
        if i < 2: p.append(f'<path d="M{cx+56} {y+20.5}H{cx+cw-24}" stroke="{t["hair"]}"/>')
    svg("banner", th, W, H, "".join(p))

    # ---------- how it works 1280×360: account → local server → assistant
    W, H = 1280, 360
    p = [f'<rect width="{W}" height="{H}" fill="{t["bg"]}"/>']
    boxes = [(40, "Your WHOOP account", ["Signed in through WHOOP's", "own authorization page"]),
             (480, "whoop-ai-mcp", ["Runs on your computer", "16 read-only tools", "No hosted relay"]),
             (920, "Your AI assistant", ["Claude Desktop, Claude Code,", "Codex or GitHub Copilot"])]
    bw_, by, bh = 320, 70, 200
    for i, (x, title, lines) in enumerate(boxes):
        mid = i == 1
        p.append(f'<rect x="{x}.5" y="{by}.5" width="{bw_}" height="{bh}" rx="10" fill="{t["ink"] if mid else t["card"]}" stroke="{t["ink"] if mid else t["hair"]}"/>')
        col, col2 = (t["bg"], t["bg"]) if mid else (t["ink"], t["ink2"])
        if mid: p.append(mark(dict(t, ink=t["bg"]), x + 28, by + 28, 30))
        p.append(T(title, "monom" if mid else "bold", 24, x + 28 + (42 if mid else 0), by + 52, col)[0])
        for j, ln in enumerate(lines):
            p.append(T(ln, "med", 18, x + 28, by + 104 + j * 30, col2)[0])
    for x0, label in [(360, "read-only access"), (800, "tool results")]:
        y = by + bh / 2
        p.append(f'<path d="M{x0+12} {y}H{x0+108}M{x0+100} {y-7}L{x0+108} {y}L{x0+100} {y+7}" fill="none" stroke="{t["ink"]}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>')
        p.append(T(label, "med", 14, x0 + 60, y - 14, t["ink2"], "middle")[0])
    p.append(T("Health results go to the assistant provider you use. Aggregate mode limits that to five summary tools.", "med", 17, W / 2, 322, t["ink2"], "middle")[0])
    svg("how-it-works", th, W, H, "".join(p))
print("ok")

# ---------- feedback buttons (44 px tall): Report a bug, Request a feature
for th, t in THEMES.items():
    for name, label, icon in [("btn-bug", "Report a bug", "bug"), ("btn-feature", "Request a feature", "idea")]:
        _, w = text(label, "bold", 17)
        W, H = int(w + 70), 44
        ic = (f'<circle cx="24" cy="22" r="7" fill="none" stroke="{t["ink"]}" stroke-width="2"/><path d="M24 18v4.5M24 25.5v.5" stroke="{t["ink"]}" stroke-width="2" stroke-linecap="round"/>'
              if icon == "bug" else
              f'<path d="M24 14v16M16 22h16" stroke="{t["signal"]}" stroke-width="2.4" stroke-linecap="round"/>')
        body = (f'<rect x=".5" y=".5" width="{W-1}" height="{H-1}" rx="8" fill="{t["card"]}" stroke="{t["ink"]}"/>' + ic
                + T(label, "bold", 17, 44, 28, t["ink"])[0])
        svg(name, th, W, H, body)
print("buttons ok")
