const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {runWorkflow}=require('./helpers/native-runner.cjs');
const source=JSON.parse(fs.readFileSync('dist/workflow.json','utf8'));
const token='a'.repeat(64),job='b'.repeat(32),file='c'.repeat(32),post='https://www.instagram.com/p/Example/';
function configured(){const w=structuredClone(source);w.WFWorkflowActions[2].WFWorkflowActionParameters.WFTextActionText=token;return w;}
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
    return {status:'ready',fileIds:ids.join('\n'),files:[{id:'invalid'}]};
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
 const request=async(url,h,method)=>method==='POST'?{id:job}:url.includes('/v1/files/')?'media-file':{status:'ready',fileIds:ids.join('\n')};
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
