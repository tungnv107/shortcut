const http=require('node:http');
const fs=require('node:fs/promises');
const {createReadStream}=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {pipeline}=require('node:stream/promises');
const {loadConfig}=require('./config.cjs');
const {validateURL}=require('./urls.cjs');
const {downloadPost,walk}=require('./downloader.cjs');
const idPattern=/^[a-f0-9]{32}$/;
const equal=(a,b)=>typeof a==='string'&&Buffer.byteLength(a)===Buffer.byteLength(b)&&crypto.timingSafeEqual(Buffer.from(a),Buffer.from(b));
const makeID=()=>crypto.randomBytes(16).toString('hex');
async function createService(config,{downloader=downloadPost}={}) {
  await fs.mkdir(config.dataDir,{recursive:true});
  const jobs=new Map(),queue=[],active=new Map(),workers=new Set();let closing=false,submissions=Promise.resolve();
  const dir=id=>{if(!idPattern.test(id))throw new Error('Invalid id');return path.join(config.dataDir,id);};
  const persist=async job=>{
    const target=path.join(dir(job.id),'job.json');
    await fs.writeFile(target+'.tmp',JSON.stringify(job));await fs.rename(target+'.tmp',target);
  };
  // Plain text avoids Shortcuts coercing an array of JSON dictionaries inside a repeat.
  // Keep files unchanged for existing clients; IDs still require Bearer authentication.
  const view=job=>({ok:true,id:job.id,status:job.status,message:job.message||'',provider:job.provider||'',fileIds:(job.files||[]).map(f=>f.id).join('\n'),files:(job.files||[]).map(f=>({id:f.id,name:f.name,mime:f.mime,size:f.size})),expiresAt:new Date(job.createdAt+config.ttlMs).toISOString()});
  const usage=async()=>[...await walk(config.dataDir)].reduce((n,f)=>n+f.size,0);
  async function clean() {
    for(const job of jobs.values())if(!active.has(job.id)&&!queue.includes(job.id)&&Date.now()-job.createdAt>config.ttlMs) {
      await fs.rm(dir(job.id),{recursive:true,force:true});jobs.delete(job.id);
    }
  }
  for(const entry of await fs.readdir(config.dataDir,{withFileTypes:true})) {
    if(!entry.isDirectory()||!idPattern.test(entry.name))continue;
    try {
      const job=JSON.parse(await fs.readFile(path.join(dir(entry.name),'job.json'),'utf8'));
      if(job.id!==entry.name||!Number.isFinite(job.createdAt)||!Array.isArray(job.files))throw new Error('Invalid state');
      if(!job.files.every(f=>idPattern.test(f.id)&&/^\d+\.(mp4|jpg)$/.test(f.name)))throw new Error('Invalid file state');
      if(['queued','running'].includes(job.status)){job.status='failed';job.message='Máy chủ vừa khởi động lại; hãy chia sẻ lại bài đăng.';await persist(job);}
      if(['ready','partial'].includes(job.status)&&job.formatVersion!==1){job.status='failed';job.files=[];job.message='Cần xử lý lại media theo phiên bản tương thích iPhone mới.';await persist(job);}
      jobs.set(job.id,job);
    }catch{await fs.rm(dir(entry.name),{recursive:true,force:true});}
  }
  await clean();
  async function execute(job) {
    const controller=new AbortController();active.set(job.id,controller);
    let child,checking=false;
    const kill=()=>{if(child?.pid){try{process.kill(process.platform==='win32'?child.pid:-child.pid,'SIGKILL');}catch{}}};
    controller.signal.addEventListener('abort',kill);
    const timer=setTimeout(()=>controller.abort(),config.timeoutMs);
    const monitor=setInterval(async()=>{
      if(checking)return;checking=true;
      try {const files=await walk(dir(job.id));if(files.reduce((n,f)=>n+f.size,0)>config.maxJobBytes*3||files.length>config.maxFiles*3+10)controller.abort();}catch{}finally{checking=false;}
    },1000);
    try {
      job.status='running';await persist(job);
      const result=await downloader({url:job.url,dir:dir(job.id),config,signal:controller.signal,onChild:c=>{child=c;c.once('exit',()=>{if(child===c)child=null;});}});
      if(controller.signal.aborted)throw new Error('Tác vụ quá thời gian hoặc vượt giới hạn dung lượng.');
      if(!result.files.length||result.files.length>config.maxFiles||result.files.reduce((n,f)=>n+f.size,0)>config.maxJobBytes)throw new Error('Media vượt giới hạn cấu hình.');
      for(const f of result.files)if(!/^\d+\.(mp4|jpg)$/.test(f.name))throw new Error('Invalid output filename');
      job.files=result.files.map(f=>({...f,id:makeID()}));job.status=result.warning?'partial':'ready';job.message=result.warning||'';job.provider=result.provider||'direct';
    } catch(error) {
      job.status='failed';job.message=controller.signal.aborted?'Tác vụ quá thời gian hoặc vượt giới hạn dung lượng.':error.message;
      job.files=[];
      // This directory is a validated random job id under our dedicated cache root.
      await fs.rm(dir(job.id),{recursive:true,force:true});await fs.mkdir(dir(job.id),{recursive:true});
    } finally {
      clearTimeout(timer);clearInterval(monitor);controller.signal.removeEventListener('abort',kill);
      await persist(job);active.delete(job.id);pump();
    }
  }
  function pump(){while(!closing&&active.size<config.concurrency&&queue.length){const job=jobs.get(queue.shift());const worker=execute(job).catch(()=>{active.delete(job.id);});workers.add(worker);worker.finally(()=>workers.delete(worker));}}
  function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
  async function body(req){let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>8192)throw new Error('Request too large');}return JSON.parse(text);}
  function setup(res) {
    const file=`https://github.com/tungnv107/shortcut/releases/download/v${config.version}/Media-Saver.shortcut`;
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer',
      'Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'"});
    res.end(`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cài Media Saver</title><style>body{font:18px system-ui;max-width:540px;margin:40px auto;padding:20px;line-height:1.6}button,a{display:block;padding:14px;margin:18px 0;border-radius:10px;background:#0669dd;color:white;border:0;text-decoration:none;text-align:center;font:inherit}code{overflow-wrap:anywhere}</style><h1>Media Saver</h1><p>Cài một lần để tải từ bảng chia sẻ.</p><p>1. Sao chép mã truy cập riêng của bạn.</p><button onclick="navigator.clipboard.writeText(document.querySelector('code').textContent).then(()=>this.textContent='Đã sao chép')">Sao chép mã</button><details><summary>Xem mã để sao chép thủ công</summary><code>${config.token}</code></details><p>2. Tải và mở tệp, chọn Thêm/Thay thế. Dán mã ở bước thiết lập.</p><a href="${file}" rel="noreferrer">Tải Media Saver</a><p>3. Trong Facebook, Instagram hoặc TikTok: Chia sẻ → Thêm/Khác → Media Saver.</p><p>Giữ riêng trang này vì nó chứa mã truy cập dịch vụ của bạn.</p></html>`);
  }
  const server=http.createServer(async(req,res)=>{
    try {
      const u=new URL(req.url,'http://local');
      if(u.pathname==='/healthz'&&req.method==='GET')return json(res,200,{ok:true,version:config.version});
      if(req.method==='GET'&&config.setupToken&&equal(u.pathname,'/setup/'+config.setupToken))return setup(res);
      if(!equal(req.headers.authorization,'Bearer '+config.token))return json(res,401,{ok:false,error:'Mã truy cập không đúng. Cài lại cấu hình Media Saver.'});
      if(req.method==='POST'&&u.pathname==='/v1/jobs') {
        let post;try{post=validateURL((await body(req)).url);}catch(error){return json(res,400,{ok:false,error:error.message});}
        const submit=async()=>{await clean();
        const existing=[...jobs.values()].find(j=>j.url===post.url&&j.status!=='failed');
        if(existing)return json(res,200,view(existing));
        if(queue.length+active.size>=config.maxQueue)return json(res,429,{ok:false,error:'Hàng đợi đang đầy, hãy thử lại sau.'});
        if(await usage()>config.maxCacheBytes)return json(res,507,{ok:false,error:'Bộ nhớ tạm đang đầy; hãy thử lại khi các tệp cũ hết hạn.'});
        const job={id:makeID(),url:post.url,status:'queued',createdAt:Date.now(),files:[],message:'',formatVersion:1};
        await fs.mkdir(dir(job.id));jobs.set(job.id,job);await persist(job);queue.push(job.id);pump();return json(res,202,view(job));};
        const pending=submissions.then(submit);submissions=pending.catch(()=>{});await pending;return;
      }
      const status=u.pathname.match(/^\/v1\/jobs\/([a-f0-9]{32})$/);
      if(req.method==='GET'&&status){await clean();const job=jobs.get(status[1]);return json(res,job?200:404,job?view(job):{ok:false,error:'Tác vụ không còn tồn tại. Hãy chia sẻ lại bài đăng.'});}
      const download=u.pathname.match(/^\/v1\/files\/([a-f0-9]{32})\/([a-f0-9]{32})$/);
      if((req.method==='GET'||req.method==='HEAD')&&download) {
        const job=jobs.get(download[1]);const file=job?.files.find(f=>f.id===download[2]);
        if(!file||Date.now()-job.createdAt>config.ttlMs)return json(res,404,{ok:false,error:'Tệp đã hết hạn.'});
        let start=0,end=file.size-1,code=200;
        if(req.headers.range){const m=req.headers.range.match(/^bytes=(\d+)-(\d*)$/);if(!m||Number(m[1])>=file.size|| (m[2]&&Number(m[2])<Number(m[1]))){res.writeHead(416,{'Content-Range':`bytes */${file.size}`});return res.end();}start=Number(m[1]);end=m[2]?Math.min(Number(m[2]),end):end;code=206;}
        res.writeHead(code,{'Content-Type':file.mime,'Content-Length':end-start+1,'Accept-Ranges':'bytes','Cache-Control':'private, no-store',
          'Content-Disposition':`attachment; filename="${file.name}"`,'X-Content-Type-Options':'nosniff',...(code===206?{'Content-Range':`bytes ${start}-${end}/${file.size}`}:{})});
        if(req.method==='HEAD')return res.end();
        await pipeline(createReadStream(path.join(dir(job.id),file.name),{start,end}),res);return;
      }
      json(res,404,{ok:false,error:'Không tìm thấy đường dẫn.'});
    }catch(error){if(!res.headersSent)json(res,500,{ok:false,error:'Máy chủ không xử lý được yêu cầu.'});else res.destroy();}
  });
  server.requestTimeout=30000;server.headersTimeout=15000;
  const cleanup=setInterval(()=>clean().catch(()=>{}),60000);cleanup.unref();
  return {server,jobs,close:async()=>{closing=true;clearInterval(cleanup);for(const c of active.values())c.abort();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await Promise.allSettled([...workers]);}};
}
if(require.main===module){const config=loadConfig();createService(config).then(service=>{service.server.listen(config.port,config.host,()=>console.log(`Media Saver ${config.version} listening on ${config.port}`));for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>service.close().then(()=>process.exit(0)));}).catch(error=>{console.error(error.message);process.exit(1);});}
module.exports={createService};
