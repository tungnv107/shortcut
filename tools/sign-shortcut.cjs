// Uploads only the generated public workflow to Shortcuty's signing API.
// Does not read account credentials, Safari data, or user media.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'dist', 'Media-Saver.unsigned.shortcut');
const outputPath = path.join(root, 'dist', 'Media-Saver.shortcut');
const reportPath = path.join(root, 'artifacts', 'signing', 'verification.json');
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

async function main() {
  const source = fs.readFileSync(sourcePath);
  const form = new FormData();
  form.append('file', new Blob([source], { type: 'application/x-plist' }), 'Media-Saver.shortcut');
  const response = await fetch('https://sign.shortcuty.app/api/v1/sign?response=json', {
    method: 'POST', body: form, signal: AbortSignal.timeout(90000),
    headers: { 'User-Agent': `Media-Saver-iOS/${require('../package.json').version} (github.com/tungnv107/shortcut)` }
  });
  if (!response.ok) {
    const error = (await response.text()).slice(0, 600);
    throw new Error('Signing failed, HTTP ' + response.status + ': ' + error);
  }
  const result = await response.json();
  if (result.success !== true || !result.file || result.file.format !== 'AEA1' || result.file.signing_mode !== 'anyone') {
    throw new Error('Signing service returned an unexpected format or signing mode.');
  }
  const file = result.file;
  const signed = Buffer.from(file.content_base64 || '', 'base64');
  if (signed.length !== file.size || signed.length < 100 || signed.subarray(0, 4).toString('ascii') !== 'AEA1') {
    throw new Error('Signed file size/header validation failed.');
  }
  if (sha256(source) !== file.input_sha256 || sha256(signed) !== file.signed_sha256) {
    throw new Error('Signing input or output SHA256 does not match.');
  }
  fs.writeFileSync(outputPath, signed);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  const report = {
    checkedAt: new Date().toISOString(), signer: 'https://sign.shortcuty.app/api/v1/sign',
    signingMode: 'anyone', format: 'AEA1', inputSHA256: sha256(source), outputSHA256: sha256(signed),
    size: signed.length, source: 'dist/Media-Saver.unsigned.shortcut', output: 'dist/Media-Saver.shortcut',
    deviceImportTested: false, note: 'Validated file marker, size and service-reported hashes; not a device import or independent signature verification.'
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
