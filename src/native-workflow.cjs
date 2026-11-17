// Native Shortcuts actions only. No JavaScript execution or companion iOS app.
const crypto = require('node:crypto');
const version = require('../package.json').version;
const inputPattern = '^https://(?:(?:[a-z0-9-]+\\.)?(?:facebook\\.com|fb\\.com|fb\\.watch|instagram\\.com|tiktok\\.com))/[^\\s]+$';
const mediaPattern = '^https://[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?/(?![^?#]*\\.(?:m3u8|mpd)(?:[?#]|$))[^\\s]*$';

function buildNativeWorkflow() {
  const actions = [];
  const uuid = name => {
    const h = crypto.createHash('sha256').update('media-saver-native:' + name).digest('hex');
    return [h.slice(0,8),h.slice(8,12),'4'+h.slice(13,16),'a'+h.slice(17,20),h.slice(20,32)].join('-').toUpperCase();
  };
  const variable = name => ({ Type: 'Variable', VariableName: name });
  const token = value => ({ Value: value, WFSerializationType: 'WFTextTokenAttachment' });
  function text(...parts) {
    let string = ''; const attachmentsByRange = {};
    for (const part of parts) {
      if (typeof part === 'string') string += part;
      else { attachmentsByRange[`{${string.length}, 1}`] = part; string += '\uFFFC'; }
    }
    return { Value: { string, attachmentsByRange }, WFSerializationType: 'WFTextTokenString' };
  }
  function action(id, name, parameters = {}) {
    const UUID = uuid(actions.length + ':' + name);
    actions.push({ WFWorkflowActionIdentifier: 'is.workflow.actions.' + id,
      WFWorkflowActionParameters: { ...parameters, CustomOutputName: name, UUID } });
    return { Type: 'ActionOutput', OutputUUID: UUID, OutputName: name };
  }
  const asText = (value, name = 'Văn bản') => action('gettext', name, { WFTextActionText:
    typeof value === 'string' || value.WFSerializationType === 'WFTextTokenString' ? value : text(value) });
  const set = (name, value) => {
    action('setvariable', 'Đặt ' + name, { WFVariableName: name, WFInput: token(value) });
    return variable(name);
  };
  const clear = name => set(name, action('nothing', 'Xóa giá trị ' + name));
  const append = (name, value) => action('appendvariable', 'Thêm vào ' + name, { WFVariableName: name, WFInput: token(value) });
  const get = (from, key) => action('getvalueforkey', 'Lấy ' + key, { WFInput: token(from), WFDictionaryKey: key, WFGetDictionaryValueType: 'Value' });
  const first = from => action('getitemfromlist', 'Mục đầu tiên', { WFInput: token(from), WFItemSpecifier: 'First Item' });
  const match = (from, pattern) => action('text.match', 'Khớp văn bản', { text: text(from), WFMatchTextPattern: pattern, WFMatchTextCaseSensitive: false });
  const count = from => action('count', 'Số lượng', { Input: token(from), WFCountType: 'Items' });
  function when(from, condition, yes, no, comparison) {
    const group = uuid('if:' + actions.length);
    const p = { GroupingIdentifier: group, WFControlFlowMode: 0, WFCondition: condition,
      WFInput: { Type: 'Variable', Variable: token(from) } };
    if (comparison !== undefined) p[typeof comparison === 'number' ? 'WFNumberValue' : 'WFConditionalActionString'] = comparison;
    action('conditional', 'Nếu', p); yes();
    if (no) { action('conditional', 'Nếu không', { GroupingIdentifier: group, WFControlFlowMode: 1 }); no(); }
    action('conditional', 'Kết thúc nếu', { GroupingIdentifier: group, WFControlFlowMode: 2 });
  }
  function each(from, callback) {
    const group = uuid('repeat:' + actions.length);
    action('repeat.each', 'Lặp từng mục', { WFInput: token(from), GroupingIdentifier: group, WFControlFlowMode: 0 });
    callback(variable('Repeat Item'));
    action('repeat.each', 'Kết thúc lặp', { GroupingIdentifier: group, WFControlFlowMode: 2 });
  }
  function stop(message) {
    action('alert', 'Không tải được', { WFAlertActionTitle: 'Media Saver', WFAlertActionMessage: message, WFAlertActionCancelButtonShown: false });
    action('exit', 'Dừng phím tắt');
  }
  const requireValue = (value, message) => when(value, 101, () => stop(message));
  function download(url, referer) {
    const p = { WFURL: typeof url === 'string' ? url : text(url), WFHTTPMethod: 'GET' };
    if (referer) p.WFHTTPHeaders = { Value: { WFDictionaryFieldValueItems: [{ WFItemType: 0,
      WFKey: text('Referer'), WFValue: typeof referer === 'string' ? text(referer) : text(referer) }] }, WFSerializationType: 'WFDictionaryFieldValue' };
    return action('downloadurl', 'Nội dung URL', p);
  }
  action('comment', 'Media Saver VPS '+version, {WFCommentActionText:'Chia sẻ bài đăng → Media Saver. VPS tải và xử lý media; iPhone lưu vào Ảnh. Cấu hình một lần bằng mã truy cập riêng. Máy chủ giữ tệp tạm trong một giờ.'});
  const base=asText('https://media-saver.161.118.222.102.sslip.io','Địa chỉ VPS');
  const key=asText('DAN_MA_TRUY_CAP','Mã truy cập VPS');
  requireValue(match(key,'^[a-f0-9]{64}$'),'Chưa cấu hình mã truy cập. Mở trang cài Media Saver của bạn, sao chép mã và dán vào ô Mã truy cập VPS trong phím tắt.');
  const dict=items=>({Value:{WFDictionaryFieldValueItems:Object.entries(items).map(([k,v])=>({WFItemType:0,WFKey:text(k),WFValue:typeof v==='string'?text(v):text(v)}))},WFSerializationType:'WFDictionaryFieldValue'});
  function api(url,body) {
    const p={WFURL:text(url),WFHTTPMethod:body?'POST':'GET',WFHTTPHeaders:{Value:{WFDictionaryFieldValueItems:[{WFItemType:0,WFKey:text('Authorization'),WFValue:text('Bearer ',key)}]},WFSerializationType:'WFDictionaryFieldValue'}};
    if(body){p.WFHTTPBodyType='JSON';p.WFJSONValues=dict(body);}
    return action('downloadurl',body?'Gửi bài tới VPS':'Lấy dữ liệu từ VPS',p);
  }
  const shared=set('Input',{Type:'ExtensionInput'});
  when(shared,101,()=>set('Input',action('ask','Dán liên kết',{WFAskActionPrompt:'Dán link bài Facebook, Instagram hoặc TikTok',WFInputType:'URL'})));
  const links=action('detect.link','Liên kết được chia sẻ',{WFInput:text(shared)});
  requireValue(links,'Ứng dụng chưa gửi liên kết. Hãy chia sẻ liên kết của bài đăng.');
  when(count(links),2,()=>set('PostURL',action('choosefromlist','Chọn bài',{WFInput:token(links),WFChooseFromListActionPrompt:'Chọn một bài để tải',WFChooseFromListActionSelectMultiple:false})),()=>set('PostURL',first(links)),1);
  const post=variable('PostURL');
  requireValue(match(post,inputPattern),'Chỉ nhận link HTTPS của Facebook, Instagram hoặc TikTok.');
  const created=api(asText(text(base,'/v1/jobs')),{url:post});
  const createError=get(created,'error');when(createError,100,()=>stop(text(createError)));
  const job=get(created,'id');requireValue(match(job,'^[a-f0-9]{32}$'),'VPS không tạo được tác vụ tải. Kiểm tra mã truy cập và kết nối.');
  const jobURL=asText(text(base,'/v1/jobs/',job));
  const group=uuid('poll');
  action('repeat.count','Chờ VPS xử lý',{GroupingIdentifier:group,WFControlFlowMode:0,WFRepeatCount:60});
  const state=api(jobURL);
  const stateError=get(state,'error');when(stateError,100,()=>stop(text(stateError)));
  const status=asText(get(state,'status'));
  when(status,4,()=>stop(text(get(state,'message'))),undefined,'failed');
  when(match(status,'^(ready|partial)$'),100,()=>{
    const files=get(state,'files');requireValue(files,'VPS chưa trả về tệp media.');
    when(status,4,()=>action('alert','Kết quả một phần',{WFAlertActionTitle:'Media Saver',WFAlertActionMessage:text(get(state,'message')),WFAlertActionCancelButtonShown:true}),undefined,'partial');
    each(files,item=>{
      const id=get(item,'id');requireValue(match(id,'^[a-f0-9]{32}$'),'Mã tệp trả về không hợp lệ.');
      const file=api(asText(text(base,'/v1/files/',job,'/',id)));
      action('savetocameraroll','Lưu vào Ảnh',{WFInput:token(file),WFCameraRollSelectedGroup:'Recents'});
    });
    action('notification','Đã lưu media',{WFNotificationActionTitle:'Media Saver',WFNotificationActionBody:text('Đã lưu ',count(files),' tệp vào Ảnh.'),WFNotificationActionSound:false});
    action('exit','Hoàn tất');
  });
  action('delay','Đợi hai giây',{WFDelayTime:2});
  action('repeat.count','Kết thúc chờ',{GroupingIdentifier:group,WFControlFlowMode:2});
  stop('VPS vẫn đang xử lý. Đợi một lát rồi chia sẻ lại cùng bài; máy chủ sẽ tiếp tục tác vụ cũ.');

  return {
    WFWorkflowName: 'Media Saver', WFWorkflowClientVersion: '3036.0.4', WFWorkflowClientRelease: '18.0',
    WFWorkflowMinimumClientVersion: 900, WFWorkflowMinimumClientVersionString: '900',
    WFWorkflowIcon: { WFWorkflowIconStartColor: 4282601983, WFWorkflowIconGlyphNumber: 59511 },
    WFWorkflowTypes: ['ActionExtension'],
    WFWorkflowInputContentItemClasses: ['WFURLContentItem', 'WFStringContentItem', 'WFSafariWebPageContentItem'],
    WFWorkflowHasOutputFallback: false, WFWorkflowImportQuestions: [{ Category: 'Parameter', ActionIndex: 2, ParameterKey: 'WFTextActionText', Text: 'Dán mã truy cập được cấp trên trang cài Media Saver của bạn.', DefaultValue: '' }], WFWorkflowActions: actions,
  };
}
module.exports = { buildNativeWorkflow, inputPattern, mediaPattern };
