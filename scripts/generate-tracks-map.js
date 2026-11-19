const fs = require('fs');
const path = require('path');

const tracksDir = path.join(__dirname, '..', 'public', 'assets', 'tracks');
const outJsonPath = path.join(__dirname, '..', 'src', 'config', 'tracksMap.json');
const outTxtPath = path.join(__dirname, '..', 'piste_trovate.txt');

if (!fs.existsSync(tracksDir)) {
  console.error('Cartella non trovata:', tracksDir);
  process.exit(1);
}

const files = fs
  .readdirSync(tracksDir)
  .filter((f) => /\.(png|jpg|jpeg|webp|svg)$/i.test(f))
  .sort((a, b) => a.localeCompare(b));

const map = {};

for (const file of files) {
  const base = file.replace(/\.[^.]+$/, '').toLowerCase();
  map[base] = file;

  const clean = base.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  if (clean && !map[clean]) {
    map[clean] = file;
  }
}

// Alias intelligenti automatici per varianti di nomi di AC EVO
const findFile = (...keywords) =>
  files.find((f) => keywords.every((kw) => f.toLowerCase().includes(kw))) || null;

const aliases = {
  nordschleife: findFile('nordschleife') || findFile('24h'),
  nurburgring_nordschleife: findFile('nordschleife') || findFile('24h'),
  nurburgring_24h: findFile('24h') || findFile('nordschleife'),
  nurburgring: files.find((f) => f.toLowerCase().includes('nurburgring') && !f.toLowerCase().includes('nordschleife')) || findFile('nurburgring'),
  brands_hatch_indy: findFile('brands', 'indy') || findFile('indy'),
  brands_hatch: findFile('brands', 'gp') || findFile('brands'),
  imola: findFile('imola'),
  monza: findFile('monza'),
  spa: findFile('spa'),
  laguna_seca: findFile('laguna'),
  mount_panorama: findFile('panorama') || findFile('bathurst'),
  suzuka: findFile('suzuka'),
  fuji: findFile('fuji'),
  donington: findFile('donington'),
  watkins_glen: findFile('watkins'),
  red_bull_ring: findFile('red_bull') || findFile('redbull'),
  cota: findFile('cota') || findFile('americas'),
  silverstone: findFile('silverstone'),
  barcelona: findFile('barcelona') || findFile('catalunya'),
  mugello: findFile('mugello'),
  vallelunga: findFile('vallelunga'),
  misano: findFile('misano'),
  zandvoort: findFile('zandvoort'),
  kyalami: findFile('kyalami'),
};

for (const [key, matchedFile] of Object.entries(aliases)) {
  if (matchedFile) {
    map[key] = matchedFile;
  }
}

fs.mkdirSync(path.dirname(outJsonPath), { recursive: true });
fs.writeFileSync(outJsonPath, JSON.stringify(map, null, 2), 'utf-8');

const report = [
  `=== IMMAGINI TROVATE IN public/assets/tracks (${files.length}) ===`,
  ...files.map((f) => `- ${f}`),
  '',
  '=== ASSOCIAZIONI AUTOMATICHE GENERATE ===',
  ...Object.entries(aliases)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k} -> ${v}`),
].join('\n');

fs.writeFileSync(outTxtPath, report, 'utf-8');
console.log(`Generato tracksMap.json con ${files.length} file immagine.`);
console.log('Dettaglio salvato in piste_trovate.txt');
