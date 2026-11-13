from pathlib import Path
from urllib.request import urlopen, Request
from concurrent.futures import ThreadPoolExecutor

TARGET = Path(__file__).resolve().parent.parent / 'public' / 'assets' / 'images'
FILES = {
    'interstellar.jpg': 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    'interstellar-backdrop.jpg': 'https://image.tmdb.org/t/p/w1280/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    'dune.jpg': 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    'soul.jpg': 'https://image.tmdb.org/t/p/w500/hm58Jw4Lw8OIeECIq5qyPYhAeRJ.jpg',
    'spirited.jpg': 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
    'inception.jpg': 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
    'your-name.jpg': 'https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONONX.jpg',
    'cinema.jpg': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=85',
}
FILES.update({name.replace('.jpg', '-small.jpg'): url.replace('/w500/', '/w342/') for name, url in list(FILES.items()) if '/w500/' in url})
FILES['interstellar-backdrop-small.jpg'] = FILES['interstellar-backdrop.jpg'].replace('/w1280/', '/w500/')
FILES['cinema-small.jpg'] = FILES['cinema.jpg'].replace('w=1200', 'w=700')

def fetch(item):
    name, url = item
    if (TARGET / name).exists():
        return f'{name}: cached'
    data = urlopen(Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=45).read()
    (TARGET / name).write_bytes(data)
    return f'{name}: {len(data)} bytes'

if __name__ == '__main__':
    TARGET.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=4) as pool:
        for result in pool.map(fetch, FILES.items()):
            print(result)
