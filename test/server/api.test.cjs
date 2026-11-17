const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs/promises');const os=require('node:os');const path=require('node:path');
const {createService}=require('../../server/app.cjs');const {loadConfig}=require('../../server/config.cjs');
const {validateURL,publicAddress}=require('../../server/urls.cjs');
const token='a'.repeat(64),post='https://www.instagram.com/p/Example/';
async function service(t,downloader,extra={}){
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'media-saver-test-'));
  const config={...loadConfig({API_TOKEN:token,DATA_DIR:dir}),...extra};
  const app=await createService(config,{downloader});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+app.server.address().port;
  t.after(async()=>{await app.close();await fs.rm(dir,{recursive:true,force:true});});
  return {...app,base,config,call:(p,options={})=>fetch(base+p,{...options,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',...options.headers}})};
}
const fake=async({dir})=>{await fs.writeFile(path.join(dir,'1.jpg'),'test-media');return {files:[{name:'1.jpg',mime:'image/jpeg',size:10}]};};
async function ready(s,id){for(let i=0;i<100;i++){const r=await (await s.call('/v1/jobs/'+id)).json();if(!['queued','running'].includes(r.status))return r;await new Promise(r=>setTimeout(r,10));}throw new Error('Job did not finish');}
test('URL allowlist rejects profiles, spoofed hosts, credentials and internal addresses',()=>{
 for(const u of ['https://instagram.com.evil.test/p/a/','https://user:pass@instagram.com/p/a/','https://127.0.0.1/p/a/','file:///etc/passwd','https://www.instagram.com/demo/','https://www.tiktok.com/@demo'])assert.throws(()=>validateURL(u));
 for(const u of [post,'https://vm.tiktok.com/abc/','https://www.facebook.com/photo/?fbid=123','https://www.facebook.com/media/set/?set=a.123'])assert.ok(validateURL(u));
 for(const ip of ['127.0.0.1','10.1.2.3','169.254.169.254','172.16.0.1','192.168.1.1','::1','::ffff:127.0.0.1'])assert.equal(publicAddress(ip),false);
});
test('health is public; jobs and files require bearer authentication',async t=>{
 const s=await service(t,fake);assert.equal((await fetch(s.base+'/healthz')).status,200);
 assert.equal((await fetch(s.base+'/v1/jobs',{method:'POST',body:'{}'})).status,401);
 assert.equal((await s.call('/v1/files/'+'a'.repeat(32)+'/'+'b'.repeat(32),{headers:{Authorization:'Bearer wrong'}})).status,401);
});
test('job completes, file is streamed with Range, same URL is deduplicated',async t=>{
 const s=await service(t,fake);const created=await (await s.call('/v1/jobs',{method:'POST',body:JSON.stringify({url:post})})).json();
 const job=await ready(s,created.id);assert.equal(job.status,'ready');assert.equal(job.files.length,1);
 const url='/v1/files/'+job.id+'/'+job.files[0].id;
 const full=await s.call(url);assert.equal(await full.text(),'test-media');
 const part=await s.call(url,{headers:{Range:'bytes=2-5'}});assert.equal(part.status,206);assert.equal(await part.text(),'st-m');
 assert.equal((await s.call(url,{headers:{Range:'bytes=999-'}})).status,416);
 const again=await (await s.call('/v1/jobs',{method:'POST',body:JSON.stringify({url:post+'?igsh=tracking'})})).json();assert.equal(again.id,job.id);
});
test('invalid URLs never start a worker; failed jobs expose no files',async t=>{
 let calls=0;const s=await service(t,async()=>{calls++;throw new Error('Need cookies');});
 assert.equal((await s.call('/v1/jobs',{method:'POST',body:JSON.stringify({url:'https://localhost/'})})).status,400);assert.equal(calls,0);
 const created=await (await s.call('/v1/jobs',{method:'POST',body:JSON.stringify({url:post})})).json();
 const job=await ready(s,created.id);assert.equal(job.status,'failed');assert.deepEqual(job.files,[]);
});
test('concurrent duplicate submissions share one job and queue limits hold',async t=>{
 let release;const wait=new Promise(r=>release=r);t.after(()=>release());
 const s=await service(t,async x=>{await wait;return fake(x);},{maxQueue:1});
 const responses=await Promise.all(Array.from({length:4},()=>s.call('/v1/jobs',{method:'POST',body:JSON.stringify({url:post})}).then(r=>r.json())));
 assert.equal(new Set(responses.map(x=>x.id)).size,1);
 assert.equal((await s.call('/v1/jobs',{method:'POST',body:JSON.stringify({url:post.replace('Example','Other')})})).status,429);
 release();await ready(s,responses[0].id);
});
test('expiry removes files; partial results retain warning',async t=>{
 const s=await service(t,async x=>({...await fake(x),warning:'One missing'}));
 const created=await (await s.call('/v1/jobs',{method:'POST',body:JSON.stringify({url:post})})).json();const job=await ready(s,created.id);
 assert.equal(job.status,'partial');assert.equal(job.message,'One missing');
 s.jobs.get(job.id).createdAt=0;assert.equal((await s.call('/v1/jobs/'+job.id)).status,404);
 assert.equal((await s.call('/v1/files/'+job.id+'/'+job.files[0].id)).status,404);
});
test('setup page is private and old codec cache is invalidated on restart',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'media-saver-restart-'));
 const config=loadConfig({API_TOKEN:token,SETUP_TOKEN:'b'.repeat(64),DATA_DIR:dir});
 const old='c'.repeat(32),current='d'.repeat(32);
 for(const id of [old,current]){
  await fs.mkdir(path.join(dir,id));
  await fs.writeFile(path.join(dir,id,'job.json'),JSON.stringify({id,url:post,status:'ready',createdAt:Date.now(),files:[{id:'e'.repeat(32),name:'1.mp4',mime:'video/mp4',size:10}],...(id===current?{formatVersion:1}:{})}));
 }
 const app=await createService(config,{downloader:fake});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
 t.after(async()=>{await app.close();await fs.rm(dir,{recursive:true,force:true});});
 const base='http://127.0.0.1:'+app.server.address().port;
 assert.equal(app.jobs.get(old).status,'failed');assert.deepEqual(app.jobs.get(old).files,[]);
 assert.equal(app.jobs.get(current).status,'ready');
 assert.equal((await fetch(base+'/setup/wrong')).status,401);
 const page=await fetch(base+'/setup/'+config.setupToken);
 assert.equal(page.status,200);assert.equal(page.headers.get('referrer-policy'),'no-referrer');assert.equal(page.headers.get('cache-control'),'no-store');
 assert.match(await page.text(),/WF|Sao chép mã/);
 assert.equal((await fetch(base+'/v1/jobs',{headers:{Authorization:'Bearer '+'é'.repeat(64)}})).status,401);
});
