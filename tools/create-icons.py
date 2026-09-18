from PIL import Image, ImageDraw
from pathlib import Path
Path('public/icons').mkdir(parents=True, exist_ok=True)
for size in (192, 512):
    image = Image.new('RGB', (size, size), '#182832')
    draw = ImageDraw.Draw(image)
    def box(coords, fill):
        draw.rectangle(tuple(round(v * size / 512) for v in coords), fill=fill)
    draw.ellipse((size*.19,size*.16,size*.81,size*.78), fill='#cdb781')
    draw.ellipse((size*.30,size*.11,size*.90,size*.72), fill='#182832')
    box((152,265,361,357),'#855d50')
    box((171,276,239,337),'#bb8961')
    box((260,276,341,337),'#ad7859')
    box((203,209,311,270),'#855d50')
    box((221,222,292,256),'#c49462')
    draw.line([(int(size*.26),int(size*.74)),(int(size*.76),int(size*.74))],fill='#e6c790',width=max(1,size//90))
    image.save(f'public/icons/icon-{size}.png')
