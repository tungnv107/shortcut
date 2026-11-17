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
  const noMedia = 'Dịch vụ chưa lấy được media của bài này. Hãy dùng link của một bài công khai và thử lại sau. Bài riêng tư, Stories, livestream và bài yêu cầu đăng nhập không được hỗ trợ.';
  action('comment', 'Media Saver ' + version, { WFCommentActionText:
    'Media Saver ' + version + '\nFacebook/TikTok/Instagram → Chia sẻ → Thêm/Khác → Media Saver. Chỉ dùng Phím tắt. Link bài đăng được gửi tới TikWM (TikTok), Siputzx/SSSInstagram (Instagram) hoặc VKrDownloader (Facebook); không gửi cookie/mật khẩu. Facebook hiện hỗ trợ video, chưa hỗ trợ album ảnh. github.com/tungnv107/shortcut' });
  const shared = set('Input', { Type: 'ExtensionInput' });
  when(shared, 101, () => {
    const prompted = action('ask', 'Dán liên kết bài đăng', { WFAskActionPrompt: 'Dán link bài Facebook, Instagram hoặc TikTok. Bạn cũng có thể dùng Chia sẻ → Media Saver trong ứng dụng.', WFInputType: 'URL' });
    set('Input', prompted);
  });
  const links = action('detect.link', 'Liên kết được chia sẻ', { WFInput: token(shared) });
  clear('SupportedLinks');
  each(links, item => {
    const valid = match(item, inputPattern);
    when(valid, 100, () => append('SupportedLinks', item));
  });
  const supported = variable('SupportedLinks');
  requireValue(supported, 'Chưa nhận được link HTTPS của Facebook, Instagram hoặc TikTok. Trong ứng dụng, mở một bài → Chia sẻ → Thêm/Khác → Media Saver.');
  when(count(supported), 2, () => {
    const chosen = action('choosefromlist', 'Chọn bài đăng', { WFInput: token(supported), WFChooseFromListActionPrompt: 'Chọn một bài để tải', WFChooseFromListActionSelectMultiple: false });
    set('PostURL', chosen);
  }, () => set('PostURL', first(supported)), 1);
  const post = variable('PostURL');
  const encoded = action('urlencode', 'Mã hóa liên kết', { WFInput: text(post), WFEncodeMode: 'Encode' });
  const host = action('geturlcomponent', 'Tên miền bài đăng', { WFURL: text(post), WFURLComponent: 'Host' });
  clear('MediaURLs');
  clear('SavedURLs');

  when(match(host, '(^|\\.)tiktok\\.com$'), 100, () => {
    set('Referer', asText('https://www.tikwm.com/'));
    const apiURL = asText(text('https://www.tikwm.com/api/?hd=1&url=', encoded));
    const response = download(apiURL);
    const code = asText(get(response, 'code'));
    when(code, 5, () => stop(noMedia), undefined, '0');
    const data = get(response, 'data');
    requireValue(data, noMedia);
    const images = get(data, 'images');
    when(images, 100, () => set('MediaURLs', images), () => {
      const hd = get(data, 'hdplay');
      when(hd, 100, () => set('MediaURLs', hd), () => set('MediaURLs', get(data, 'play')));
    });
  }, () => {
    when(match(host, '(^|\\.)instagram\\.com$'), 100, () => {
      const igPost = match(post, '^https://(?:www\\.)?instagram\\.com/(?:p|reel|reels|tv)/[A-Za-z0-9_-]+(?:/|[?#]|$)');
      requireValue(igPost, 'Hãy chia sẻ link bài đăng hoặc Reel Instagram. Bản này chưa hỗ trợ Stories, trang cá nhân hoặc link /share/.');
      set('Referer', asText('https://sssinstagram.com/'));
      const apiURL = asText(text('https://api.siputzx.my.id/api/d/sssinstagram?url=', encoded));
      const response = download(apiURL);
      const error = get(response, 'error');
      when(error, 100, () => stop(noMedia));
      const items = get(response, 'data');
      requireValue(items, noMedia);
      each(items, item => {
        const variants = get(item, 'url');
        requireValue(variants, noMedia);
        const variant = first(variants);
        const extension = get(variant, 'ext');
        requireValue(match(extension, '^(mp4|jpg|jpeg|png|webp|heic)$'), 'Dịch vụ trả về định dạng chưa được hỗ trợ. Chưa lưu media nào.');
        const url = get(variant, 'url');
        requireValue(url, noMedia);
        append('MediaURLs', url);
      });
    }, () => {
      set('Referer', asText('https://www.facebook.com/'));
      const apiURL = asText(text('https://vkrdownloader.org/server/?api_key=vkrdownloader&vkr=', encoded));
      const response = download(apiURL);
      const error = get(response, 'error');
      when(error, 100, () => stop(noMedia + '\nFacebook hiện chỉ hỗ trợ video; chưa tải album ảnh.'));
      const data = get(response, 'data');
      requireValue(data, noMedia);
      const formats = get(data, 'downloads');
      requireValue(formats, noMedia);
      // VKR mixes thumbnails with video qualities. Keep one MP4 only.
      each(formats, format => {
        const extension = asText(get(format, 'ext'));
        when(extension, 4, () => {
          when(variable('MediaURLs'), 101, () => set('MediaURLs', get(format, 'url')));
        }, undefined, 'mp4');
      });
    });
  });

  const urls = variable('MediaURLs');
  requireValue(urls, 'Không tìm thấy tệp ảnh/video tải được. Facebook hiện chỉ hỗ trợ video; chưa hỗ trợ ảnh hoặc album. Không lưu ảnh bìa thay cho video.');
  clear('ValidatedURLs');
  each(urls, item => {
    set('CandidateURL', item);
    when(match(host, '(^|\\.)tiktok\\.com$'), 100, () => {
      const normalized = action('text.replace', 'URL TikWM đầy đủ', { WFInput: text(item), WFReplaceTextFind: '^/(?!/)', WFReplaceTextReplace: 'https://www.tikwm.com/', WFReplaceTextRegularExpression: true, WFReplaceTextCaseSensitive: true });
      set('CandidateURL', normalized);
    });
    const candidate = variable('CandidateURL');
    requireValue(match(candidate, mediaPattern), 'Dịch vụ trả về URL media không hợp lệ hoặc luồng chưa hỗ trợ. Chưa lưu media nào.');
    append('ValidatedURLs', candidate);
  });
  each(variable('ValidatedURLs'), item => {
    const file = download(item, variable('Referer'));
    action('savetocameraroll', 'Lưu vào Ảnh', { WFInput: token(file), WFCameraRollSelectedGroup: 'Recents' });
    append('SavedURLs', item);
  });
  const saved = count(variable('SavedURLs'));
  action('notification', 'Đã lưu media', { WFNotificationActionTitle: 'Media Saver', WFNotificationActionBody: text('Đã lưu ', saved, ' tệp vào Ảnh.'), WFNotificationActionSound: false });

  return {
    WFWorkflowName: 'Media Saver', WFWorkflowClientVersion: '3036.0.4', WFWorkflowClientRelease: '18.0',
    WFWorkflowMinimumClientVersion: 900, WFWorkflowMinimumClientVersionString: '900',
    WFWorkflowIcon: { WFWorkflowIconStartColor: 4282601983, WFWorkflowIconGlyphNumber: 59511 },
    WFWorkflowTypes: ['ActionExtension'],
    WFWorkflowInputContentItemClasses: ['WFURLContentItem', 'WFStringContentItem', 'WFSafariWebPageContentItem'],
    WFWorkflowHasOutputFallback: false, WFWorkflowImportQuestions: [], WFWorkflowActions: actions,
  };
}
module.exports = { buildNativeWorkflow, inputPattern, mediaPattern };
