const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const toolsDir = path.join(rootDir, 'tools');
const cliExe = path.join(toolsDir, 'ACEvo.Package.CLI.exe');
const texconvExe = path.join(toolsDir, 'texconv.exe');
const gameDir = 'E:\\Games\\steamapps\\common\\Assetto Corsa EVO';
const kspkgPath = path.join(gameDir, 'content.kspkg');
const gameListTxt = path.join(gameDir, 'content_files.txt');
const localListTxt = path.join(toolsDir, 'content_files.txt');
const tempDir = path.join(toolsDir, 'temp_cars_extract');
const destDir = path.join(rootDir, 'public', 'assets', 'cars');
const outMapPath = path.join(rootDir, 'src', 'config', 'carsMap.json');
const forceAll = process.argv.includes('--force');

if (!fs.existsSync(texconvExe)) {
  console.error('[ERRORE] Assicurati che texconv.exe sia in:', texconvExe);
  process.exit(1);
}

function buildDdsHeader(width, height, dxgiFormat) {
  const b = Buffer.alloc(148);
  b.write('DDS ', 0, 4, 'ascii');
  b.writeUInt32LE(124, 4);
  b.writeUInt32LE(0x1007, 8);
  b.writeUInt32LE(height, 12);
  b.writeUInt32LE(width, 16);
  b.writeUInt32LE(32, 76);
  b.writeUInt32LE(4, 80);
  b.write('DX10', 84, 4, 'ascii');
  b.writeUInt32LE(0x1000, 108);
  b.writeUInt32LE(dxgiFormat, 128);
  b.writeUInt32LE(3, 132);
  b.writeUInt32LE(1, 140);
  return b;
}

function isRgba8Header(texBuf) {
  const hex = texBuf.subarray(0, 12).toString('hex');
  return hex.startsWith('088004108004');
}

function decodeCarTexture(texBuf, mipsBuf) {
  if (isRgba8Header(texBuf) && mipsBuf.length === 1048576) {
    return { width: 512, height: 512, dxgi: 28, data: mipsBuf };
  }

  if (mipsBuf.length >= 786432) {
    const out = Buffer.alloc(524288);
    for (let half = 0; half < 2; half++) {
      const srcHalf = mipsBuf.subarray(262144 + half * 262144, 262144 + (half + 1) * 262144);
      for (let col = 0; col < 4; col++) {
        const base = col * 65536;
        for (let r = 0; r < 64; r++) {
          srcHalf.copy(
            out,
            (half * 64 + r) * 4096 + col * 1024,
            base + r * 1024,
            base + (r + 1) * 1024
          );
        }
      }
    }
    return { width: 1024, height: 512, dxgi: 98, data: out };
  }

  const outSmall = Buffer.alloc(131072);
  mipsBuf.subarray(Math.max(0, mipsBuf.length - 131072)).copy(outSmall);
  return { width: 512, height: 256, dxgi: 98, data: outSmall };
}

if (forceAll && fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
}
fs.mkdirSync(destDir, { recursive: true });
fs.mkdirSync(tempDir, { recursive: true });

console.log('[1/3] Lettura elenco vetture ufficiali da content.kspkg...');
execFileSync(cliExe, ['list-files', '-i', kspkgPath], { cwd: toolsDir, stdio: 'ignore' });
const activeListPath = fs.existsSync(gameListTxt) ? gameListTxt : localListTxt;
const listing = fs.readFileSync(activeListPath, 'utf-8');
if (fs.existsSync(gameListTxt)) fs.unlinkSync(gameListTxt);

const carThumbMap = new Map();
for (const line of listing.split(/\r?\n/)) {
  const cleaned = line.replace(/^.*?(content[\\/])/i, '$1').split(' - ').shift().trim();
  const match = cleaned.match(/^content[\\/]cars[\\/]([^\\/]+)[\\/]generated[\\/]thumbnails[\\/].+\.texturemips$/i);
  if (match && match.at(1)) {
    const carId = match.at(1).toLowerCase();
    if (!carThumbMap.has(carId)) {
      carThumbMap.set(carId, cleaned);
    }
  }
}

console.log(`[2/3] Trovate ${carThumbMap.size} vetture ufficiali nel gioco.`);

const carsIndex = {};
let added = 0;
let kept = 0;

for (const [carId, pkgMipsPath] of carThumbMap.entries()) {
  const outName = `${carId}.png`;
  const finalPngPath = path.join(destDir, outName);

  if (!forceAll && fs.existsSync(finalPngPath)) {
    carsIndex[carId] = `/assets/cars/${outName}`;
    kept++;
    continue;
  }

  try {
    const pkgTexPath = pkgMipsPath.replace(/mips$/i, '');
    execFileSync(cliExe, ['unpack-file', '-i', kspkgPath, '-f', pkgTexPath, '-o', tempDir], {
      cwd: toolsDir,
      stdio: 'ignore',
    });
    execFileSync(cliExe, ['unpack-file', '-i', kspkgPath, '-f', pkgMipsPath, '-o', tempDir], {
      cwd: toolsDir,
      stdio: 'ignore',
    });

    const texDiskPath = path.join(tempDir, ...pkgTexPath.split(/[\\/]/));
    const mipsDiskPath = path.join(tempDir, ...pkgMipsPath.split(/[\\/]/));
    const texBuf = fs.readFileSync(texDiskPath);
    const mipsBuf = fs.readFileSync(mipsDiskPath);
    const decoded = decodeCarTexture(texBuf, mipsBuf);

    const ddsPath = path.join(tempDir, `${carId}.dds`);
    fs.writeFileSync(
      ddsPath,
      Buffer.concat([buildDdsHeader(decoded.width, decoded.height, decoded.dxgi), decoded.data])
    );

    execFileSync(texconvExe, ['-ft', 'png', '-y', '-o', destDir, ddsPath], { stdio: 'ignore' });

    if (fs.existsSync(finalPngPath)) {
      carsIndex[carId] = `/assets/cars/${outName}`;
      added++;
      console.log(`  NUOVA -> ${outName} (${decoded.width}x${decoded.height})`);
    }
  } catch (err) {
    console.error(`  ERRORE su ${carId}:`, err.message);
  }
}

fs.rmSync(tempDir, { recursive: true, force: true });
fs.mkdirSync(path.dirname(outMapPath), { recursive: true });
fs.writeFileSync(outMapPath, JSON.stringify(carsIndex, null, 2), 'utf-8');
console.log(`\n[3/3] Completato! Mantenute ${kept} auto esistenti, aggiunte ${added} nuove auto (totale: ${Object.keys(carsIndex).length}).`);
