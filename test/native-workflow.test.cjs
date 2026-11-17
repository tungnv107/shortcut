const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {runWorkflow}=require('./helpers/native-runner.cjs');
const source=JSON.parse(fs.readFileSync('dist/workflow.json','utf8'));
const token='a'.repeat(64),job='b'.repeat(32),file='c'.repeat(32),post='https://www.instagram.com/p/Example/';
function configured(){const w=structuredClone(source);w.WFWorkflowActions[2].WFWorkflowActionParameters.WFTextActionText=token;return w;}
const labels=(ids)=>ids.map((_,i)=>`${i+1} · ${i%2?'Video':'Ảnh'} · 1.25 MB`).join('\n');
test('VPS shortcut has one private token setup question; no token in published workflow',()=>{
 assert.equal(source.WFWorkflowImportQuestions.length,1);assert.equal(source.WFWorkflowImportQuestions[0].ActionIndex,2);
 assert.equal(source.WFWorkflowActions[2].WFWorkflowActionParameters.WFTextActionText,'DAN_MA_TRUY_CAP');
 assert.ok(!JSON.stringify(source).includes('tikwm.com'));
 const getURLs=source.WFWorkflowActions.find(a=>a.WFWorkflowActionIdentifier.endsWith('.detect.link'));
 assert.equal(getURLs.WFWorkflowActionParameters.WFInput.WFSerializationType,'WFTextTokenString');
});
test('native share submits authenticated job, polls, downloads only from own server and saves',async()=>{
 let polls=0;const result=await runWorkflow(configured(),{input:post,request:async(url,headers,method,body)=>{
   assert.equal(headers.Authorization,'Bearer '+token);
   assert.equal(new URL(url).hostname,'media-saver.161.118.222.102.sslip.io');
   if(method==='POST'){assert.deepEqual(body,{url:post});return {id:job};}
   if(url.includes('/v1/files/')){assert.ok(url.endsWith('/'+job+'/'+file));return 'media-file';}
   return ++polls===1?{status:'running'}:{status:'ready',fileIds:file,files:[{id:file}]};
 }});
 assert.deepEqual(result.saved,['media-file']);assert.equal(polls,2);assert.equal(result.notifications.length,1);
});
test('server failure never saves media; arbitrary file id cannot exfiltrate the bearer token',async()=>{
 for(const response of [{status:'failed',message:'Login needed'},{status:'ready',fileIds:'https://evil.test/',files:[{id:'https://evil.test/'}]}]){
  const r=await runWorkflow(configured(),{input:post,request:async(url,h,method)=>method==='POST'?{id:job}:response});
  assert.equal(r.saved.length,0);assert.equal(r.alerts.length,1);assert.equal(r.requests.length,2);
 }
});
test('five- and eight-file albums use an explicit cursor and retain every file in order',async()=>{
 for(const length of [1,5,8,100]){
  const ids=Array.from({length},(_,i)=>(i+1).toString(16).padStart(32,'0'));
  const result=await runWorkflow(configured(),{input:post,request:async(url,headers,method)=>{
    if(method==='POST')return {id:job};
    if(url.includes('/v1/files/'))return url.split('/').at(-1);
    // Ignore metadata dictionaries entirely, including invalid/missing id properties.
    return {status:'ready',fileIds:ids.join('\n'),fileChoices:labels(ids),files:[{id:'invalid'}]};
  }});
  assert.deepEqual(result.saved,ids);assert.equal(result.notifications.length,1);assert.equal(result.alerts.length,0);
 }
 assert.ok(!JSON.stringify(source).includes('Repeat Item'));
 assert.ok(!JSON.stringify(source).includes('Repeat Index'));
 for(const a of source.WFWorkflowActions)if(a.WFWorkflowActionParameters.WFControlFlowMode!==undefined)assert.equal(a.WFWorkflowActionParameters.CustomOutputName,undefined);
});
test('missing or malformed manifests stop before downloading or saving any file',async()=>{
 for(const fileIds of [undefined,'',file+'\nhttps://evil.test/',file+'x',' '+file]){
  const r=await runWorkflow(configured(),{input:post,request:async(u,h,method)=>method==='POST'?{id:job}:{status:'ready',fileIds}});
  assert.equal(r.requests.length,2);assert.equal(r.saved.length,0);assert.equal(r.alerts.length,1);
 }
});
test('long job has bounded polling and a retry message',async()=>{
 const r=await runWorkflow(configured(),{input:post,request:async(u,h,method)=>method==='POST'?{id:job}:{status:'running'}});
 assert.equal(r.requests.length,61);assert.match(r.alerts[0],/cùng bài/);assert.equal(r.saved.length,0);
});
test('chosen album name is reused for all files and an empty name stops before downloads',async()=>{
 const ids=[file,'d'.repeat(32)];
 const request=async(url,h,method)=>method==='POST'?{id:job}:url.includes('/v1/files/')?'media-file':{status:'ready',fileIds:ids.join('\n'),fileChoices:labels(ids)};
 for(const albumName of ['Media Saver','Ảnh tải về 📷']){
  const result=await runWorkflow(configured(),{input:post,albumName,request});
  assert.deepEqual(result.albumSaves,[albumName,albumName]);assert.ok(result.notifications[0].includes(albumName));
 }
 const cancelled=await runWorkflow(configured(),{input:post,albumName:'   ',request});
 assert.equal(cancelled.saved.length,0);assert.equal(cancelled.requests.length,2);
 assert.ok(!JSON.stringify(source).includes('WFCameraRollSelectedGroup'));
 const save=source.WFWorkflowActions.find(a=>a.WFWorkflowActionIdentifier.endsWith('.photos.createalbum'));
 assert.equal(save.WFWorkflowActionParameters.AlbumName.WFSerializationType,'WFTextTokenString');
});

test('mixed album downloads only the chosen photo and video, with no preselected items',async()=>{
 const ids=Array.from({length:5},(_,i)=>(i+1).toString(16).padStart(32,'0'));
 let choices=0;
 const result=await runWorkflow(configured(),{input:post,choose:(items,p)=>{
   choices++;assert.equal(p.WFChooseFromListActionSelectMultiple,true);assert.equal(p.WFChooseFromListActionSelectAll,false);
   assert.deepEqual(items,['Tải tất cả',...labels(ids).split('\n')]);
   // Pick the second (video) and fifth (photo), not a contiguous range.
   return [items[2],items[5]];
 },request:async(url,h,method)=>method==='POST'?{id:job}:url.includes('/v1/files/')?url.split('/').at(-1):{status:'ready',fileIds:ids.join('\n'),fileChoices:labels(ids)}});
 assert.equal(choices,1);assert.deepEqual(result.saved,[ids[1],ids[4]]);
 assert.deepEqual(result.requests.filter(r=>r.url.includes('/v1/files/')).map(r=>r.url.split('/').at(-1)),[ids[1],ids[4]]);
 assert.match(result.notifications[0],/Đã lưu 2 tệp/);assert.equal(result.alerts.length,0);
});

test('one selected item, select-all with another choice, and cancelled selection',async()=>{
 const ids=[file,'d'.repeat(32),'e'.repeat(32)];
 const request=async(url,h,method)=>method==='POST'?{id:job}:url.includes('/v1/files/')?url.split('/').at(-1):{status:'ready',fileIds:ids.join('\n'),fileChoices:labels(ids)};
 for(const [choose,expected] of [[items=>items[2],[ids[1]]],[items=>[items[0],items[2]],ids],[()=>[],[]]]){
   const result=await runWorkflow(configured(),{input:post,choose,request});
   assert.deepEqual(result.saved,expected);assert.equal(result.requests.length,2+expected.length);
   assert.equal(result.notifications.length,expected.length?1:0);assert.equal(result.alerts.length,0);
 }
});

test('single-file post skips the chooser; selecting the post URL still uses single selection',async()=>{
 for(const input of [post,post+'\nhttps://www.tiktok.com/@demo/video/123/']){
   let count=0;
   const result=await runWorkflow(configured(),{input,choose:(items,p)=>{count++;assert.equal(p.WFChooseFromListActionSelectMultiple,false);return items[0];},request:async(url,h,method)=>method==='POST'?{id:job}:url.includes('/v1/files/')?'one':{status:'ready',fileIds:file}});
   assert.deepEqual(result.saved,['one']);assert.equal(count,input===post?0:1);
 }
});

test('missing selection metadata and out-of-range choice cannot download an unrelated file',async()=>{
 const ids=[file,'d'.repeat(32)];
 for(const [fileChoices,choose] of [[undefined,items=>items[0]],['1 · Ảnh · 1.00 MB\nhttps://evil.test/',items=>items[0]],[labels(ids),()=>['999 · Video · 1.25 MB']]]){
   const result=await runWorkflow(configured(),{input:post,choose,request:async(u,h,method)=>method==='POST'?{id:job}:{status:'ready',fileIds:ids.join('\n'),fileChoices}});
   assert.equal(result.requests.length,2);assert.equal(result.saved.length,0);assert.equal(result.alerts.length,1);
 }
});
