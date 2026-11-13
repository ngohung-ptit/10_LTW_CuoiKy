from pathlib import Path
from urllib.request import Request, urlopen
import re

root = Path(__file__).resolve().parent.parent / 'public' / 'assets' / 'fonts'
root.mkdir(parents=True, exist_ok=True)
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'}
css = urlopen(Request('https://fonts.googleapis.com/css2?family=Albert+Sans:wght@400..600&display=swap', headers=headers), timeout=30).read().decode()
for index, url in enumerate(dict.fromkeys(re.findall(r'url\((https://[^)]+)\)', css))):
    extension = '.woff2' if '.woff2' in url else '.ttf'
    filename = f'albert-sans-{index}{extension}'
    (root / filename).write_bytes(urlopen(Request(url, headers=headers), timeout=30).read())
    css = css.replace(url, f'/assets/fonts/{filename}')
(root / 'albert-sans.css').write_text(css, encoding='utf-8')
license_url = 'https://raw.githubusercontent.com/google/fonts/main/ofl/albertsans/OFL.txt'
(root / 'OFL.txt').write_bytes(urlopen(Request(license_url, headers=headers), timeout=30).read())
print('Downloaded Albert Sans and OFL license into', root)
