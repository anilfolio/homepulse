"""
Comprehensive Brand Asset Generator for HomePulse
Creates all SVG variants, PNG icons, and favicon files according to brand specifications.
"""
import os
import math
from PIL import Image, ImageDraw

# ---------------------------------------------------------------------------
# 1. Base Geometry Constants (1000 x 1000 grid)
# ---------------------------------------------------------------------------

SHIELD_PATH = (
    "M 500 146 "
    "C 388 156 268 196 204 250 "
    "C 190 280 190 330 196 380 "
    "C 202 440 206 500 214 560 "
    "C 232 652 338 775 500 872 "
    "C 662 775 768 652 786 560 "
    "C 794 500 798 440 804 380 "
    "C 810 330 810 280 796 250 "
    "C 732 196 612 156 500 146 Z"
)

ROOF_POLYLINE = "185,496 500,240 805,484"
CHIMNEY_POLYGON = "316,285 379,285 379,350 316,396"

LEFT_EAVES_LINE = (167, 507, 318, 507)
LEFT_WALL_LINE = (300, 507, 300, 624)

RIGHT_EAVES_LINE = (823, 493, 688, 493)
RIGHT_WALL_LINE = (706, 493, 706, 540)

RADAR_CENTER = (646, 356)
RADAR_RINGS = [44, 70, 96]
RADAR_DOT_RADIUS = 22

TELEMETRY_NODES = [
    (424, 419, 16),
    (484, 355, 18),
    (574, 454, 18),
    (614, 466, 11),
    (718, 298, 15),
]

TELEMETRY_LINES = [
    (424, 419, 484, 355),
    (484, 355, 574, 454),
    (574, 454, 614, 466),
    (574, 454, 646, 356),
    (646, 356, 718, 298),
]

PULSE_PATH = (
    "M 156 655 "
    "L 338 655 "
    "C 355 655 368 668 376 680 "
    "L 406 542 "
    "L 440 690 "
    "L 480 405 "
    "L 540 742 "
    "L 576 570 "
    "C 582 568 588 568 596 568 "
    "L 740 568 "
    "C 748 568 756 564 762 558 "
    "L 865 480"
)

ARROWHEAD_POINTS = "936,432 864,432 876,480 919,520"

# ---------------------------------------------------------------------------
# 2. SVG Markup Builder
# ---------------------------------------------------------------------------

def generate_emblem_body(grad_id="hpBrandGrad", stroke_override=None, fill_override=None):
    stroke = stroke_override or f"url(#{grad_id})"
    fill = fill_override or f"url(#{grad_id})"

    return f"""
  <!-- 1. Shield Frame -->
  <path
    d="{SHIELD_PATH}"
    fill="none"
    stroke="{stroke}"
    stroke-width="36"
    stroke-linejoin="round"
    stroke-linecap="round"
  />

  <!-- 2. House Chimney -->
  <polygon
    points="{CHIMNEY_POLYGON}"
    fill="{fill}"
  />

  <!-- 3. House Roof -->
  <polyline
    points="{ROOF_POLYLINE}"
    fill="none"
    stroke="{stroke}"
    stroke-width="38"
    stroke-linecap="round"
    stroke-linejoin="miter"
    stroke-miterlimit="4"
  />

  <!-- House Eaves & Walls -->
  <line x1="{LEFT_EAVES_LINE[0]}" y1="{LEFT_EAVES_LINE[1]}" x2="{LEFT_EAVES_LINE[2]}" y2="{LEFT_EAVES_LINE[3]}" stroke="{stroke}" stroke-width="36" stroke-linecap="round" />
  <line x1="{LEFT_WALL_LINE[0]}" y1="{LEFT_WALL_LINE[1]}" x2="{LEFT_WALL_LINE[2]}" y2="{LEFT_WALL_LINE[3]}" stroke="{stroke}" stroke-width="36" stroke-linecap="square" />

  <line x1="{RIGHT_EAVES_LINE[0]}" y1="{RIGHT_EAVES_LINE[1]}" x2="{RIGHT_EAVES_LINE[2]}" y2="{RIGHT_EAVES_LINE[3]}" stroke="{stroke}" stroke-width="36" stroke-linecap="round" />
  <line x1="{RIGHT_WALL_LINE[0]}" y1="{RIGHT_WALL_LINE[1]}" x2="{RIGHT_WALL_LINE[2]}" y2="{RIGHT_WALL_LINE[3]}" stroke="{stroke}" stroke-width="36" stroke-linecap="square" />

  <!-- 4. Radar Signal Concentric Rings -->
  <g fill="none" stroke="{stroke}" stroke-width="10" stroke-linecap="round">
    <circle cx="{RADAR_CENTER[0]}" cy="{RADAR_CENTER[1]}" r="{RADAR_RINGS[0]}" />
    <circle cx="{RADAR_CENTER[0]}" cy="{RADAR_CENTER[1]}" r="{RADAR_RINGS[1]}" />
    <circle cx="{RADAR_CENTER[0]}" cy="{RADAR_CENTER[1]}" r="{RADAR_RINGS[2]}" />
  </g>
  <circle cx="{RADAR_CENTER[0]}" cy="{RADAR_CENTER[1]}" r="{RADAR_DOT_RADIUS}" fill="{fill}" />

  <!-- 5. Telemetry Graph Connections & Nodes -->
  <g stroke="{stroke}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round">
    {''.join(f'<line x1="{l[0]}" y1="{l[1]}" x2="{l[2]}" y2="{l[3]}" />' for l in TELEMETRY_LINES)}
  </g>
  <g fill="{fill}">
    {''.join(f'<circle cx="{n[0]}" cy="{n[1]}" r="{n[2]}" />' for n in TELEMETRY_NODES)}
  </g>

  <!-- 6. ECG Vital Pulse Waveform -->
  <path
    d="{PULSE_PATH}"
    fill="none"
    stroke="{stroke}"
    stroke-width="36"
    stroke-linecap="square"
    stroke-linejoin="round"
  />

  <!-- 7. Growth Telemetry Arrowhead -->
  <polygon
    points="{ARROWHEAD_POINTS}"
    fill="{fill}"
  />
"""

DEFS_MARKUP = """
  <defs>
    <!-- Brand Primary Gradient -->
    <linearGradient id="hpBrandGrad" x1="0%" y1="30%" x2="100%" y2="70%">
      <stop offset="0%" stop-color="#0066B3" />
      <stop offset="25%" stop-color="#007BC7" />
      <stop offset="50%" stop-color="#0096AD" />
      <stop offset="75%" stop-color="#00A78E" />
      <stop offset="100%" stop-color="#00B388" />
    </linearGradient>

    <!-- Dark Theme Glow Gradient -->
    <linearGradient id="hpDarkGrad" x1="0%" y1="30%" x2="100%" y2="70%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="35%" stop-color="#22D3EE" />
      <stop offset="70%" stop-color="#2DD4BF" />
      <stop offset="100%" stop-color="#34D399" />
    </linearGradient>

    <!-- Squircle Gradient (App Icon Background) -->
    <linearGradient id="hpSquircleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00A887" />
      <stop offset="40%" stop-color="#008EA0" />
      <stop offset="75%" stop-color="#0072B5" />
      <stop offset="100%" stop-color="#005A9C" />
    </linearGradient>
  </defs>
"""

# ---------------------------------------------------------------------------
# 3. Generate Individual Vector Files
# ---------------------------------------------------------------------------

os.makedirs("public", exist_ok=True)

# 1. Standard Emblem Mark (Transparent Background)
with open("public/homepulse-emblem.svg", "w", encoding="utf-8") as f:
    f.write(f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
{DEFS_MARKUP}
{generate_emblem_body('hpBrandGrad')}
</svg>""")

# 2. Dark Theme Emblem Mark
with open("public/homepulse-emblem-dark.svg", "w", encoding="utf-8") as f:
    f.write(f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
{DEFS_MARKUP}
{generate_emblem_body('hpDarkGrad')}
</svg>""")

# 3. Squircle App Icon (Favicon / App Icon)
with open("public/homepulse-app-icon.svg", "w", encoding="utf-8") as f:
    f.write(f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
{DEFS_MARKUP}
  <!-- Squircle Background -->
  <rect width="1000" height="1000" rx="220" fill="url(#hpSquircleGrad)" />
  <g transform="translate(140, 140) scale(0.72)">
    {generate_emblem_body(stroke_override='#FFFFFF', fill_override='#FFFFFF')}
  </g>
</svg>""")

# Also save directly as public/icon.svg for Next.js App Router metadata
with open("public/icon.svg", "w", encoding="utf-8") as f:
    f.write(f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
{DEFS_MARKUP}
  <rect width="1000" height="1000" rx="220" fill="url(#hpSquircleGrad)" />
  <g transform="translate(140, 140) scale(0.72)">
    {generate_emblem_body(stroke_override='#FFFFFF', fill_override='#FFFFFF')}
  </g>
</svg>""")

# 4. Horizontal Wordmark (Light Theme)
with open("public/homepulse-logo-horizontal-light.svg", "w", encoding="utf-8") as f:
    f.write(f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3200 800" width="3200" height="800">
{DEFS_MARKUP}
  <!-- Emblem on the left -->
  <g transform="translate(40, -100) scale(1)">
    {generate_emblem_body('hpBrandGrad')}
  </g>
  <!-- Wordmark -->
  <text x="1080" y="440" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="280" font-weight="800" letter-spacing="-6">
    <tspan fill="#0066B3">Home</tspan><tspan fill="#00A887">Pulse</tspan>
  </text>
  <!-- Tagline -->
  <text x="1090" y="580" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="96" font-weight="600" fill="#0D7A75" letter-spacing="1">
    Healthcare Enterprise Platform
  </text>
</svg>""")

# 5. Horizontal Wordmark (Dark Theme)
with open("public/homepulse-logo-horizontal-dark.svg", "w", encoding="utf-8") as f:
    f.write(f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3200 800" width="3200" height="800">
{DEFS_MARKUP}
  <!-- Dark Background surface -->
  <rect width="3200" height="800" rx="40" fill="#161E2E" />
  <!-- Emblem on the left -->
  <g transform="translate(80, -100) scale(1)">
    {generate_emblem_body('hpDarkGrad')}
  </g>
  <!-- Wordmark -->
  <text x="1120" y="440" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="280" font-weight="800" letter-spacing="-6">
    <tspan fill="#7DD3FC">Home</tspan><tspan fill="#34D399">Pulse</tspan>
  </text>
  <!-- Tagline -->
  <text x="1130" y="580" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="96" font-weight="600" fill="#94A3B8" letter-spacing="1">
    Healthcare Enterprise Platform
  </text>
</svg>""")

# 6. Stacked Wordmark (Light Theme)
with open("public/homepulse-logo-stacked-light.svg", "w", encoding="utf-8") as f:
    f.write(f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1450" width="1200" height="1450">
{DEFS_MARKUP}
  <!-- Centered Emblem -->
  <g transform="translate(100, 40) scale(1)">
    {generate_emblem_body('hpBrandGrad')}
  </g>
  <!-- Wordmark Centered -->
  <text x="600" y="1180" text-anchor="middle" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="210" font-weight="800" letter-spacing="-5">
    <tspan fill="#0066B3">Home</tspan><tspan fill="#00A887">Pulse</tspan>
  </text>
  <!-- Tagline Centered -->
  <text x="600" y="1290" text-anchor="middle" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="70" font-weight="600" fill="#0D7A75" letter-spacing="1">
    Healthcare Enterprise Platform
  </text>
</svg>""")

# 7. Stacked Wordmark (Dark Theme)
with open("public/homepulse-logo-stacked-dark.svg", "w", encoding="utf-8") as f:
    f.write(f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1450" width="1200" height="1450">
{DEFS_MARKUP}
  <rect width="1200" height="1450" rx="40" fill="#161E2E" />
  <g transform="translate(100, 60) scale(1)">
    {generate_emblem_body('hpDarkGrad')}
  </g>
  <text x="600" y="1200" text-anchor="middle" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="210" font-weight="800" letter-spacing="-5">
    <tspan fill="#7DD3FC">Home</tspan><tspan fill="#34D399">Pulse</tspan>
  </text>
  <text x="600" y="1310" text-anchor="middle" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="70" font-weight="600" fill="#94A3B8" letter-spacing="1">
    Healthcare Enterprise Platform
  </text>
</svg>""")

print("Successfully generated all SVGs in public/!")

# ---------------------------------------------------------------------------
# 4. Generate High-Res PNG Icons using PIL (16, 32, 64, 128, 512)
# ---------------------------------------------------------------------------

def render_pillow_squircle_icon(size=512):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    scale = size / 1000.0

    # Draw rounded square (squircle) background with gradient
    corner_radius = int(220 * scale)
    # Background gradient
    for y in range(size):
        t = y / size
        # #00A887 (0, 168, 135) to #005A9C (0, 90, 156)
        r = int(0 * (1 - t) + 0 * t)
        g = int(168 * (1 - t) + 90 * t)
        b = int(135 * (1 - t) + 156 * t)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))

    # Mask with rounded corners
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([0, 0, size, size], radius=corner_radius, fill=255)
    img.putalpha(mask)

    # Draw crisp white emblem centered
    emb_draw = ImageDraw.Draw(img)
    white = (255, 255, 255, 255)

    def tx(x, y):
        # Translate and scale: center is (500, 500) scaled by 0.70
        cx, cy = 500, 500
        nx = 500 + (x - cx) * 0.70
        ny = 500 + (y - cy) * 0.70
        return (nx * scale, ny * scale)

    # Helper for bezier curve
    def bezier_pt(p0, p1, p2, p3, t):
        x = (1-t)**3 * p0[0] + 3*(1-t)**2 * t * p1[0] + 3*(1-t) * t**2 * p2[0] + t**3 * p3[0]
        y = (1-t)**3 * p0[1] + 3*(1-t)**2 * t * p1[1] + 3*(1-t) * t**2 * p2[1] + t**3 * p3[1]
        return (x, y)

    def draw_curve(p0, p1, p2, p3, steps=25, width=36):
        pts = [tx(*bezier_pt(p0, p1, p2, p3, i/steps)) for i in range(steps+1)]
        for i in range(len(pts)-1):
            emb_draw.line([pts[i], pts[i+1]], fill=white, width=max(1, int(width * 0.70 * scale)))

    # Shield curves
    draw_curve((500, 146), (388, 156), (268, 196), (204, 250))
    draw_curve((204, 250), (190, 280), (190, 330), (196, 380))
    draw_curve((196, 380), (202, 440), (206, 500), (214, 560))
    draw_curve((214, 560), (232, 652), (338, 775), (500, 872))
    draw_curve((500, 872), (662, 775), (768, 652), (786, 560))
    draw_curve((786, 560), (794, 500), (798, 440), (804, 380))
    draw_curve((804, 380), (810, 330), (810, 280), (796, 250))
    draw_curve((796, 250), (732, 196), (612, 156), (500, 146))

    # Chimney
    ch_pts = [tx(316, 285), tx(379, 285), tx(379, 350), tx(316, 396)]
    emb_draw.polygon(ch_pts, fill=white)

    # Roof
    rf_w = max(1, int(38 * 0.70 * scale))
    emb_draw.line([tx(185, 496), tx(500, 240)], fill=white, width=rf_w)
    emb_draw.line([tx(500, 240), tx(805, 484)], fill=white, width=rf_w)

    # Eaves & walls
    w_line = max(1, int(36 * 0.70 * scale))
    emb_draw.line([tx(167, 507), tx(318, 507)], fill=white, width=w_line)
    emb_draw.line([tx(300, 507), tx(300, 624)], fill=white, width=w_line)
    emb_draw.line([tx(823, 493), tx(688, 493)], fill=white, width=w_line)
    emb_draw.line([tx(706, 493), tx(706, 540)], fill=white, width=w_line)

    # Radar center and rings
    rcx, rcy = tx(646, 356)
    dot_r = max(1, int(22 * 0.70 * scale))
    emb_draw.ellipse([rcx - dot_r, rcy - dot_r, rcx + dot_r, rcy + dot_r], fill=white)

    ring_w = max(1, int(10 * 0.70 * scale))
    for ring_rad in [44, 70, 96]:
        rr = ring_rad * 0.70 * scale
        emb_draw.ellipse([rcx - rr, rcy - rr, rcx + rr, rcy + rr], outline=white, width=ring_w)

    # Telemetry lines & nodes
    t_line_w = max(1, int(12 * 0.70 * scale))
    for p1x, p1y, p2x, p2y in TELEMETRY_LINES:
        emb_draw.line([tx(p1x, p1y), tx(p2x, p2y)], fill=white, width=t_line_w)

    for nx, ny, nr in TELEMETRY_NODES:
        px, py = tx(nx, ny)
        pr = max(1, int(nr * 0.70 * scale))
        emb_draw.ellipse([px - pr, py - pr, px + pr, py + pr], fill=white)

    # Pulse line
    pulse_w = max(1, int(36 * 0.70 * scale))
    pts_pulse = [
        tx(156, 655),
        tx(338, 655),
        tx(376, 680),
        tx(406, 542),
        tx(440, 690),
        tx(480, 405),
        tx(540, 742),
        tx(576, 570),
        tx(740, 568),
        tx(865, 480)
    ]
    for i in range(len(pts_pulse) - 1):
        emb_draw.line([pts_pulse[i], pts_pulse[i+1]], fill=white, width=pulse_w)

    # Arrowhead
    arr_pts = [tx(936, 432), tx(864, 432), tx(876, 480), tx(919, 520)]
    emb_draw.polygon(arr_pts, fill=white)

    return img

# Save all icon sizes
for sz in [16, 32, 64, 128, 512]:
    icon_img = render_pillow_squircle_icon(sz)
    icon_img.save(f"public/homepulse-icon-{sz}.png")
    print(f"Generated public/homepulse-icon-{sz}.png")

# Also generate favicon.ico containing 16, 32, 48
img16 = render_pillow_squircle_icon(16)
img32 = render_pillow_squircle_icon(32)
img48 = render_pillow_squircle_icon(48)
img16.save("public/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
print("Generated public/favicon.ico")

