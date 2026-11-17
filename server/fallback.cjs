const https=require('node:https');
const fs=require('node:fs');
const path=require('node:path');
const {pipeline}=require('node:stream/promises');
const {Transform}=require('node:stream');
const {setTimeout:delay}=require('node:timers/promises');
const {safeLookup}=require('./urls.cjs');
async function response(url,signal,redirects=0) {
  const u=new URL(url);
  if(u.protocol!=='https:'||u.username||u.password||u.port&&u.port!=='443')throw new Error('Invalid media URL');
  const res=await new Promise((resolve,reject)=>{
    const req=https.get(u,{lookup:safeLookup,signal,timeout:30000,headers:{'User-Agent':'Media-Saver/1.0','Referer':u.origin+'/'}},resolve);
    req.on('timeout',()=>req.destroy(new Error('Timeout')));req.on('error',reject);
  });
  if(res.statusCode>=300&&res.statusCode<400&&res.headers.location){res.destroy();if(redirects>=5)throw new Error('Too many redirects');return response(new URL(res.headers.location,u),signal,redirects+1);}
  if(res.statusCode!==200){res.destroy();throw new Error('Provider unavailable');}
  return res;
}
async function json(url,signal,accept){
  let failure;
  for(let attempt=0;attempt<3;attempt++){
    try {const res=await response(url,signal);const chunks=[];let size=0;for await(const chunk of res){size+=chunk.length;if(size>4*1024*1024){res.destroy();throw new Error('Provider response too large');}chunks.push(chunk);}const data=JSON.parse(Buffer.concat(chunks).toString());if(accept&&!accept(data))throw new Error('Dịch vụ dự phòng đang lỗi; hãy thử lại sau.');return data;}
    catch(error){failure=error;if(signal.aborted)throw error;if(attempt<2)await delay(1500*(attempt+1),undefined,{signal});}
  }
  throw failure;
}
function instagramURLs(data) {
  // The provider uses one object for a Reel and an array of objects for a carousel.
  // url[] holds quality variants of ONE media item; thumb/meta are not downloads.
  const items=Array.isArray(data)?data:[data];
  if(!items.length)throw new Error('Dịch vụ chưa trả về media cho bài Instagram này.');
  return items.map(item=>{
    if(!Array.isArray(item?.url))throw new Error('Dữ liệu media Instagram không hợp lệ.');
    const variants=item.url.filter(x=>x&&typeof x.url==='string'&&['mp4','jpg','jpeg','png','webp'].includes(x.ext));
    const video=variants.filter(x=>x.ext==='mp4');
    const candidates=video.length?video:variants;
    const best=candidates.toSorted((a,b)=>(parseFloat(b.quality)||0)-(parseFloat(a.quality)||0))[0];
    if(!best)throw new Error('Dịch vụ chưa trả về tệp ảnh/video Instagram hỗ trợ.');
    let u;try{u=new URL(best.url);}catch{throw new Error('Liên kết media Instagram không hợp lệ.');}
    if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443'))throw new Error('Liên kết media Instagram không hợp lệ.');
    return {url:u.toString(),ext:best.ext};
  });
}
async function fallback(post,raw,config,signal) {
  const encoded=encodeURIComponent(post.url);let urls=[];
  if(post.platform==='tiktok'){
    const r=await json('https://www.tikwm.com/api/?hd=1&url='+encoded,signal,x=>x.code===0&&x.data);
    if(r.code!==0)throw new Error('TikWM unavailable');
    urls=r.data.images?.length?r.data.images.map(url=>({url:new URL(url,'https://www.tikwm.com').toString(),ext:'jpg'})):[{url:new URL(r.data.hdplay||r.data.play,'https://www.tikwm.com').toString(),ext:'mp4'}];
  }else if(post.platform==='instagram'){
    const r=await json('https://api.siputzx.my.id/api/d/sssinstagram?url='+encoded,signal,x=>x.status===true&&(Array.isArray(x.data)||Array.isArray(x.data?.url)));
    urls=instagramURLs(r.data);
  }else if(!post.photo){
    const r=await json('https://vkrdownloader.org/server/?api_key=vkrdownloader&vkr='+encoded,signal,x=>x.success&&Array.isArray(x.data?.downloads));
    const video=r.data?.downloads?.find(x=>x.ext==='mp4');if(video)urls=[video];
  }
  if(!urls.length||urls.length>config.maxFiles)throw new Error('Không có media hoặc vượt giới hạn số tệp.');
  let total=0;
  for(const [i,item] of urls.entries()){
    const res=await response(item.url,signal);
    const type=res.headers['content-type']||'';
    if(!/^(image\/|video\/|application\/octet-stream)/i.test(type)){res.destroy();throw new Error('Không nhận được tệp media.');}
    const limiter=new Transform({transform(chunk,encoding,cb){total+=chunk.length;cb(total>config.maxJobBytes?new Error('Vượt giới hạn dung lượng'):null,chunk);}});
    await pipeline(res,limiter,fs.createWriteStream(path.join(raw,`${String(i+1).padStart(4,'0')}.${item.ext}`)),{signal});
  }
  return {code:0,tail:'',provider:true};
}
module.exports={fallback,instagramURLs};
