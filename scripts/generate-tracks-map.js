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
  if (clean && !map[clean]) map[clean] = file;
}

const findFile = (...keywords) =>
  files.find((f) => keywords.every((kw) => f.toLowerCase().includes(kw))) || null;

const aliases = {
  // Nurburgring varianti
  nurburgring_touristenfahrten: findFile('touristen') || findFile('nordschleife'),
  touristenfahrten: findFile('touristen') || findFile('nordschleife'),
  nordschleife_touristen: findFile('touristen') || findFile('nordschleife'),
  nurburgring_nordschleife: findFile('nordschleife') || findFile('24h'),
  nordschleife: findFile('nordschleife') || findFile('24h'),
  nurburgring_24h: findFile('24h') || findFile('nordschleife'),
  nurburgring_sprint: findFile('sprint') || findFile('nurburgring_gp'),
  nurburgring_gp:
    findFile('nurburgring_gp') ||
    files.find(
      (f) =>
        f.toLowerCase().includes('nurburgring') &&
        !f.toLowerCase().includes('nordschleife') &&
        !f.toLowerCase().includes('touristen') &&
        !f.toLowerCase().includes('24h') &&
        !f.toLowerCase().includes('sprint')
    ),
  nurburgring: findFile('nurburgring_gp') || findFile('nurburgring'),

  // Brands Hatch varianti
  brands_hatch_indy: findFile('brands', 'indy') || findFile('indy'),
  brands_hatch_gp: findFile('brands', 'gp') || findFile('brands'),
  brands_hatch: findFile('brands', 'gp') || findFile('brands'),

  // Monza varianti
  monza_junior: findFile('monza', 'junior') || findFile('junior'),
  monza_gp: findFile('monza'),
  monza: findFile('monza'),

  // Suzuka varianti
  suzuka_east: findFile('suzuka', 'east'),
  suzuka_west: findFile('suzuka', 'west'),
  suzuka_gp: findFile('suzuka', 'gp') || findFile('suzuka'),
  suzuka: findFile('suzuka', 'gp') || findFile('suzuka'),

  // Red Bull Ring varianti
  red_bull_ring_national: findFile('red_bull', 'national'),
  red_bull_ring_gp: findFile('red_bull_ring'),
  red_bull_ring: findFile('red_bull_ring'),

  // Donington varianti
  donington_park_national: findFile('donington', 'national'),
  donington_park_gp: findFile('donington', 'gp') || findFile('donington'),
  donington_park: findFile('donington', 'gp') || findFile('donington'),
  donington: findFile('donington', 'gp') || findFile('donington'),

  // Oulton Park varianti
  oulton_park_island: findFile('oulton', 'island'),
  oulton_park_fosters: findFile('oulton', 'fosters'),
  oulton_park_international: findFile('oulton'),
  oulton_park: findFile('oulton'),

  // Silverstone varianti
  silverstone_international: findFile('silverstone', 'international'),
  silverstone_national: findFile('silverstone', 'national'),
  silverstone_gp: findFile('silverstone', 'gp') || findFile('silverstone'),
  silverstone: findFile('silverstone', 'gp') || findFile('silverstone'),

  // Barcelona varianti
  barcelona_national: findFile('barcelona', 'national'),
  barcelona_gp: findFile('barcelona', 'gp') || findFile('barcelona'),
  barcelona: findFile('barcelona', 'gp') || findFile('barcelona'),

  // Vallelunga varianti
  vallelunga_club: findFile('vallelunga', 'club'),
  vallelunga: findFile('vallelunga'),

  // Altri circuiti
  imola: findFile('imola'),
  imola_gp: findFile('imola'),
  spa: findFile('spa'),
  spa_gp: findFile('spa'),
  laguna_seca: findFile('laguna'),
  fuji: findFile('fuji'),
  mount_panorama: findFile('panorama') || findFile('bathurst'),
  cota: findFile('cota') || findFile('americas'),
  paul_ricard: findFile('paul_ricard'),
  road_atlanta: findFile('road_atlanta'),
  sebring: findFile('sebring'),
  watkins_glen: findFile('watkins'),
  kyalami: findFile('kyalami'),
  zandvoort: findFile('zandvoort'),
  hungaroring: findFile('hungaroring'),
  misano: findFile('misano'),
  mugello: findFile('mugello'),
};

for (const [key, matchedFile] of Object.entries(aliases)) {
  if (matchedFile) map[key] = matchedFile;
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
