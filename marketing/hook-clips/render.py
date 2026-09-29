"""
Juice hook clips — the 7-second text-on-screen format (Tea's breakout TikTok/Reels format).
1080x1920, 30fps, silent (trending sound gets added on-platform). Brand: ink background,
amber (#F8B23A) accent, Barlow Condensed display type, hairline rules, left-aligned —
the same editorial language as the marketing pages. No numbers, no testimonials.
"""
import math, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 1080, 1920, 30
INK = (10, 10, 10)
AMBER = (248, 178, 58)
PAPER = (245, 240, 230)
MUTED = (150, 150, 150)
F = "/tmp/vid/fonts"
DISPLAY = lambda s: ImageFont.truetype(f"{F}/BarlowCondensed-ExtraBold.ttf", s)
DISPLAY_SEMI = lambda s: ImageFont.truetype(f"{F}/BarlowCondensed-SemiBold.ttf", s)
BODY = lambda s: ImageFont.truetype(f"{F}/Barlow-Medium.ttf", s)

def ease(t):  # ease-out cubic, clamped
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3

def wrap(draw, text, font, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if draw.textlength(trial, font=font) <= max_w: cur = trial
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

def draw_block(img, draw, block, alpha, dy, y):
    """Draw one text block (list of (text, font, color, gap)) with alpha + slide. Returns next y."""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    yy = y + dy
    for text, font, color, gap in block:
        for line in wrap(ld, text, font, W - 96 - 250):
            ld.text((96, yy), line, font=font, fill=color + (255,))
            yy += font.size * 0.98
        yy += gap
    if alpha < 1:
        a = layer.split()[3].point(lambda p: int(p * alpha))
        layer.putalpha(a)
    img.alpha_composite(layer)
    return yy - dy

def render(name, beats, duration=8.0, out_dir="/tmp/vid/out"):
    """beats: list of dicts {t: start_sec, block: [...]}. Each beat fades/slides in over 0.45s and stays."""
    os.makedirs(f"{out_dir}/{name}", exist_ok=True)
    n = int(duration * FPS)
    for i in range(n):
        t = i / FPS
        img = Image.new("RGBA", (W, H), INK + (255,))
        d = ImageDraw.Draw(img)
        # top hairline + wordmark — always on
        d.rectangle([96, 140, W - 96, 143], fill=PAPER)
        d.text((96, 158), "JUICE", font=DISPLAY(54), fill=AMBER)
        d.text((96 + d.textlength("JUICE", font=DISPLAY(54)) + 18, 172), "VERIFIED MEN ONLY", font=DISPLAY_SEMI(34), fill=MUTED)
        # slow amber progress bar along the bottom = the 7-second pacing cue
        prog = t / duration
        d.rectangle([0, H - 14, int(W * prog), H], fill=AMBER)

        y = 420
        for b in beats:
            if t < b["t"]: break
            k = ease((t - b["t"]) / 0.45)
            y = draw_block(img, d, b["block"], k, int((1 - k) * 40), y)

        # end card: url pinned bottom-left after last beat
        last = beats[-1]["t"] + 0.6
        if t >= last:
            k = ease((t - last) / 0.45)
            layer = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ld = ImageDraw.Draw(layer)
            cy = int(min(max(y + 60, 1180), H - 430))  # below the copy, above TikTok's caption zone
            ld.rectangle([96, cy, W - 250, cy + 3], fill=PAPER)
            ld.text((96, cy + 30), "sipjuice.app", font=DISPLAY(120), fill=AMBER)
            ld.text((96, cy + 162), "Search her name. Free.", font=BODY(44), fill=PAPER)
            a = layer.split()[3].point(lambda p: int(p * k)); layer.putalpha(a)
            img.alpha_composite(layer)

        img.convert("RGB").save(f"{out_dir}/{name}/f{i:04d}.png")
    mp4 = f"{out_dir}/{name}.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", f"{out_dir}/{name}/f%04d.png",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-movflags", "+faststart", mp4], check=True)
    subprocess.run(["rm", "-rf", f"{out_dir}/{name}"])
    return mp4

HOOK = lambda s: [(s, DISPLAY(136), PAPER, 32)]
LINE = lambda s, c=PAPER: [(s, DISPLAY_SEMI(80), c, 20)]
SMALL = lambda s: [(s, BODY(46), MUTED, 30)]

CLIPS = {
    # A — the habit. Direct utility, no controversy needed.
    "hook_a_look_her_up": [
        {"t": 0.0, "block": HOOK("I LOOK UP EVERY GIRL BEFORE THE FIRST DATE.")},
        {"t": 2.2, "block": LINE("Verified guys post her green flags and red flags.", PAPER)},
        {"t": 4.2, "block": LINE("Anonymous. Real names. Real dates.", AMBER)},
    ],
    # B — the gender flip. This is the free-PR angle Tea's clones rode.
    "hook_b_they_have_tea": [
        {"t": 0.0, "block": HOOK("THEY HAVE THE TEA APP.")},
        {"t": 1.6, "block": HOOK("NOW WE HAVE JUICE.")},
        {"t": 3.4, "block": LINE("Verified men review the women they actually dated.", PAPER)},
        {"t": 5.2, "block": LINE("Green flag or red flag. You decide.", AMBER)},
    ],
    # C — the ask. AWDTSG's dominant post is a question, not a review.
    "hook_c_ask_the_room": [
        {"t": 0.0, "block": HOOK("BEFORE YOU TAKE HER OUT, ASK THE ROOM.")},
        {"t": 2.2, "block": LINE("“Anyone got juice on her?”", AMBER)},
        {"t": 3.8, "block": LINE("If nobody has, be the first — the next guy will thank you.", PAPER)},
        {"t": 5.6, "block": SMALL("Verified men. Anonymous answers.")},
    ],
}

if __name__ == "__main__":
    for name, beats in CLIPS.items():
        print(render(name, beats))
