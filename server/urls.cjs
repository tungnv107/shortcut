const https=require('node:https');
const dns=require('node:dns');
const net=require('node:net');
const domains=['facebook.com','fb.com','fb.watch','instagram.com','tiktok.com'];
function validateURL(input,{allowShort=true}={}) {
  if(typeof input!=='string'||input.length>4096)throw new Error('Liên kết không hợp lệ.');
  let u;try{u=new URL(input);}catch{throw new Error('Liên kết không hợp lệ.');}
  const host=u.hostname.toLowerCase();
  if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443')||!domains.some(d=>host===d||host.endsWith('.'+d)))throw new Error('Chỉ nhận link HTTPS của Facebook, Instagram hoặc TikTok.');
  const platform=host.endsWith('instagram.com')?'instagram':host.endsWith('tiktok.com')?'tiktok':'facebook';
  const p=u.pathname;
  const short=(platform==='instagram'&&/^\/share\/[A-Za-z0-9_-]+\/?$/.test(p))||
    (platform==='tiktok'&&(/^(vm|vt)\.tiktok\.com$/.test(host)||/^\/t\//.test(p)))||
    (platform==='facebook'&&(host==='fb.watch'||/^\/share\//.test(p)));
  const post=platform==='instagram'?/^\/(?:[\w.]+\/)?(?:p|reel|reels|tv)\/[\w-]+\/?$/.test(p):
    platform==='tiktok'?/^\/@[^/]+\/(?:video|photo)\/\d+\/?$/.test(p):
    /^\/(?:reel\/\d+|[^/]+\/videos\/[^/]+|[^/]+\/posts\/[^/]+)\/?$/.test(p)||
    (/^\/watch\/?$/.test(p)&&!!u.searchParams.get('v'))||
    (/^\/photo(?:\.php|s)?\/?$/.test(p)&&!!u.searchParams.get('fbid'))||
    (/^\/media\/set\/?$/.test(p)&&!!u.searchParams.get('set'))||
    (/^\/(?:story|permalink)\.php$/.test(p)&&!!u.searchParams.get('story_fbid'));
  if(!post&&!(short&&allowShort))throw new Error('Hãy chọn một bài, video hoặc album cụ thể; không nhận trang cá nhân, Stories hay bảng tin.');
  u.hash='';
  for(const key of [...u.searchParams.keys()])if(/^(igsh|igshid|utm_|fbclid|mibextid)/i.test(key))u.searchParams.delete(key);
  return {url:u.toString(),platform,short,photo:platform==='facebook'&&(/^\/(photo|media\/set|story\.php|permalink\.php)/.test(p)||/\/posts\//.test(p))};
}
function publicAddress(address) {
  if(net.isIPv4(address)) {
    const [a,b]=address.split('.').map(Number);
    return !(a===0||a===10||a===127||a>=224||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&b===168)||(a===100&&b>=64&&b<=127)||(a===198&&(b===18||b===19)));
  }
  if(net.isIPv6(address))return /^[23]/i.test(address)&&!/^2001:db8:/i.test(address);
  return false;
}
function safeLookup(host,options,cb) {
  dns.lookup(host,{all:true},(err,addresses)=>{
    if(err)return cb(err);
    const found=addresses.filter(x=>publicAddress(x.address));
    if(!found.length)return cb(new Error('Non-public destination'));
    if(options?.all)cb(null,found);else cb(null,found[0].address,found[0].family);
  });
}
async function resolvePost(input) {
  let post=validateURL(input);
  if(!post.short)return post;
  for(let i=0;i<6;i++) {
    const result=await new Promise((resolve,reject)=>{
      const r=https.get(post.url,{lookup:safeLookup,headers:{'User-Agent':'Mozilla/5.0'},timeout:15000},res=>{
        res.destroy();resolve({status:res.statusCode,location:res.headers.location});
      });r.on('timeout',()=>r.destroy(new Error('Redirect timeout')));r.on('error',reject);
    });
    if(result.status>=300&&result.status<400&&result.location)post=validateURL(new URL(result.location,post.url).toString());
    else break;
    if(!post.short)return post;
  }
  throw new Error('Chưa mở được link rút gọn. Hãy dùng liên kết đầy đủ của bài đăng.');
}
module.exports={validateURL,resolvePost,publicAddress,safeLookup};
