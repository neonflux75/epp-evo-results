const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const toolsDir = path.join(rootDir, 'tools');
const cliExe = path.join(toolsDir, 'ACEvo.Package.CLI.exe');
const gameDir = 'E:\\Games\\steamapps\\common\\Assetto Corsa EVO';
const kspkgPath = path.join(gameDir, 'content.kspkg');
const gameListTxt = path.join(gameDir, 'content_files.txt');
const localListTxt = path.join(toolsDir, 'content_files.txt');
const destDir = path.join(rootDir, 'public', 'assets', 'tracks');
const tempDir = path.join(toolsDir, 'temp_tracks_extract');
const outMapPath = path.join(rootDir, 'src', 'config', 'tracksMap.json');
const outInfoPath = path.join(rootDir, 'src', 'config', 'tracksInfo.json');

if (!fs.existsSync(cliExe)) {
  console.error('[ERRORE] ACEvo.Package.CLI.exe non trovato in:', cliExe);
  process.exit(1);
}

if (!fs.existsSync(kspkgPath)) {
  console.error('[ERRORE] content.kspkg non trovato in:', kspkgPath);
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });
fs.mkdirSync(tempDir, { recursive: true });

console.log('[1/3] Generazione elenco file da content.kspkg...');
execFileSync(cliExe, ['list-files', '-i', kspkgPath], {
  cwd: toolsDir,
  stdio: 'ignore',
});

const activeListPath = fs.existsSync(gameListTxt) ? gameListTxt : localListTxt;
if (!fs.existsSync(activeListPath)) {
  console.error('[ERRORE] File content_files.txt non trovato.');
  process.exit(1);
}

const fileContent = fs.readFileSync(activeListPath, 'utf-8');
const allLines = fileContent
  .split(/\r?\n/)
  .map((line) => line.replace(/^.*?((?:uiresources|content)[\\/])/i, '$1').split(' - ').shift().trim())
  .filter(Boolean);

const svgEntries = Array.from(new Set(allLines.filter((p) => /trackmaps[\\/].+\.svg$/i.test(p))));
const trackJsonEntries = Array.from(
  new Set(allLines.filter((p) => /^content[\\/]tracks[\\/].+\.(json|ui)$/i.test(p)))
);

console.log(`Trovati ${svgEntries.length} tracciati SVG e ${trackJsonEntries.length} file metadata.`);

for (const oldFile of fs.readdirSync(destDir)) {
  if (/\.(png|svg)$/i.test(oldFile)) {
    fs.unlinkSync(path.join(destDir, oldFile));
  }
}

console.log('[2/3] Estrazione SVG ufficiali...');
const tracksMap = {};
let okCount = 0;

for (const pkgFile of svgEntries) {
  try {
    execFileSync(cliExe, ['unpack-file', '-i', kspkgPath, '-f', pkgFile, '-o', destDir], {
      cwd: toolsDir,
      stdio: 'ignore',
    });
    const extractedNested = path.join(destDir, ...pkgFile.split(/[\\/]/));
    const baseName = path.basename(pkgFile);
    const flatDest = path.join(destDir, baseName);
    if (fs.existsSync(extractedNested)) {
      fs.renameSync(extractedNested, flatDest);
    }
    const key = baseName.replace(/\.svg$/i, '').toLowerCase();
    tracksMap[key] = `/assets/tracks/${baseName}`;
    okCount++;
    console.log('  OK ->', baseName);
  } catch (err) {
    console.error('  ERRORE su', pkgFile, err.message);
  }
}

const nestedUiDir = path.join(destDir, 'uiresources');
if (fs.existsSync(nestedUiDir)) {
  fs.rmSync(nestedUiDir, { recursive: true, force: true });
}

console.log('[3/3] Estrazione dettagli tecnici (km, curve, descrizione)...');
let existingInfo = {};
if (fs.existsSync(outInfoPath)) {
  try {
    existingInfo = JSON.parse(fs.readFileSync(outInfoPath, 'utf-8'));
  } catch {}
}

for (const pkgMeta of trackJsonEntries) {
  try {
    execFileSync(cliExe, ['unpack-file', '-i', kspkgPath, '-f', pkgMeta, '-o', tempDir], {
      cwd: toolsDir,
      stdio: 'ignore',
    });
    const metaDisk = path.join(tempDir, ...pkgMeta.split(/[\\/]/));
    if (!fs.existsSync(metaDisk)) continue;
    const rawTxt = fs.readFileSync(metaDisk, 'utf-8').replace(/^\uFEFF/, '');
    const parsed = JSON.parse(rawTxt);

    const parts = pkgMeta.split(/[\\/]/);
    const trackFolder = (parts[2] || '').toLowerCase();
    const layoutFolder = (parts[3] && !parts[3].includes('.') ? parts[3] : '').toLowerCase();
    const trackKey = layoutFolder ? `${trackFolder}_${layoutFolder}` : trackFolder;

    const lengthMeters = Number(parsed.length || parsed.trackLength || parsed.lengthMeters || 0);
    const turns = Number(parsed.turns || parsed.corners || parsed.turnCount || 0);
    const descEn = parsed.description || parsed.desc || '';
    const country = parsed.country || parsed.nation || '';

    if (trackKey && (lengthMeters > 0 || turns > 0 || descEn)) {
      const prev = existingInfo[trackKey] || {};
      existingInfo[trackKey] = {
        lengthKm: lengthMeters > 0 ? Number((lengthMeters > 100 ? lengthMeters / 1000 : lengthMeters).toFixed(3)) : prev.lengthKm || null,
        turns: turns > 0 ? turns : prev.turns || null,
        country: country || prev.country || '',
        descIt: prev.descIt || descEn || '',
        descEn: descEn || prev.descEn || '',
      };
    }
  } catch {}
}

fs.rmSync(tempDir, { recursive: true, force: true });
if (fs.existsSync(gameListTxt)) fs.unlinkSync(gameListTxt);

fs.mkdirSync(path.dirname(outMapPath), { recursive: true });
fs.writeFileSync(outMapPath, JSON.stringify(tracksMap, null, 2), 'utf-8');
fs.writeFileSync(outInfoPath, JSON.stringify(existingInfo, null, 2), 'utf-8');

console.log(`\nCompletato! Estratti ${okCount}/${svgEntries.length} SVG e aggiornati tracksMap.json + tracksInfo.json!`);
