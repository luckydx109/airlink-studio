/**
 * AirLink Studio - Setup Binaries Helper
 * Downloads and extracts the official scrcpy win64 binary bundle into bin/scrcpy/
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const binDir = path.join(__dirname, '..', 'bin');
const targetDir = path.join(binDir, 'scrcpy');
const zipPath = path.join(binDir, 'scrcpy.zip');
const SCRCPY_URL = 'https://github.com/Genymobile/scrcpy/releases/download/v3.1/scrcpy-win64-v3.1.zip';

async function setup() {
  if (fs.existsSync(path.join(targetDir, 'scrcpy.exe')) && fs.existsSync(path.join(targetDir, 'adb.exe'))) {
    console.log('✓ scrcpy & ADB binaries are already set up in bin/scrcpy/');
    return;
  }

  console.log('Downloading scrcpy v3.1 standalone bundle...');
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  try {
    execSync(`curl.exe -L "${SCRCPY_URL}" -o "${zipPath}"`, { stdio: 'inherit' });
    console.log('Extracting archive...');
    execSync(`tar.exe -xf "${zipPath}" -C "${binDir}"`, { stdio: 'inherit' });
    
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }

    const extractedDir = path.join(binDir, 'scrcpy-win64-v3.1');
    if (fs.existsSync(extractedDir)) {
      if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true });
      }
      fs.renameSync(extractedDir, targetDir);
    }

    console.log('✓ Binaries successfully set up in bin/scrcpy/');
  } catch (err) {
    console.error('Failed to setup binaries automatically:', err.message);
    process.exit(1);
  }
}

setup();
