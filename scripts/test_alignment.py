import math
from PIL import Image, ImageDraw

orig = Image.open(r'C:/Users/DELL/.gemini/antigravity/brain/8d66ec94-2700-4db0-947f-586414a7acc9/.user_uploaded/media_1793122937979_8402cdb0.jpg').convert('RGB')
w, h = orig.size

overlay = Image.new('RGBA', (w, h), (0, 0, 0, 0))
draw = ImageDraw.Draw(overlay)

red = (255, 0, 0, 190)

# Helper for bezier curves in PIL
def bezier_pt(p0, p1, p2, p3, t):
    x = (1-t)**3 * p0[0] + 3*(1-t)**2 * t * p1[0] + 3*(1-t) * t**2 * p2[0] + t**3 * p3[0]
    y = (1-t)**3 * p0[1] + 3*(1-t)**2 * t * p1[1] + 3*(1-t) * t**2 * p2[1] + t**3 * p3[1]
    return (x, y)

def draw_bezier(p0, p1, p2, p3, steps=40, width=36):
    pts = [bezier_pt(p0, p1, p2, p3, i/steps) for i in range(steps+1)]
    for i in range(len(pts)-1):
        draw.line([pts[i], pts[i+1]], fill=red, width=width)

# 1. Shield outline
# Top left crest to shoulder
draw_bezier((503, 146), (390, 155), (270, 195), (206, 252), width=36)
# Left shoulder to flank
draw_bezier((206, 252), (192, 280), (192, 330), (198, 380), width=36)
# Left flank
draw_bezier((198, 380), (202, 440), (208, 500), (216, 560), width=36)
# Left lower curve to bottom apex
draw_bezier((216, 560), (235, 650), (338, 775), (500, 872), width=36)

# Right lower curve from bottom apex
draw_bezier((500, 872), (662, 775), (765, 650), (784, 560), width=36)
# Right flank
draw_bezier((784, 560), (792, 500), (798, 440), (802, 380), width=36)
# Right shoulder
draw_bezier((802, 380), (808, 330), (808, 280), (794, 252), width=36)
# Right shoulder to top crest
draw_bezier((794, 252), (730, 195), (610, 155), (503, 146), width=36)

# 2. House Roof
# Outer roof slopes
draw.line([(503, 238), (185, 495)], fill=red, width=38)
draw.line([(503, 238), (805, 482)], fill=red, width=38)

# Eaves horizontal cuts
draw.line([(167, 507), (300, 507)], fill=red, width=36)
draw.line([(823, 493), (706, 493)], fill=red, width=36)

# House Walls
draw.rectangle([282, 507, 318, 624], fill=red)
draw.rectangle([688, 493, 724, 540], fill=red)

# Chimney
draw.rectangle([316, 285, 379, 360], fill=red)

# 3. Pulse Waveform
pulse_pts = [
    (156, 655),
    (338, 655),
    (378, 680),
    (406, 540),
    (440, 690),
    (480, 405),
    (540, 742),
    (580, 570),
    (740, 570),
    (870, 480)
]
for i in range(len(pulse_pts)-1):
    draw.line([pulse_pts[i], pulse_pts[i+1]], fill=red, width=36)

# Arrowhead
arrow_poly = [(936, 432), (864, 432), (875, 480), (919, 520)]
draw.polygon(arrow_poly, fill=red)

# 4. Telemetry Nodes
nodes = [
    ((424, 419), 16),
    ((484, 355), 18),
    ((574, 454), 18),
    ((614, 466), 12),
    ((646, 356), 22), # radar center
    ((718, 298), 16),
]
for pt, r in nodes:
    draw.ellipse([pt[0]-r, pt[1]-r, pt[0]+r, pt[1]+r], fill=red)

lines = [
    ((424, 419), (484, 355)),
    ((484, 355), (574, 454)),
    ((574, 454), (614, 466)),
    ((574, 454), (646, 356)),
    ((646, 356), (718, 298)),
]
for p1, p2 in lines:
    draw.line([p1, p2], fill=red, width=12)

# Radar concentric rings
for rad in [44, 70, 96]:
    cx, cy = 646, 356
    draw.ellipse([cx-rad, cy-rad, cx+rad, cy+rad], outline=red, width=10)

comp = Image.alpha_composite(orig.convert('RGBA'), overlay)
comp.save('public/alignment_check.png')

orig_l = orig.convert('L')
draw_pixels = []
for y in range(1024):
    for x in range(1024):
        r, g, b, a = comp.getpixel((x, y))
        if r > g + 40:
            draw_pixels.append(orig_l.getpixel((x, y)))

matches = sum(1 for v in draw_pixels if v < 180)
total = len(draw_pixels)
print(f'Overlay precision: {matches}/{total} = {matches/total*100:.1f}% match!')

