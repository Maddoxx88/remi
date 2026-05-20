#!/bin/bash

# Run this from apps/mobile/
echo "📦 Setting up Remi assets..."

mkdir -p assets/fonts

# ── Fonts from Google Fonts (direct CDN links) ──────────────────────────────
echo "🔤 Downloading fonts..."

curl -sL "https://fonts.gstatic.com/s/dmserifdisplay/v15/-nFnOHM81r4j6k0gjALR8uVua8QTK1sM.ttf" \
  -o assets/fonts/DMSerifDisplay-Regular.ttf && echo "  ✓ DMSerifDisplay-Regular"

curl -sL "https://fonts.gstatic.com/s/dmsans/v15/rP2Hp2ywxg089UriCZa4ET-DNl0.ttf" \
  -o assets/fonts/DMSans-Regular.ttf && echo "  ✓ DMSans-Regular"

curl -sL "https://fonts.gstatic.com/s/dmsans/v15/rP2Cp2ywxg089UriCZaIGDWCBl0.ttf" \
  -o assets/fonts/DMSans-Medium.ttf && echo "  ✓ DMSans-Medium"

curl -sL "https://fonts.gstatic.com/s/dmsans/v15/rP2Cp2ywxg089UriCZa4HzWCBl0.ttf" \
  -o assets/fonts/DMSans-SemiBold.ttf && echo "  ✓ DMSans-SemiBold"

curl -sL "https://fonts.gstatic.com/s/spacemono/v13/i7dPIFZifjKcF5UAWdDRUEZ2RQ.ttf" \
  -o assets/fonts/SpaceMono-Regular.ttf && echo "  ✓ SpaceMono-Regular"

# ── App icons (simple colored PNGs via placeholder) ─────────────────────────
echo "🖼  Downloading placeholder icons..."

# Use Python to generate simple colored PNG files (no external deps needed)
python3 - <<'PYEOF'
import struct, zlib, os

def make_png(width, height, r, g, b, path):
    def chunk(name, data):
        c = zlib.crc32(name + data) & 0xFFFFFFFF
        return struct.pack('>I', len(data)) + name + data + struct.pack('>I', c)

    ihdr = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    raw = b''
    for _ in range(height):
        raw += b'\x00' + bytes([r, g, b] * width)
    idat = zlib.compress(raw)

    png = (b'\x89PNG\r\n\x1a\n'
           + chunk(b'IHDR', ihdr)
           + chunk(b'IDAT', idat)
           + chunk(b'IEND', b''))
    os.makedirs(os.path.dirname(path) if os.path.dirname(path) else '.', exist_ok=True)
    with open(path, 'wb') as f:
        f.write(png)
    print(f'  ✓ {path}')

make_png(1024, 1024, 124, 106, 247, 'assets/icon.png')
make_png(1284, 2778, 10,  10,  15,  'assets/splash.png')
make_png(1024, 1024, 124, 106, 247, 'assets/adaptive-icon.png')
make_png(48,   48,   124, 106, 247, 'assets/favicon.png')
PYEOF

echo ""
echo "✅ All assets ready! Now run: npx expo start"