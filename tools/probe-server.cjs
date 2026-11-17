// Run inside the deployed container. Never logs the API token or private setup URL.
const fs=require('node:fs');const crypto=require('node:crypto');const {execFileSync}=require('node:child_process');
const base=process.env.PROBE_BASE_URL||'https://media-saver.161.118.222.102.sslip.io';
const token=fs.readFileSync(process.env.API_TOKEN_FILE,'utf8').trim();
const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
const samples=[
 ['TikTok video','https://www.tiktok.com/@patroxofficial/video/6742501081818877190'],
 ['Instagram photos','https://www.instagram.com/p/BoHk1haB5tM/'],
 ['Facebook video','https://www.facebook.com/cnn/videos/10155529876156509/'],
 ['Instagram videos','https://www.instagram.com/p/BQ0eAlwhDrw/'],
 ['TikTok photos','https://www.tiktok.com/@chillezy/photo/7240568259186019630'],
 ['Facebook album','https://www.facebook.com/media/set/?set=a.10152716010956729&type=3']
];
async function main(){const results=[];
 for(const [name,url] of samples){
  const created=await (await fetch(base+'/v1/jobs',{method:'POST',headers,body:JSON.stringify({url})})).json();
  console.log(JSON.stringify({event:'submitted',name,id:created.id,error:created.error}));
  let job=created;
  for(let i=0;i<360&&['queued','running'].includes(job.status);i++){await new Promise(r=>setTimeout(r,2000));job=await(await fetch(base+'/v1/jobs/'+created.id,{headers})).json();}
  const result={name,url,status:job.status,message:job.message,provider:job.provider,files:[]};
  for(const file of job.files||[]){
   const response=await fetch(base+'/v1/files/'+job.id+'/'+file.id,{headers});const bytes=Buffer.from(await response.arrayBuffer());
   if(!response.ok||bytes.length!==file.size)throw new Error('Download mismatch '+name);
   const signature=file.mime==='video/mp4'?bytes.subarray(4,8).toString()==='ftyp':bytes[0]===255&&bytes[1]===216;
   if(!signature)throw new Error('Invalid media signature '+name);
   const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=codec_name,codec_type,width,height','-of','json','/data/'+job.id+'/'+file.name],{encoding:'utf8'}));
   result.files.push({name:file.name,bytes:bytes.length,mime:file.mime,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),streams:probe.streams});
  }
  results.push(result);console.log(JSON.stringify({event:'complete',...result}));
 }
 console.log(JSON.stringify({report:{checkedAt:new Date().toISOString(),version:require('/app/package.json').version,scope:'Full file download through authenticated HTTPS and ffprobe on VPS; iPhone execution not tested.',results}}));
 if(results.some(x=>!['ready','partial'].includes(x.status)))process.exitCode=1;
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
