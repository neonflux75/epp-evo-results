const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const toolsDir = path.join(rootDir, 'tools');
const cliExe = path.join(toolsDir, 'ACEvo.Package.CLI.exe');
const gameDir = 'E:\\Games\\steamapps\\common\\Assetto Corsa EVO';
const kspkgPath = path.join(gameDir, 'content.kspkg');
const listTxtPath = path.join(gameDir, 'content_files.txt');
const destDir = path.join(rootDir, 'public', 'assets', 'tracks');

if (!fs.existsSync(cliExe)) {
  console.error('[ERRORE] ACEvo.Package.CLI.exe non trovato in:', cliExe);
  process.exit(1);
}

if (!fs.existsSync(kspkgPath)) {
  console.error('[ERRORE] content.kspkg non trovato in:', kspkgPath);
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });

console.log('[1/3] Generazione elenco file da content.kspkg...');
execFileSync(cliExe, ['list-files', '-i', kspkgPath], {
  cwd: toolsDir,
  stdio: 'ignore',
});

if (!fs.existsSync(listTxtPath)) {
  console.error('[ERRORE] File content_files.txt non trovato in:', listTxtPath);
  process.exit(1);
}

const fileContent = fs.readFileSync(listTxtPath, 'utf-8');
const svgEntries = Array.from(
  new Set(
    fileContent
      .split(/\r?\n/)
      .map((line) => {
        const cleaned = line.replace(/^.*?(uiresources[\\/])/i, '$1');
        const firstPart = cleaned.split(' - ').shift() || '';
        return firstPart.trim();
      })
      .filter((p) => /trackmaps[\\/].+\.svg$/i.test(p))
  )
);

console.log(`Trovati ${svgEntries.length} tracciati SVG ufficiali.`);

for (const oldFile of fs.readdirSync(destDir)) {
  if (/\.(png|svg)$/i.test(oldFile)) {
    fs.unlinkSync(path.join(destDir, oldFile));
  }
}

console.log('[2/3] Estrazione e decifratura SVG...');
let okCount = 0;

for (const pkgFile of svgEntries) {
  try {
    execFileSync(cliExe, ['unpack-file', '-i', kspkgPath, '-f', pkgFile, '-o', destDir], {
      cwd: toolsDir,
      stdio: 'ignore',
    });
    const extractedNested = path.join(destDir, ...pkgFile.split(/[\\/]/));
    const flatDest = path.join(destDir, path.basename(pkgFile));
    if (fs.existsSync(extractedNested)) {
      fs.renameSync(extractedNested, flatDest);
    }
    okCount++;
    console.log('  OK ->', path.basename(pkgFile));
  } catch (err) {
    console.error('  ERRORE su', pkgFile, err.message);
  }
}

const nestedUiDir = path.join(destDir, 'uiresources');
if (fs.existsSync(nestedUiDir)) {
  fs.rmSync(nestedUiDir, { recursive: true, force: true });
}

console.log(`\n[3/3] Estratti ${okCount}/${svgEntries.length} file SVG. Aggiorno tracksMap.json...`);
if (fs.existsSync(listTxtPath)) {
  fs.unlinkSync(listTxtPath);
}
require('./generate-tracks-map.js');
