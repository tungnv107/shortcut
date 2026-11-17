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
   return ++polls===1?{status:'running'}:{status:'ready',files:[{id:file}]};
 }});
 assert.deepEqual(result.saved,['media-file']);assert.equal(polls,2);assert.equal(result.notifications.length,1);
});
test('server failure never saves media; arbitrary file id cannot exfiltrate the bearer token',async()=>{
 for(const response of [{status:'failed',message:'Login needed'},{status:'ready',files:[{id:'https://evil.test/'}]}]){
  const r=await runWorkflow(configured(),{input:post,request:async(url,h,method)=>method==='POST'?{id:job}:response});
  assert.equal(r.saved.length,0);assert.equal(r.alerts.length,1);assert.equal(r.requests.length,2);
 }
});
test('long job has bounded polling and a retry message',async()=>{
 const r=await runWorkflow(configured(),{input:post,request:async(u,h,method)=>method==='POST'?{id:job}:{status:'running'}});
 assert.equal(r.requests.length,61);assert.match(r.alerts[0],/cùng bài/);assert.equal(r.saved.length,0);
});
