// Summarize the small HTTP Range probes captured during release verification.
// Raw responses and expiring signed CDN URLs remain in ignored artifacts/live/.
const fs = require('node:fs');
const path = require('node:path');
const cases = [
  ['TikTok video','https://www.tiktok.com/@patroxofficial/video/6742501081818877190','TikWM','tikwm-test','tikwm-media',1],
  ['TikTok photos','https://www.tiktok.com/@chillezy/photo/7240568259186019630','TikWM','tikwm-photos','tikwm-photo-media',16],
  ['Instagram videos','https://www.instagram.com/p/BQ0eAlwhDrw/','Siputzx / SSSInstagram','sssinstagram-ig','sssinstagram-media',3],
  ['Instagram photos','https://www.instagram.com/p/BoHk1haB5tM/','Siputzx / SSSInstagram','sssinstagram-photos','sssinstagram-photo-media',5],
  ['Facebook video','https://www.facebook.com/cnn/videos/10155529876156509/','VKrDownloader','vkr-facebook','vkr-facebook-video',1],
];
const results=cases.map(([name,postURL,provider,api,probe,expectedItems])=>{
  const data=JSON.parse(fs.readFileSync(`artifacts/live/${api}.json`,'utf8'));
  const itemCount=api.startsWith('tikwm')?(data.data.images?.length||1):api.startsWith('sss')?data.data.length:data.data.downloads.some(d=>d.ext==='mp4')?1:0;
  const headerPath=`artifacts/live/${probe}.headers`;
  const headers=fs.readFileSync(headerPath,'utf8');
  const bytes=fs.readFileSync(`artifacts/live/${probe}.bin`);
  const status=Number([...headers.matchAll(/HTTP\/[^ ]+ (\d+)/g)].at(-1)?.[1]);
  const contentType=[...headers.matchAll(/content-type:\s*([^\r\n]+)/gi)].at(-1)?.[1];
  const isVideo=name.includes('video');
  const magic=isVideo?bytes.subarray(4,8).toString()==='ftyp':bytes.subarray(0,3).equals(Buffer.from([255,216,255]));
  if(itemCount!==expectedItems || status!==206 || bytes.length!==1024 || !magic) throw new Error(`Probe failed: ${name}`);
  return {name,postURL,provider,itemCount,probedItems:1,httpStatus:status,contentType,bytesReceived:bytes.length,fileSignature:isVideo?'ISO BMFF ftyp':'JPEG FF D8 FF',checkedAt:fs.statSync(headerPath).mtime.toISOString()};
});
const report={version:require('../package.json').version,deviceTested:false,
  scope:'Public API responses plus 1 KiB of one selected file per case. Not full downloads, playback, audio, photo-library saves, or iOS execution.',
  results,limitations:['Facebook photo/album unsupported.','Private posts, Stories and livestreams unsupported.','Service/CDN availability and rate limits can change.']};
fs.writeFileSync(path.join('artifacts','native-live-results.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
