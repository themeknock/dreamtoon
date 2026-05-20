from PIL import Image, ImageDraw, ImageFont

W, H = 640, 132
img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# font: try mono (brand), fall back to Arial Bold
font = None
for path, size in [
    ("/System/Library/Fonts/SFNSMono.ttf", 60),
    ("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 60),
    ("/System/Library/Fonts/Supplemental/Arial.ttf", 60),
]:
    try:
        font = ImageFont.truetype(path, size); break
    except Exception:
        continue

text = "dreamtoon.app"
# measure
bbox = d.textbbox((0, 0), text, font=font)
tw, th = bbox[2]-bbox[0], bbox[3]-bbox[1]
pad_x, pad_y = 40, 26
pill_w, pill_h = tw + pad_x*2, th + pad_y*2
px0 = (W - pill_w)//2
py0 = (H - pill_h)//2

# translucent dark pill for readability on any panel
d.rounded_rectangle([px0, py0, px0+pill_w, py0+pill_h], radius=pill_h//2,
                    fill=(20, 18, 14, 110))

tx = px0 + pad_x - bbox[0]
ty = py0 + pad_y - bbox[1]
# soft shadow
d.text((tx+2, ty+3), text, font=font, fill=(0, 0, 0, 150))
# white-cream text
d.text((tx, ty), text, font=font, fill=(253, 250, 242, 235))

img.save("/tmp/watermark.png")
print("saved", img.size, "font:", font.path if font else "default")
