const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { collectMedia, resolveMedia } = require('../src/collector.js');
const ig = 'https://www.instagram.com/p/Abc_123/';
const tt = 'https://www.tiktok.com/@demo/photo/1234567890123456789';
const fb = 'https://www.facebook.com/demo/posts/123456789';
const image = name => 'https://cdn.example.com/' + name + '.jpg';
const video = name => 'https://cdn.example.com/' + name + '.mp4';
const node = (attributes = {}, selectors = {}, extra = {}) => ({
  getAttribute: key => attributes[key] || '', querySelectorAll: s => selectors[s] || [], ...extra
});
function doc(data = [], metadata = {}, articles = []) {
  return {
    querySelectorAll: selector => selector === 'script' ? data.map(x => ({textContent: typeof x === 'string' ? x : JSON.stringify(x)})) :
      selector === 'article, [role="article"]' ? articles : [],
    querySelector: selector => {
      const key = (selector.match(/^meta\[property="(.*)"\]$/) || [])[1];
      return key && metadata[key] ? node({content: metadata[key]}) : null;
    }
  };
}

test('Instagram carousel: preserve order, choose largest image, skip video cover and other posts', () => {
  const post = {shortcode:'Abc_123', carousel_media_count:3, carousel_media:[
    {id:'1', image_versions2:{candidates:[{url:image('small'),width:100,height:100},{url:image('large'),width:1000,height:1000}]}},
    {id:'2', media_type:2, video_versions:[{url:video('clip'),width:1080,height:1920}], display_url:image('cover')},
    {id:'3', display_url:image('last')}
  ]};
  const result = collectMedia(doc([{items:[post,{shortcode:'other',display_url:image('unrelated')}]}]), ig);
  assert.deepEqual(result.urls, [image('large'),video('clip'),image('last')]);
  assert.equal(result.expected,3);
  assert.equal(result.complete,false);
});
test('Instagram GraphQL sidecar and display resources', () => {
  const result = collectMedia(doc([{shortcode:'Abc_123',edge_sidecar_to_children:{count:2,edges:[
    {node:{id:'1',display_resources:[{src:image('a'),config_width:1080,config_height:1080}]}},
    {node:{id:'2',__typename:'GraphVideo',video_url:video('b')}}
  ]}}]),ig);
  assert.deepEqual(result.urls,[image('a'),video('b')]);
});
test('Instagram missing video never becomes its cover photo', () => {
  const result = collectMedia(doc([{shortcode:'Abc_123',is_video:true,display_url:image('cover')}],{'og:url':ig,'og:image':image('cover')}),ig);
  assert.deepEqual(result.urls,[]);
  assert.match(result.notice,/video/);
});
test('Instagram partial carousel reports missing items', () => {
  const r = collectMedia(doc([{shortcode:'Abc_123',carousel_media_count:4,carousel_media:[{id:'1',display_url:image('a')}]}]),ig);
  assert.match(r.notice,/1\/4/);
});
test('TikTok imagePost: all images, no music or author avatar', () => {
  const r = collectMedia(doc([{__DEFAULT_SCOPE__:{'webapp.video-detail':{itemInfo:{itemStruct:{
    id:'1234567890123456789', imagePost:{images:[{imageURL:{urlList:[image('1'),image('1mirror')]}},{imageURL:{urlList:[image('2')]}}]},
    music:{playUrl:video('music')},author:{avatarLarger:image('avatar')}
  }}}}}]),tt);
  assert.deepEqual(r.urls,[image('1'),image('2')]);
});
test('TikTok video accepts downloadable URL and preserves signed query', () => {
  const signed = video('clip')+'?token=abc&expires=99';
  const r = collectMedia(doc([{id:'1234567890123456789',video:{playAddr:signed,downloadAddr:video('alt')}}]),tt.replace('/photo/','/video/'));
  assert.deepEqual(r.urls,[signed]);
});
test('TikTok playAddr array of src', () => {
  const r = collectMedia(doc([{id:'1234567890123456789',video:{playAddr:[{src:video('clip')}]}}]),tt);
  assert.deepEqual(r.urls,[video('clip')]);
});
test('Facebook attached photos and video, excluding actor and recommendation', () => {
  const r = collectMedia(doc([{data:{node:{id:'123456789',attachments:[
    {media:{__typename:'Photo',id:'p1',image:{uri:image('1'),width:1000,height:1000}}},
    {media:{__typename:'Video',id:'v1',browser_native_hd_url:video('hd'),browser_native_sd_url:video('sd')}},
    {media:{__typename:'Photo',id:'p2',image:{uri:image('2')}}}
  ],actors:[{__typename:'Photo',image:{uri:image('avatar')}}],recommendations:[{__typename:'Photo',image:{uri:image('rec')}}]}}}]),fb);
  assert.deepEqual(r.urls,[image('1'),video('hd'),image('2')]);
});
test('Facebook nested progressive video delivery', () => {
  const r = collectMedia(doc([{id:'123456789',__typename:'Video',videoDelivery:{progressive_urls:[{progressive_url:video('clip')} ]}}]),fb);
  assert.deepEqual(r.urls,[video('clip')]);
});
test('Facebook matches opaque post ID through permalink', () => {
  const r = collectMedia(doc([{id:'opaque',permalink_url:fb,attachments:[{media:{__typename:'Photo',id:'1',image:{uri:image('1')}}}]}]),fb);
  assert.deepEqual(r.urls,[image('1')]);
});
test('Facebook photo permalink fbid', () => {
  const r = collectMedia(doc([{id:'111',__typename:'Photo',image:{uri:image('photo')}}]),'https://www.facebook.com/photo.php?fbid=111');
  assert.deepEqual(r.urls,[image('photo')]);
});
test('deduplicates repeated hydration copies and media URLs', () => {
  const p={shortcode:'Abc_123',display_url:image('1')};
  assert.deepEqual(collectMedia(doc([p,p]),ig).urls,[image('1')]);
});
test('rejects unsupported hosts, lookalikes, profiles, login pages and unresolved shortlinks', () => {
  for(const url of ['https://example.com/p/Abc_123/','https://instagram.com.evil.test/p/Abc_123/','https://www.instagram.com/demo/','https://www.instagram.com/accounts/login/?next=/p/Abc_123/','https://vm.tiktok.com/XYZ/']) {
    assert.deepEqual(collectMedia(doc([{shortcode:'Abc_123',display_url:image('1')}]),url).urls,[]);
  }
});
test('rejects blob, javascript, data, HTTP, credential URLs and stream manifests', () => {
  for (const url of ['blob:https://instagram.com/abc','javascript:alert(1)','data:image/png;base64,AA','http://cdn.example.com/a.mp4','https://u:p@cdn.example.com/a.mp4','https://cdn.example.com/master.m3u8','https://cdn.example.com/a.mpd?x=1']) {
    assert.deepEqual(collectMedia(doc([{shortcode:'Abc_123',video_url:url}]),ig).urls,[]);
  }
});
test('malformed and executable script text ignored without eval', () => {
  assert.deepEqual(collectMedia(doc(['{bad json','globalThis.secret = 5;']),ig).urls,[]);
});
test('DOM single article fallback avoids small/profile images', () => {
  const a = node({}, {'img':[
    node({src:image('photo')},{},{naturalWidth:1080,naturalHeight:1080}),
    node({src:image('small')},{},{naturalWidth:100,naturalHeight:100}),
    node({src:image('avatar'),alt:'Profile picture'},{},{naturalWidth:500,naturalHeight:500})
  ]});
  const r=collectMedia(doc([],{},[a]),ig);
  assert.deepEqual(r.urls,[image('photo')]);
  assert.match(r.notice,/có thể thiếu/);
});
test('ambiguous multiple DOM articles do not download a feed', () => {
  const a = node({}, {'img':[node({src:image('wrong')},{},{naturalWidth:1080,naturalHeight:1080})]});
  assert.deepEqual(collectMedia(doc([],{},[a,a]),ig).urls,[]);
});
test('blob DOM video never falls back to cover image', () => {
  const a = node({}, {'video':[node({src:'blob:https://www.instagram.com/abc'})], 'img':[node({src:image('cover')},{},{naturalWidth:1080,naturalHeight:1080})]});
  const r=collectMedia(doc([],{'og:url':ig,'og:image':image('cover')},[a]),ig);
  assert.deepEqual(r.urls,[]);
});
test('matching OpenGraph fallback with warning; mismatched metadata ignored', () => {
  assert.deepEqual(collectMedia(doc([],{'og:url':ig,'og:image':image('photo')}),ig).urls,[image('photo')]);
  assert.deepEqual(collectMedia(doc([],{'og:url':'https://www.instagram.com/p/OTHER/','og:image':image('wrong')}),ig).urls,[]);
});
test('large JSON has a bounded failure, never claims completion', () => {
  const r=collectMedia(doc(['['+' '.repeat(12000001)+']']),ig);
  assert.deepEqual(r.urls,[]);
  assert.match(r.notice,/quá nhiều/);
  assert.equal(r.complete,false);
});
test('generated Safari script calls completion exactly once with serializable output', async () => {
  const source = fs.readFileSync('dist/Safari-Media-Saver.js','utf8');
  const calls=[];
  await vm.runInNewContext(source,{URL,document:doc([{shortcode:'Abc_123',display_url:image('1')}]),location:{href:ig},completion:r=>calls.push(JSON.parse(JSON.stringify(r)))},{timeout:4000});
  assert.equal(calls.length,1);
  assert.deepEqual(calls[0].urls,[image('1')]);
});
test('Instagram same-origin endpoint recovers a full carousel and uses exact 64-bit ID', async () => {
  const url='https://www.instagram.com/p/BQ0eAlwhDrw/';
  let requested;
  const result=await resolveMedia(doc([],{'og:url':url,'og:image':image('cover')}),url,async (endpoint,options)=>{
    requested={endpoint,options};
    return {ok:true,json:async()=>({items:[{pk:'1455920561485265648',carousel_media:[{id:'1',display_url:image('1')},{id:'2',display_url:image('2')}]}]})};
  });
  assert.equal(requested.endpoint,'https://www.instagram.com/api/v1/media/1455920561485265648/info/');
  assert.equal(requested.options.credentials,'same-origin');
  assert.deepEqual(result.urls,[image('1'),image('2')]);
});
test('Instagram API failures preserve partial results, without claiming all media', async () => {
  for(const request of [async()=>({ok:false}),async()=>{throw new Error('network')},async()=>({ok:true,json:async()=>{throw new Error('HTML login')}})]) {
    const r=await resolveMedia(doc([],{'og:url':ig,'og:image':image('cover')}),ig,request);
    assert.deepEqual(r.urls,[image('cover')]);
    assert.equal(r.complete,false);
  }
});
test('Instagram API cannot inject media from a different post',async()=>{
  const r=await resolveMedia(doc(),ig,async()=>({ok:true,json:async()=>({items:[{pk:'1',code:'OTHER',display_url:image('wrong')}]})}));
  assert.deepEqual(r.urls,[]);
});
test('generated workflow wires every output to an earlier action and closes loop', () => {
  const flow=JSON.parse(fs.readFileSync('dist/workflow.json','utf8'));
  const seen=new Set(); const groups=[];
  for(const action of flow.WFWorkflowActions) {
    const p=action.WFWorkflowActionParameters;
    function check(v) {
      if(!v || typeof v!=='object') return;
      if(v.Type==='ActionOutput') assert.ok(seen.has(v.OutputUUID),'dangling action reference');
      Object.values(v).forEach(check);
    }
    check(p);
    if(p.WFControlFlowMode===0) groups.push(p.GroupingIdentifier);
    if(p.WFControlFlowMode===2) assert.equal(groups.pop(),p.GroupingIdentifier);
    assert.ok(!seen.has(p.UUID)); seen.add(p.UUID);
  }
  assert.equal(groups.length,0);
  assert.deepEqual(flow.WFWorkflowInputContentItemClasses,['WFURLContentItem','WFStringContentItem','WFSafariWebPageContentItem']);
  assert.equal(flow.WFWorkflowActions.filter(a=>a.WFWorkflowActionIdentifier.endsWith('.savetocameraroll')).length,1);
});
