const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { collectMedia, resolveMedia } = require('../src/collector.js');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist');
fs.mkdirSync(out, { recursive: true });
const javascript = collectMedia.toString() + '\n' + resolveMedia.toString() + '\nresolveMedia(document, location.href).then(completion).catch(error => {\n  completion({urls: [], notice: "Không đọc được trang: " + String(error.message || error)});\n});\n';
fs.writeFileSync(path.join(out, 'Safari-Media-Saver.js'), javascript);
fs.writeFileSync(path.join(out, 'Safari-Media-Saver.txt'), javascript);

function uuid(name) {
  const h = crypto.createHash('sha256').update('media-saver-ios:' + name).digest('hex');
  return [h.slice(0,8),h.slice(8,12),'4'+h.slice(13,16),'a'+h.slice(17,20),h.slice(20,32)].join('-').toUpperCase();
}
const actions = [];
function action(id, name, parameters = {}) {
  const outputID = uuid(name);
  actions.push({ WFWorkflowActionIdentifier: 'is.workflow.actions.' + id, WFWorkflowActionParameters: { ...parameters, UUID: outputID } });
  return { Type: 'ActionOutput', OutputUUID: outputID, OutputName: name };
}
function token(value) { return { Value: value, WFSerializationType: 'WFTextTokenAttachment' }; }
function textToken(value) { return { Value: { string: '\uFFFC', attachmentsByRange: { '{0, 1}': value } }, WFSerializationType: 'WFTextTokenString' }; }
function dictItem(key, value) {
  return { WFItemType: 0, WFKey: { Value: { string: key }, WFSerializationType: 'WFTextTokenString' }, WFValue: value };
}
function getKey(key, from) {
  return action('getvalueforkey', 'Lấy ' + key, { WFInput: token(from), WFGetDictionaryValueType: 'Value', WFDictionaryKey: key });
}

action('comment', 'Hướng dẫn', { WFCommentActionText: 'Mở riêng bài đăng Facebook/Instagram/TikTok trong Safari → Chia sẻ → Media Saver. Chỉ tải tệp mà trang cung cấp; không ghép HLS/DASH, không quét trang cá nhân. Đọc hướng dẫn và giới hạn tại github.com/tungnv107/shortcut.' });
const result = action('runjavascriptonwebpage', 'Kết quả JavaScript', { WFJavaScript: javascript, WFInput: token({ Type: 'ExtensionInput' }) });
const notice = getKey('notice', result);
action('alert', 'Thông tin media', { WFAlertActionTitle: 'Media Saver', WFAlertActionMessage: textToken(notice), WFAlertActionCancelButtonShown: true });
const referrer = getKey('pageURL', result);
const urls = getKey('urls', result);
const repeat = uuid('Vòng lặp');
action('repeat.each', 'Lặp từng media', { WFInput: token(urls), GroupingIdentifier: repeat, WFControlFlowMode: 0 });
const file = action('downloadurl', 'Tệp tải về', {
  WFURL: textToken({ Type: 'Variable', VariableName: 'Repeat Item' }),
  WFHTTPMethod: 'GET',
  WFHTTPHeaders: { Value: { WFDictionaryFieldValueItems: [dictItem('Referer', textToken(referrer))] }, WFSerializationType: 'WFDictionaryFieldValue' }
});
action('savetocameraroll', 'Lưu vào Ảnh', { WFInput: token(file), WFCameraRollSelectedGroup: 'Recents' });
action('repeat.each', 'Kết thúc lặp', { GroupingIdentifier: repeat, WFControlFlowMode: 2 });

const workflow = {
  WFWorkflowName: 'Media Saver', WFWorkflowClientVersion: '3036.0.4', WFWorkflowClientRelease: '18.0',
  WFWorkflowMinimumClientVersion: 900, WFWorkflowMinimumClientVersionString: '900',
  WFWorkflowIcon: { WFWorkflowIconStartColor: 4282601983, WFWorkflowIconGlyphNumber: 59511 },
  WFWorkflowTypes: ['ActionExtension'], WFWorkflowInputContentItemClasses: ['WFSafariWebPageContentItem'],
  WFWorkflowHasOutputFallback: false, WFWorkflowImportQuestions: [], WFWorkflowActions: actions,
};
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
console.log(`Đã tạo JavaScript, TXT và Shortcut CHƯA KÝ (${actions.length} tác vụ).`);
