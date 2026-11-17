const fs = require('node:fs');
const path = require('node:path');
const { collectMedia, resolveMedia } = require('../src/collector.js');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist');
fs.mkdirSync(out, { recursive: true });
const javascript = collectMedia.toString() + '\n' + resolveMedia.toString() + '\nresolveMedia(document, location.href).then(completion).catch(error => {\n  completion({urls: [], notice: "Không đọc được trang: " + String(error.message || error)});\n});\n';
fs.writeFileSync(path.join(out, 'Safari-Media-Saver.js'), javascript);
fs.writeFileSync(path.join(out, 'Safari-Media-Saver.txt'), javascript);

const { buildNativeWorkflow } = require('../src/native-workflow.cjs');
const workflow = buildNativeWorkflow();
const escape = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function plist(value, depth = 0) {
  const p = '  '.repeat(depth);
  if (typeof value === 'string') return `${p}<string>${escape(value)}</string>`;
  if (typeof value === 'number') return `${p}<integer>${value}</integer>`;
  if (typeof value === 'boolean') return `${p}<${value}/>`;
  if (Array.isArray(value)) return `${p}<array>\n${value.map(v=>plist(v,depth+1)).join('\n')}\n${p}</array>`;
  return `${p}<dict>\n${Object.entries(value).map(([k,v])=>`${p}  <key>${escape(k)}</key>\n${plist(v,depth+1)}`).join('\n')}\n${p}</dict>`;
}
const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n' + plist(workflow, 1) + '\n</plist>\n';
fs.writeFileSync(path.join(out, 'Media-Saver.unsigned.shortcut'), xml);
fs.writeFileSync(path.join(out, 'workflow.json'), JSON.stringify(workflow, null, 2) + '\n');
fs.writeFileSync(path.join(out, 'legacy-workflow.json'), JSON.stringify(require('../src/legacy-workflow.cjs').buildNativeWorkflow(), null, 2) + '\n');
console.log(`Đã tạo JavaScript, TXT và Shortcut CHƯA KÝ (${workflow.WFWorkflowActions.length} tác vụ).`);
