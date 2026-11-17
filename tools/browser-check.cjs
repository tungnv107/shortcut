// Uses a fresh, headless browser profile; never touches the user's browser profile.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { collectMedia } = require('../src/collector.js');
const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'artifacts', 'browser-check');
fs.mkdirSync(dir, { recursive: true });
const browser = [process.env.MEDIA_SAVER_BROWSER,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
].find(p => p && fs.existsSync(p));
if (!browser) throw new Error('Set MEDIA_SAVER_BROWSER to Chrome/Edge executable.');
const fixtures = [
  {name:'Instagram HTML carousel',url:'https://www.instagram.com/p/TEST/',expected:2,html:`<!doctype html><script type="application/json">{"data":{"shortcode":"TEST","carousel_media":[{"id":"1","display_url":"https://cdn.example.com/one.jpg"},{"id":"2","is_video":true,"video_url":"https://cdn.example.com/two.mp4"}]}}</script>`},
  {name:'TikTok HTML album',url:'https://www.tiktok.com/@demo/photo/123',expected:2,html:`<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">{"__DEFAULT_SCOPE__":{"webapp.video-detail":{"itemInfo":{"itemStruct":{"id":"123","imagePost":{"images":[{"imageURL":{"urlList":["https://cdn.example.com/1.jpg"]}},{"imageURL":{"urlList":["https://cdn.example.com/2.jpg"]}}]}}}}}}</script>`},
  {name:'Facebook HTML video',url:'https://www.facebook.com/reel/123',expected:1,html:`<script type="application/json" data-sjs>{"require":[{"id":"123","__typename":"Video","browser_native_hd_url":"https://cdn.example.com/video.mp4"}]}</script>`},
  {name:'DOM video fallback',url:'https://www.instagram.com/p/TEST/',expected:1,html:`<article><a href="https://www.instagram.com/p/TEST/">Post</a><video><source src="https://cdn.example.com/movie.mp4" type="video/mp4"></video></article>`},
  {name:'unrelated DOM article isolation',url:'https://www.instagram.com/p/TEST/',expected:1,html:`<article><a href="https://www.instagram.com/p/OTHER/">Other</a><video src="https://cdn.example.com/wrong.mp4"></video></article><article><a href="https://www.instagram.com/p/TEST/">Post</a><video src="https://cdn.example.com/right.mp4"></video></article>`}
];
if (process.argv.includes('--live')) {
  for (const [name,url] of [
    ['instagram','https://www.instagram.com/p/BQ0eAlwhDrw/'],
    ['tiktok','https://www.tiktok.com/@patroxofficial/video/6742501081818877190'],
    ['facebook','https://www.facebook.com/cnn/videos/10155529876156509/']
  ]) {
    const file=path.join(root,'artifacts','live',name+'.html');
    if(fs.existsSync(file)) {
      let extra=[];
      const apiFile=path.join(root,'artifacts','live',name+'-api.json');
      if(name==='instagram'&&fs.existsSync(apiFile)) {
        try { const body=JSON.parse(fs.readFileSync(apiFile,'utf8')); extra=(body.items||[]).filter(x=>x.code==='BQ0eAlwhDrw'||String(x.pk)==='1455920561485265648').map(x=>({...x,shortcode:'BQ0eAlwhDrw'})); } catch(_) {}
      }
      fixtures.push({name:'Live HTTP HTML: '+name,url,live:true,html:fs.readFileSync(file,'utf8'),extra});
    }
  }
}
const payload = JSON.stringify(fixtures).replace(/</g,'\\u003c');
const html = `<!doctype html><meta charset="utf-8"><pre id="report"></pre><script>
${collectMedia.toString()}
const samples=${payload};
const results=samples.map(sample=>{
  const document=new DOMParser().parseFromString(sample.html,'text/html');
  const result=collectMedia(document,sample.url,sample.extra);
  return {name:sample.name,live:!!sample.live,expected:sample.expected,found:result.urls.length,
    passed:sample.live?null:result.urls.length===sample.expected,
    title:document.title,structured:result.structured,notice:result.notice,
    items:sample.live?result.items:undefined};
});
document.getElementById('report').textContent=JSON.stringify(results);
</script>`;
const harness=path.join(dir,'harness.html');
fs.writeFileSync(harness,html);
const run=spawnSync(browser,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-background-networking',
  '--user-data-dir='+path.join(dir,'profile'),'--dump-dom',pathToFileURL(harness).href],{encoding:'utf8',timeout:45000,maxBuffer:10*1024*1024,windowsHide:true});
if(run.error) throw run.error;
const match=(run.stdout||'').match(/<pre id="report">([\s\S]*?)<\/pre>/);
if(!match) throw new Error('Browser produced no report: '+(run.stderr||'').slice(-1200));
const report=JSON.parse(match[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&'));
// Full extracted media URLs remain local in ignored artifacts for optional range probes.
fs.writeFileSync(path.join(dir,'results.private.json'),JSON.stringify(report,null,2));
const safe=report.map(({items,...r})=>r);
fs.writeFileSync(path.join(root,'artifacts','browser-results.json'),JSON.stringify({checkedAt:new Date().toISOString(),engine:'Chrome/Edge headless, DOMParser (not iOS)',results:safe},null,2));
console.log(JSON.stringify(safe,null,2));
if(report.some(r=>r.passed===false)) process.exitCode=1;
