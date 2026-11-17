const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { runWorkflow } = require('./helpers/native-runner.cjs');
const workflow = JSON.parse(fs.readFileSync('dist/workflow.json','utf8'));
const tt = 'https://vm.tiktok.com/ZTest/';
const ig = 'https://www.instagram.com/p/Album_123/?igsh=test';
const fb = 'https://www.facebook.com/share/v/123/';
const media = n => `https://cdn.example.test/${n}`;
const fixture = name => JSON.parse(fs.readFileSync(`test/fixtures/${name}.json`,'utf8'));
async function run(input, response, options = {}) {
  return runWorkflow(workflow, { input, ...options, request: async (url,headers) => {
    const u = new URL(url);
    if (['www.tikwm.com','api.siputzx.my.id','vkrdownloader.org'].includes(u.hostname) && !u.pathname.includes('/video/')) {
      assert.equal(u.searchParams.get('url') ?? u.searchParams.get('vkr'), options.selected || input.match(/https:\/\/[^\s]+/)[0]);
      return response;
    }
    return { url, referer: headers.Referer };
  } });
}
test('share sheet accepts URLs and text and requires no companion app or Safari execution', () => {
  assert.ok(workflow.WFWorkflowTypes.includes('ActionExtension'));
  for (const c of ['WFURLContentItem','WFStringContentItem']) assert.ok(workflow.WFWorkflowInputContentItemClasses.includes(c));
  const ids=workflow.WFWorkflowActions.map(a=>a.WFWorkflowActionIdentifier);
  assert.ok(ids.every(id=>id.startsWith('is.workflow.actions.')));
  assert.ok(!ids.some(id=>/javascript|openurl|runworkflow|clipboard/i.test(id)));
  for (const a of workflow.WFWorkflowActions) {
    const check = v => {
      if (!v || typeof v !== 'object') return;
      if (v.WFSerializationType === 'WFTextTokenString') {
        for (const ref of Object.values(v.Value.attachmentsByRange || {})) assert.ok(['Variable','ActionOutput','ExtensionInput'].includes(ref.Type));
      }
      Object.values(v).forEach(check);
    };
    check(a.WFWorkflowActionParameters);
    if (a.WFWorkflowActionIdentifier.endsWith('.conditional') && a.WFWorkflowActionParameters.WFControlFlowMode===0) {
      assert.equal(a.WFWorkflowActionParameters.WFInput.Type,'Variable');
    }
  }
});
test('TikTok share text selects one HD video without cover/music/watermarked copies', async () => {
  const result=await run('Xem video này '+tt,{code:0,data:{hdplay:'/video/media/hdplay/123.mp4',play:media('sd.mp4'),wmplay:media('wm.mp4'),cover:media('cover.jpg'),music:media('music.mp3')}});
  assert.deepEqual(result.saved,[{url:'https://www.tikwm.com/video/media/hdplay/123.mp4',referer:'https://www.tikwm.com/'}]);
  assert.deepEqual(result.notifications,['Đã lưu 1 tệp vào Ảnh.']);
});
test('TikTok falls back to play when HD is absent',async()=>{
  const r=await run(tt,{code:0,data:{play:media('sd.mp4')}});
  assert.equal(r.saved[0].url,media('sd.mp4'));
});
test('TikTok real response shape preserves every photo in order',async()=>{
  const response=fixture('tikwm-photos');
  const r=await run(tt,response);
  assert.deepEqual(r.saved.map(x=>x.url),response.data.images);
  assert.equal(r.saved.length,16);
});
test('Instagram real carousel shape preserves every photo and excludes thumbs',async()=>{
  const response=fixture('instagram-photos');
  const r=await run(ig,response);
  assert.deepEqual(r.saved.map(x=>x.url),response.data.map(x=>x.url[0].url));
  assert.equal(r.saved.length,5);
});
test('Instagram real video album selects one variant per item, with mixed photos supported',async()=>{
  const response=fixture('instagram-videos');
  response.data[0].url.push({url:media('duplicate.mp4'),ext:'mp4'});
  response.data.push(fixture('instagram-photos').data[0]);
  const r=await run(ig,response);
  assert.deepEqual(r.saved.map(x=>x.url),response.data.map(x=>x.url[0].url));
  assert.equal(r.saved.length,4);
});
test('Facebook real response skips 4K-labelled JPG cover and duplicate video qualities',async()=>{
  const r=await run(fb,fixture('facebook-video'));
  assert.equal(r.saved.length,1);
  assert.equal(r.saved[0].url,'https://cdn.example.test/facebook-1.mp4');
  assert.equal(r.saved[0].referer,'https://www.facebook.com/');
});
test('Facebook thumbnail alone reports unsupported, without false success',async()=>{
  const r=await run(fb,{success:true,data:{downloads:[{ext:'jpg',url:media('cover.jpg')}]}});
  assert.equal(r.saved.length,0); assert.equal(r.notifications.length,0);
  assert.match(r.alerts[0],/chưa hỗ trợ ảnh/);
});
test('API failure or empty media stops without downloading anything',async()=>{
  for (const [url,response] of [[tt,{code:-1,msg:'Too many requests'}],[tt,{code:0,data:{}}],[ig,{status:false,error:'All nodes failed'}],[ig,{status:true,data:[]}],[fb,{success:false,error:{code:404}}]]) {
    const r=await run(url,response);
    assert.equal(r.saved.length,0); assert.equal(r.notifications.length,0); assert.equal(r.alerts.length,1);
    assert.equal(r.requests.length,1);
  }
});
test('spoofed hosts, credential URLs, non-HTTPS and unsupported input never reach provider',async()=>{
  for (const input of ['https://instagram.com.evil.test/p/123/','https://instagram.com@evil.test/p/123/','http://www.instagram.com/p/123/','https://evil.test/facebook.com/','not a link']) {
    const r=await run(input,{});
    assert.equal(r.requests.length,0); assert.equal(r.saved.length,0); assert.equal(r.alerts.length,1);
  }
});
test('Instagram profile and Stories rejected before provider request',async()=>{
  for (const input of ['https://www.instagram.com/demo/','https://www.instagram.com/stories/demo/123/']) {
    const r=await run(input,{}); assert.equal(r.requests.length,0); assert.equal(r.saved.length,0);
  }
});
test('invalid media late in album aborts before saving any earlier item',async()=>{
  for (const invalid of ['http://cdn.test/2.jpg','https://user:pass@cdn.test/2.jpg','https://cdn.test/master.m3u8?x=1','https://cdn.test/movie.mpd','//cdn.test/2.jpg','javascript:alert(1)']) {
    const r=await run(tt,{code:0,data:{images:[media('1.jpg'),invalid]}});
    assert.equal(r.saved.length,0); assert.equal(r.notifications.length,0); assert.equal(r.requests.length,1);
  }
});
test('malformed Instagram item aborts whole album before any save',async()=>{
  const response=fixture('instagram-photos'); response.data.push({thumb:media('cover.jpg')});
  const r=await run(ig,response); assert.equal(r.saved.length,0); assert.equal(r.notifications.length,0);
});
test('multiple shared URLs ask which post to download',async()=>{
  const r=await run(tt+'\n'+ig,fixture('instagram-photos'),{choose:items=>items[1],selected:ig});
  assert.equal(r.requests[0].url.startsWith('https://api.siputzx.my.id/'),true);
  assert.equal(r.saved.length,5);
});
test('starting without share input prompts for link, without reading clipboard',async()=>{
  const r=await run('',{code:0,data:{play:media('video.mp4')}},{prompt:tt,selected:tt});
  assert.equal(r.saved.length,1);
});
test('failed save never reaches the final success notification',async()=>{
  let attempted=0;
  await assert.rejects(run(tt,fixture('tikwm-photos'),{save:()=>{if(++attempted===2)throw new Error('Photos permission denied');}}),/Photos permission denied/);
  assert.equal(attempted,2);
});
