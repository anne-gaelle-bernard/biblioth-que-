// Builds the catalogue of real books: downloads each cover from Open Library
// (kept in public/books as a cache), draws the spines (SVG) and writes
// src/data/collections.json. A book with no cover online gets a drawn SVG cover.
// Usage: node scripts/generate-books.mjs   (add --refresh to download covers again)
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "books");
const refresh = process.argv.includes("--refresh");
mkdirSync(outDir, { recursive: true });
// drawn files are rebuilt every run; downloaded covers are kept unless --refresh
for (const f of readdirSync(outDir)) if (f.endsWith(".svg") || refresh) rmSync(join(outDir, f));

const UA = { "User-Agent": "lamplight-bookshop-catalogue/1.0" };

/**
 * Downloads the Open Library cover for a book; returns the public path, or null.
 * `book.isbn` picks a specific edition; otherwise the first search result with a cover is used.
 */
async function realCover(book) {
  const file = `${book.id}-cover.jpg`;
  if (existsSync(join(outDir, file))) return `/books/${file}`;
  let url;
  if (book.isbn) {
    url = `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg?default=false`;
  } else {
    const q = new URLSearchParams({ title: book.title, author: book.author, fields: "cover_i,title,author_name", limit: "5" });
    const res = await fetch(`https://openlibrary.org/search.json?${q}`, { headers: UA });
    if (!res.ok) return null;
    const hit = (await res.json()).docs?.find((d) => d.cover_i);
    if (!hit) return null;
    console.log(`  matched "${hit.title}" by ${hit.author_name?.join(", ")}`);
    url = `https://covers.openlibrary.org/b/id/${hit.cover_i}-L.jpg`;
  }
  const img = await fetch(url, { headers: UA });
  if (!img.ok) return null;
  const bytes = Buffer.from(await img.arrayBuffer());
  if (bytes.length < 2000) return null; // placeholder pixel
  writeFileSync(join(outDir, file), bytes);
  return `/books/${file}`;
}

const SERIF = "Georgia, 'Times New Roman', serif";
const DISPLAY = "Impact, 'Arial Narrow', sans-serif";
const W = 600;
const H = 900;

// deterministic pseudo-random
function rng(seed) {
  let s = 0;
  for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");

// cover art
const art = {
  planet: (c, r) => {
    const stars = Array.from({ length: 70 }, () => `<circle cx="${r() * W}" cy="${r() * H * 0.7}" r="${r() * 2 + 0.4}" fill="#fff" opacity="${0.3 + r() * 0.7}"/>`).join("");
    const cx = W * (0.35 + r() * 0.3);
    return `${stars}
      <circle cx="${cx}" cy="${H * 0.42}" r="${W * 0.27}" fill="${c.a}"/>
      <circle cx="${cx - W * 0.08}" cy="${H * 0.38}" r="${W * 0.27}" fill="${c.bg}" opacity="0.35"/>
      <ellipse cx="${cx}" cy="${H * 0.42}" rx="${W * 0.46}" ry="${W * 0.08}" fill="none" stroke="${c.b}" stroke-width="7" transform="rotate(-14 ${cx} ${H * 0.42})"/>
      <circle cx="${W * 0.82}" cy="${H * 0.16}" r="${W * 0.05}" fill="${c.b}"/>`;
  },
  orbit: (c, r) => {
    const rings = Array.from({ length: 7 }, (_, i) => `<circle cx="${W / 2}" cy="${H * 0.4}" r="${40 + i * 34}" fill="none" stroke="${i % 2 ? c.a : c.b}" stroke-width="${i === 3 ? 6 : 2}" opacity="${1 - i * 0.1}"/>`).join("");
    const dots = Array.from({ length: 7 }, (_, i) => {
      const a = r() * Math.PI * 2;
      const rad = 40 + i * 34;
      return `<circle cx="${W / 2 + Math.cos(a) * rad}" cy="${H * 0.4 + Math.sin(a) * rad}" r="${6 + r() * 8}" fill="${c.ink}"/>`;
    }).join("");
    return `${rings}${dots}<circle cx="${W / 2}" cy="${H * 0.4}" r="26" fill="${c.a}"/>`;
  },
  city: (c, r) => {
    let x = 0;
    let blocks = "";
    while (x < W) {
      const bw = 40 + r() * 70;
      const bh = H * (0.18 + r() * 0.32);
      blocks += `<rect x="${x}" y="${H * 0.72 - bh}" width="${bw - 4}" height="${bh}" fill="${c.ink}"/>`;
      for (let wy = H * 0.72 - bh + 14; wy < H * 0.7; wy += 22)
        for (let wx = x + 8; wx < x + bw - 14; wx += 16) if (r() > 0.72) blocks += `<rect x="${wx}" y="${wy}" width="7" height="10" fill="${c.a}"/>`;
      x += bw;
    }
    const rain = Array.from({ length: 90 }, () => {
      const rx = r() * W, ry = r() * H * 0.7;
      return `<line x1="${rx}" y1="${ry}" x2="${rx - 10}" y2="${ry + 34}" stroke="${c.b}" stroke-width="1.5" opacity="0.5"/>`;
    }).join("");
    return `<circle cx="${W * 0.72}" cy="${H * 0.2}" r="${W * 0.12}" fill="${c.a}" opacity="0.9"/>${blocks}${rain}`;
  },
  silhouette: (c) => `
      <rect x="${W * 0.12}" y="${H * 0.08}" width="${W * 0.76}" height="${H * 0.62}" fill="${c.a}"/>
      <path d="M ${W * 0.5} ${H * 0.2} c 40 0 62 34 56 76 c 50 18 74 60 80 140 l 6 156 l -284 0 l 6 -156 c 6 -80 30 -122 80 -140 c -6 -42 16 -76 56 -76 z" fill="${c.ink}"/>
      <rect x="${W * 0.3}" y="${H * 0.15}" width="${W * 0.4}" height="20" fill="${c.ink}"/>
      <path d="M ${W * 0.34} ${H * 0.15} q ${W * 0.16} -70 ${W * 0.32} 0" fill="${c.ink}"/>
      ${Array.from({ length: 14 }, (_, i) => `<line x1="${W * 0.12}" y1="${H * 0.1 + i * 40}" x2="${W * 0.88}" y2="${H * 0.1 + i * 40 - 30}" stroke="${c.bg}" stroke-width="2" opacity="0.4"/>`).join("")}`,
  sun: (c) => `
      <circle cx="${W / 2}" cy="${H * 0.44}" r="${W * 0.3}" fill="${c.a}"/>
      ${Array.from({ length: 6 }, (_, i) => `<path d="M 0 ${H * 0.5 + i * 34} q ${W / 4} -26 ${W / 2} 0 t ${W / 2} 0 L ${W} ${H} L 0 ${H} Z" fill="${i % 2 ? c.b : c.bg}" opacity="${0.55 + i * 0.08}"/>`).join("")}`,
  rain: (c, r) => {
    const drops = Array.from({ length: 34 }, () => {
      const x = r() * W, y = r() * H * 0.68, s = 10 + r() * 22;
      return `<path d="M ${x} ${y} q ${s * 0.7} ${s * 1.1} 0 ${s * 1.6} q ${-s * 0.7} ${-s * 0.5} 0 ${-s * 1.6} z" fill="${r() > 0.5 ? c.a : c.b}"/>`;
    }).join("");
    return `${drops}<path d="M ${W * 0.2} ${H * 0.52} q ${W * 0.3} -${H * 0.2} ${W * 0.6} 0 z" fill="${c.ink}"/><line x1="${W * 0.5}" y1="${H * 0.52}" x2="${W * 0.5}" y2="${H * 0.68}" stroke="${c.ink}" stroke-width="6"/>`;
  },
  leaves: (c, r) =>
    Array.from({ length: 16 }, () => {
      const x = W * 0.1 + r() * W * 0.8, y = H * 0.06 + r() * H * 0.6, rot = r() * 360, s = 40 + r() * 60;
      return `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M 0 ${-s} q ${s * 0.6} ${s} 0 ${s * 2} q ${-s * 0.6} ${-s} 0 ${-s * 2} z" fill="${r() > 0.4 ? c.a : c.b}"/><line x1="0" y1="${-s}" x2="0" y2="${s}" stroke="${c.bg}" stroke-width="2"/></g>`;
    }).join(""),
  mountains: (c) => `
      <circle cx="${W * 0.7}" cy="${H * 0.22}" r="${W * 0.1}" fill="${c.b}"/>
      <path d="M 0 ${H * 0.62} L ${W * 0.3} ${H * 0.28} L ${W * 0.5} ${H * 0.48} L ${W * 0.7} ${H * 0.3} L ${W} ${H * 0.62} Z" fill="${c.a}"/>
      <path d="M ${W * 0.3} ${H * 0.28} L ${W * 0.36} ${H * 0.36} L ${W * 0.3} ${H * 0.34} L ${W * 0.25} ${H * 0.35} Z" fill="${c.bg}"/>
      <path d="M 0 ${H * 0.72} L ${W * 0.2} ${H * 0.5} L ${W * 0.45} ${H * 0.66} L ${W * 0.75} ${H * 0.46} L ${W} ${H * 0.72} Z" fill="${c.ink}"/>`,
};

function cover(book, c) {
  const r = rng(book.id);
  const words = book.title.toUpperCase().split(" ");
  const lines = [];
  for (const w of words) {
    const last = lines[lines.length - 1];
    if (last && (last + " " + w).length <= 11) lines[lines.length - 1] = last + " " + w;
    else lines.push(w);
  }
  const fs = lines.length > 2 ? 66 : 82;
  const titleY = H * 0.79 - (lines.length - 1) * fs * 0.5;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${c.bg}"/>
  ${art[book.art](c, r)}
  <rect x="0" y="${H * 0.7}" width="${W}" height="${H * 0.3}" fill="${c.bg}" opacity="0.92"/>
  ${lines.map((l, i) => `<text x="${W * 0.08}" y="${titleY + i * fs * 0.95}" font-family="${DISPLAY}" font-size="${fs}" fill="${c.title}">${esc(l)}</text>`).join("")}
  <text x="${W * 0.08}" y="${H * 0.955}" font-family="${SERIF}" font-style="italic" font-size="28" fill="${c.title}" opacity="0.85">${esc(book.author)}</text>
  <rect x="${W - 64}" y="${H * 0.925}" width="34" height="34" fill="none" stroke="${c.title}" stroke-width="3"/>
  <text x="${W - 47}" y="${H * 0.925 + 25}" text-anchor="middle" font-family="${DISPLAY}" font-size="20" fill="${c.title}">M</text>
  <rect x="0" y="0" width="14" height="${H}" fill="#000" opacity="0.18"/>
</svg>`;
  writeFileSync(join(outDir, `${book.id}-cover.svg`), svg);
  return `/books/${book.id}-cover.svg`;
}

function spine(book, c) {
  const SW = 120;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SW}" height="${H}" viewBox="0 0 ${SW} ${H}">
  <rect width="${SW}" height="${H}" fill="${c.bg}"/>
  <rect x="0" y="40" width="${SW}" height="6" fill="${c.a}"/>
  <rect x="0" y="${H - 46}" width="${SW}" height="6" fill="${c.a}"/>
  <g transform="translate(${SW / 2 + 16} 80) rotate(90)">
    <text x="0" y="0" font-family="${DISPLAY}" font-size="${Math.min(44, Math.floor(1400 / book.title.length))}" fill="${c.title}">${esc(book.title.toUpperCase())}</text>
  </g>
  <g transform="translate(${SW / 2 - 26} 80) rotate(90)">
    <text x="0" y="0" font-family="${SERIF}" font-style="italic" font-size="22" fill="${c.title}" opacity="0.8">${esc(book.author)}</text>
  </g>
  <text x="${SW / 2}" y="${H - 70}" text-anchor="middle" font-family="${DISPLAY}" font-size="30" fill="${c.title}">M</text>
</svg>`;
  writeFileSync(join(outDir, `${book.id}-spine.svg`), svg);
}

// palettes
const P = {
  deepspace: { bg: "#0e1430", a: "#ff7a45", b: "#7ad7ff", ink: "#05081a", title: "#f5f1e8" },
  nebula: { bg: "#2a1145", a: "#ff4fa3", b: "#ffd166", ink: "#140621", title: "#fff4e6" },
  mars: { bg: "#f2d0b0", a: "#c2410c", b: "#1e3a5f", ink: "#3b1306", title: "#1b0d05" },
  ice: { bg: "#dff3f7", a: "#0ea5b7", b: "#1e293b", ink: "#0f172a", title: "#0f172a" },
  noir: { bg: "#111114", a: "#e9c46a", b: "#9ca3af", ink: "#000000", title: "#f4efe6" },
  blood: { bg: "#1a0b0b", a: "#d62828", b: "#f4a261", ink: "#050101", title: "#fbeee0" },
  neon: { bg: "#0b1a1f", a: "#2ee6c5", b: "#ff3d81", ink: "#020708", title: "#e8fff9" },
  smoke: { bg: "#d9d4cc", a: "#2b2b2b", b: "#7a1f1f", ink: "#141414", title: "#141414" },
  dusk: { bg: "#fbe3d1", a: "#f2994a", b: "#e86a92", ink: "#3d1f2b", title: "#2d1520" },
  rainy: { bg: "#dde6ee", a: "#4f6d8f", b: "#9fb7cc", ink: "#1f2d3d", title: "#1f2d3d" },
  plum: { bg: "#3a1f3d", a: "#f6bd60", b: "#c77dff", ink: "#170b18", title: "#fff3e0" },
  moss: { bg: "#e7efdc", a: "#3f7d3a", b: "#a3c585", ink: "#1d2e1a", title: "#1d2e1a" },
  forest: { bg: "#13261c", a: "#6fbf73", b: "#e9c46a", ink: "#08120c", title: "#f1f7ea" },
  clay: { bg: "#f1e0cf", a: "#b5562f", b: "#5f7a61", ink: "#2b1a10", title: "#2b1a10" },
};


// catalogue: real books (year = first publication, pages = a common paperback edition)
const collections = [
  {
    id: "beyond-the-stars",
    name: "Science Fiction",
    description: "Classic and modern science fiction: desert planets, galactic empires, cyberspace and the future.",
    books: [
      { title: "Dune", author: "Frank Herbert", art: "planet", palette: P.mars, price: 12, pages: 688, year: 1965,
        description: "On the desert planet Arrakis, young Paul Atreides is drawn into a war over the most precious substance in the universe." },
      { title: "Foundation", author: "Isaac Asimov", art: "orbit", palette: P.deepspace, price: 10, pages: 255, year: 1951,
        description: "A mathematician foresees the fall of the Galactic Empire and sets up a plan to shorten the dark age that follows." },
      { title: "Neuromancer", author: "William Gibson", art: "orbit", palette: P.neon, price: 11, pages: 271, year: 1984,
        description: "A burned-out hacker is hired for one last job in cyberspace. The novel that started cyberpunk." },
      { title: "The Left Hand of Darkness", author: "Ursula K. Le Guin", art: "planet", palette: P.ice, price: 11, pages: 304, year: 1969,
        description: "An envoy visits Gethen, a frozen world whose people have no fixed gender, and must learn to trust one of them." },
      { title: "Fahrenheit 451", author: "Ray Bradbury", art: "planet", palette: P.blood, price: 9, pages: 256, year: 1953,
        description: "Guy Montag is a fireman whose job is to burn books, until he starts reading them." },
      { title: "The Martian", author: "Andy Weir", art: "planet", palette: P.mars, price: 12, pages: 384, year: 2011,
        description: "Left behind on Mars, astronaut Mark Watney has to survive with science, duct tape and a sense of humour." },
    ],
  },
  {
    id: "midnight-noir",
    name: "Crime & Mystery",
    description: "Detectives, hard-boiled private eyes and modern thrillers.",
    books: [
      { title: "The Hound of the Baskervilles", author: "Arthur Conan Doyle", art: "silhouette", palette: P.smoke, price: 8, pages: 256, year: 1902,
        description: "Sherlock Holmes and Dr Watson investigate a family curse and a ghostly hound on the moors of Devon." },
      { title: "Murder on the Orient Express", author: "Agatha Christie", art: "silhouette", palette: P.noir, price: 10, pages: 256, year: 1934,
        description: "A passenger is stabbed on a train stuck in the snow, and Hercule Poirot has twelve suspects." },
      { title: "The Big Sleep", author: "Raymond Chandler", art: "city", palette: P.noir, price: 11, pages: 231, year: 1939,
        description: "Private detective Philip Marlowe is hired by a rich general and pulled into the dark side of Los Angeles." },
      { title: "The Maltese Falcon", author: "Dashiell Hammett", art: "silhouette", palette: P.blood, price: 11, pages: 217, year: 1930,
        description: "Sam Spade chases a priceless statuette through San Francisco after his partner is shot." },
      { title: "The Girl with the Dragon Tattoo", author: "Stieg Larsson", isbn: "9780307454546", art: "city", palette: P.blood, price: 12, pages: 672, year: 2005,
        description: "A journalist and a brilliant hacker look into a disappearance that happened forty years ago." },
      { title: "Gone Girl", author: "Gillian Flynn", art: "city", palette: P.neon, price: 11, pages: 432, year: 2012,
        description: "On their fifth wedding anniversary, Amy disappears, and every clue points at her husband Nick." },
    ],
  },
  {
    id: "poems-for-rainy-days",
    name: "Poetry",
    description: "Great poets, from the 19th century to today.",
    books: [
      { title: "Leaves of Grass", author: "Walt Whitman", art: "sun", palette: P.dusk, price: 10, pages: 464, year: 1855,
        description: "Whitman's life work, a celebration of the self, the body, democracy and America." },
      { title: "The Flowers of Evil", author: "Charles Baudelaire", art: "rain", palette: P.plum, price: 10, pages: 384, year: 1857,
        description: "Les Fleurs du mal: poems of beauty, decay and the modern city that changed French poetry." },
      { title: "Ariel", author: "Sylvia Plath", art: "sun", palette: P.dusk, price: 12, pages: 112, year: 1965,
        description: "The fierce last poems Sylvia Plath wrote, published after her death." },
      { title: "The Complete Poems of Emily Dickinson", author: "Emily Dickinson", art: "rain", palette: P.rainy, price: 18, pages: 770, year: 1955,
        description: "All 1,775 poems by Emily Dickinson, short and strange, about nature, death and the inner life." },
      { title: "Milk and Honey", author: "Rupi Kaur", art: "sun", palette: P.rainy, price: 14, pages: 208, year: 2014,
        description: "Short poems about love, loss, trauma and healing, with drawings by the author." },
      { title: "Devotions", author: "Mary Oliver", art: "rain", palette: P.moss, price: 20, pages: 480, year: 2017,
        description: "Mary Oliver's own selection of her poems about animals, the natural world and paying attention." },
    ],
  },
  {
    id: "wild-and-slow",
    name: "Nature Writing",
    description: "Essays and memoirs about forests, birds, the land and our place in it.",
    books: [
      { title: "Walden", author: "Henry David Thoreau", art: "leaves", palette: P.moss, price: 9, pages: 352, year: 1854,
        description: "Thoreau's two years living simply in a cabin by Walden Pond, in the woods of Massachusetts." },
      { title: "Silent Spring", author: "Rachel Carson", isbn: "9780618249060", art: "leaves", palette: P.forest, price: 12, pages: 378, year: 1962,
        description: "The book that revealed the damage done by pesticides and launched the environmental movement." },
      { title: "A Sand County Almanac", author: "Aldo Leopold", art: "mountains", palette: P.clay, price: 11, pages: 240, year: 1949,
        description: "A year on a Wisconsin farm, and the case for a land ethic that treats nature as a community." },
      { title: "Pilgrim at Tinker Creek", author: "Annie Dillard", art: "leaves", palette: P.moss, price: 13, pages: 288, year: 1974,
        description: "A year of close watching in a valley of Virginia's Blue Ridge Mountains. Pulitzer Prize 1975." },
      { title: "H is for Hawk", author: "Helen Macdonald", art: "mountains", palette: P.clay, price: 12, pages: 320, year: 2014,
        description: "After her father's death, the author trains a goshawk, a wild and difficult bird of prey." },
      { title: "Braiding Sweetgrass", author: "Robin Wall Kimmerer", art: "leaves", palette: P.forest, price: 16, pages: 408, year: 2013,
        description: "A botanist and member of the Potawatomi Nation brings together science and Indigenous knowledge of plants." },
    ],
  },
];

const missing = [];
const data = { collections: [] };
for (const col of collections) {
  const books = [];
  for (const [i, b] of col.books.entries()) {
    const id = `${col.id}-${String(i + 1).padStart(2, "0")}`;
    const book = { id, ...b };
    let coverPath = null;
    try {
      coverPath = await realCover(book);
    } catch (err) {
      console.warn(`  ${b.title}: ${err.message}`);
    }
    if (!coverPath) {
      missing.push(b.title);
      coverPath = cover(book, b.palette);
    }
    spine(book, b.palette);
    console.log(`${coverPath.endsWith(".jpg") ? "cover" : "drawn"}  ${b.title}`);
    books.push({
      id,
      title: b.title,
      author: b.author,
      price: b.price,
      cover: coverPath,
      spine: `/books/${id}-spine.svg`,
      collection: col.id,
      pages: b.pages,
      year: b.year,
      color: b.palette.bg,
      accent: b.palette.a,
      description: b.description,
    });
  }
  data.collections.push({ id: col.id, name: col.name, description: col.description, books });
}

const dataPath = join(root, "src", "data", "collections.json");
writeFileSync(dataPath, JSON.stringify(data, null, 2) + "\n");
console.log(`Catalogue: ${data.collections.reduce((n, c) => n + c.books.length, 0)} books, ${missing.length} drawn covers${missing.length ? ` (${missing.join(", ")})` : ""}.`);
