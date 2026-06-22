## Retune juice-orange to match the logo

Swap the current red-orange `#ff5722` for the logo's golden amber `#f8b038`. One token change cascades through every accent in the app.

### Token updates (`src/index.css`)

Light theme (`:root`):
- `--primary` → `38 93% 60%` (= `#f8b038`)
- `--primary-light` → `38 93% 70%`
- `--primary-dark` → `38 95% 47%` (= `#e8990d`, used for hover/pressed)
- `--primary-foreground` → `0 0% 4%` (ink, not white — amber needs dark text for AA contrast)
- `--accent`, `--destructive`, `--ring` → mirror primary
- `--juice-orange*` legacy tokens → mirror primary
- `--shadow-glow` → `0 0 0 3px hsl(38 93% 60% / 0.25)`

Dark theme (`.dark`):
- `--primary` → `38 95% 58%` (slightly brighter to hold on black)
- `--primary-light` → `38 95% 68%`
- `--primary-dark` → `38 95% 48%`
- `--primary-foreground` → `0 0% 4%`
- Same mirroring on `--accent`, `--destructive`, `--ring`, `--juice-orange*`, `--shadow-glow`

### Foreground audit (small but important)

Amber + white fails WCAG AA on buttons. Every place we render `text-primary-foreground` on a primary fill now resolves to ink — which is what we want. Two spots use a literal white that I'll switch to `text-primary-foreground` so the contrast follows the token:
- `src/components/StoryCard.tsx` — avatar tile gradient (`from-primary to-primary-dark`) text color
- `src/pages/Profile.tsx` — large profile avatar text color
- `src/pages/NearYou.tsx` — "Pick a city" CTA already uses `text-primary-foreground`, no change

### Memory update

Update `mem://design/visual-direction` so the locked accent reads `#f8b038` (was `#ff5722`) and note that amber requires ink-on-amber for AA contrast on filled buttons.

### Out of scope

No layout, component, or structural changes — purely a color retune. Dark/light, all surfaces, every component picks it up automatically through the tokens.

### Estimate

1 file edit (`src/index.css`), 2 small contrast tweaks in components, 1 memory update. ~30 seconds of build time.
