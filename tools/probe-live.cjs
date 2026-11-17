// Optional diagnostic for the public pages captured by browser-check --live.
// Downloads at most 64 KiB per response; no session cookies or account access.
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const dir=path.join(root,'artifacts','live');
const rows=JSON.parse(fs.readFileSync(path.join(root,'artifacts','browser-check','results.private.json'),'utf8'));
const summary=[];
for(const row of rows.filter(r=>r.live&&r.items&&r.items.length)) {
  const name=row.name.split(': ').pop();
  const item=row.items[0];
  const file=path.join(dir,name+'-probe.bin');
  const head=path.join(dir,name+'-probe.headers');
  const referer=name==='tiktok'?'https://www.tiktok.com/':'https://www.instagram.com/';
  const run=spawnSync('curl.exe',['-L','--max-time','20','--range','0-1023','--max-filesize','65536','-sS',
    '-H','Referer: '+referer,'-D',head,'-o',file,item.url],{encoding:'utf8',timeout:25000,windowsHide:true});
  const headers=fs.existsSync(head)?fs.readFileSync(head,'utf8'):'';
  const data=fs.existsSync(file)?fs.readFileSync(file):Buffer.alloc(0);
  summary.push({name,kind:item.kind,exit:run.status,status:[...headers.matchAll(/^HTTP\/\S+ (\d+)/gm)].map(m=>+m[1]).pop(),
    contentType:[...headers.matchAll(/^content-type:\s*(.*)/gmi)].map(m=>m[1].trim()).pop(),bytes:data.length,
    mp4Signature:data.subarray(4,8).toString()==='ftyp',jpegSignature:data[0]===255&&data[1]===216,
    error:run.status===0?undefined:(run.stderr||'').slice(0,200)});
}
fs.writeFileSync(path.join(root,'artifacts','live-probe-results.json'),JSON.stringify({checkedAt:new Date().toISOString(),results:summary},null,2));
console.log(JSON.stringify(summary,null,2));
