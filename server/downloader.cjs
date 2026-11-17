const fs=require('node:fs/promises');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {resolvePost}=require('./urls.cjs');
const {fallback}=require('./fallback.cjs');
const formats={'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.mp4':'video/mp4','.mov':'video/quicktime','.heic':'image/heic'};
async function walk(dir) {
  const files=[];
  for(const entry of await fs.readdir(dir,{withFileTypes:true})) {
    const p=path.join(dir,entry.name);
    if(entry.isDirectory())files.push(...await walk(p));
    else if(entry.isFile())files.push({path:p,...await fs.stat(p)});
  }
  return files;
}
function run(command,args,{cwd,signal,onChild,capture=false}) {
  return new Promise((resolve,reject)=>{
    const child=spawn(command,args,{cwd,stdio:['ignore',capture?'pipe':'ignore','pipe'],signal,detached:process.platform!=='win32'});
    onChild?.(child);let tail='',stdout='';
    child.stdout?.on('data',chunk=>{stdout=(stdout+chunk).slice(-262144);});
    child.stderr.on('data',chunk=>{tail=(tail+chunk).slice(-6000);});
    child.once('error',reject);child.once('exit',(code)=>resolve({code,tail,stdout}));
  });
}
async function downloadPost({url,dir,config,signal,onChild}) {
  const post=await resolvePost(url);
  const cookieSource=path.join(config.cookiesDir,post.platform+'.txt');
  const hasCookies=await fs.access(cookieSource).then(()=>true,()=>false);
  const cookie=path.join(dir,'cookies.txt');
  if(hasCookies)await fs.copyFile(cookieSource,cookie);
  const raw=path.join(dir,'raw');await fs.mkdir(raw,{recursive:true});
  const ytArgs=['--ignore-config','--no-playlist','--no-progress','--socket-timeout','20','--retries','2','--fragment-retries','2',
    '--max-filesize',String(config.maxJobBytes),'--restrict-filenames','--no-mtime','--merge-output-format','mp4','--remux-video','mp4',
    '--format','bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best','--match-filter','!is_live','--max-downloads',String(config.maxFiles),
    '--output',path.join(raw,'%(autonumber)04d_%(id)s.%(ext)s'),...(hasCookies?['--cookies',cookie]:[]),'--',post.url];
  let result;
  if(post.platform==='facebook'&&!post.photo) result=await run('yt-dlp',ytArgs,{cwd:dir,signal,onChild});
  else {
    const cfg={extractor:{'base-directory':raw,directory:[],filename:'{num:>04}_{filename}.{extension}',
      'path-restrict':'ascii','path-remove':'\u0000-\u001f\u007f',retries:2,timeout:20,
      instagram:{videos:'merged',previews:false,audio:false},tiktok:{audio:false,covers:false,photos:true,videos:true},
      ...(hasCookies?{cookies:cookie}:{})},downloader:{ytdl:{module:'yt_dlp',format:'b[ext=mp4]/best','raw-options':{merge_output_format:'mp4',noplaylist:true,max_filesize:config.maxJobBytes}}}};
    const cfgPath=path.join(dir,'gallery.json');await fs.writeFile(cfgPath,JSON.stringify(cfg));
    result=await run('gallery-dl',['--config-ignore','--config',cfgPath,'--directory',raw,'--range','1-'+config.maxFiles,'--',post.url],{cwd:dir,signal,onChild});
    if(post.platform==='tiktok'&&!post.url.includes('/photo/')&&!(await walk(raw)).some(f=>formats[path.extname(f.path).toLowerCase()]))result=await run('yt-dlp',ytArgs,{cwd:dir,signal,onChild});
  }
  if(config.publicFallback&&!hasCookies&&!(post.platform==='facebook'&&post.photo)&&!signal.aborted&&!(await walk(raw)).some(f=>formats[path.extname(f.path).toLowerCase()])){
    result=await fallback(post,raw,config,signal);
  }
  if(signal.aborted)throw new Error('Tác vụ đã hết thời gian hoặc vượt giới hạn tài nguyên.');
  const candidates=(await walk(raw)).filter(f=>formats[path.extname(f.path).toLowerCase()]).sort((a,b)=>a.path.localeCompare(b.path,'en',{numeric:true}));
  if(!candidates.length) {
    const auth=/login|log in|cookies|private|authenticate|401|403|429|rate.limit/i.test(result.tail);
    throw new Error(auth?'Nền tảng yêu cầu đăng nhập hoặc đang giới hạn truy cập. Cần cập nhật cookie trên VPS hoặc thử lại sau.':'Không lấy được media. Bài có thể không hỗ trợ hoặc bộ tải cần cập nhật.');
  }
  if(candidates.length>config.maxFiles||candidates.reduce((s,f)=>s+f.size,0)>config.maxJobBytes)throw new Error('Bài vượt giới hạn số tệp hoặc dung lượng.');
  const files=[];
  for(const [index,file] of candidates.entries()) {
    const ext=path.extname(file.path).toLowerCase();
    if(ext==='.mp4'||ext==='.mov') {
      // MP4 can contain VP9/AV1. Normalize unsupported codecs for iPhone Photos.
      const converted=path.join(dir,`${index+1}.mp4`);
      const probe=await run('ffprobe',['-v','error','-show_entries','stream=codec_name,codec_type','-of','json',file.path],{cwd:dir,signal,onChild,capture:true});
      if(probe.code!==0)throw new Error('Video tải về không hợp lệ.');
      const streams=JSON.parse(probe.stdout).streams;
      const video=streams.find(s=>s.codec_type==='video');
      if(!video)throw new Error('Tệp không có hình ảnh video.');
      const videoArgs=video.codec_name==='h264'?['-c:v','copy']:['-c:v','libx264','-preset','veryfast','-crf','22','-pix_fmt','yuv420p','-vf','scale=trunc(iw/2)*2:trunc(ih/2)*2'];
      const audioArgs=streams.filter(s=>s.codec_type==='audio').every(s=>s.codec_name==='aac')?['-c:a','copy']:['-c:a','aac','-b:a','160k'];
      const remux=await run('ffmpeg',['-nostdin','-hide_banner','-loglevel','error','-threads','2','-i',file.path,'-map','0:v:0','-map','0:a?',...videoArgs,...audioArgs,'-movflags','+faststart','-y',converted],{cwd:dir,signal,onChild});
      if(remux.code!==0)throw new Error('Không đóng gói được video MP4 tương thích.');
      files.push({name:`${index+1}.mp4`,mime:'video/mp4',size:(await fs.stat(converted)).size});
    } else {
      // Decode and normalize images: prevents returning HTML or thumbnails as fake media files.
      const converted=path.join(dir,`${index+1}.jpg`);
      const normalized=await run('ffmpeg',['-nostdin','-hide_banner','-loglevel','error','-i',file.path,'-frames:v','1','-q:v','2','-y',converted],{cwd:dir,signal,onChild});
      if(normalized.code!==0)throw new Error('Tệp ảnh tải về không hợp lệ.');
      files.push({name:`${index+1}.jpg`,mime:'image/jpeg',size:(await fs.stat(converted)).size});
    }
  }
  await fs.rm(raw,{recursive:true,force:true});await fs.rm(path.join(dir,'gallery.json'),{force:true});await fs.rm(cookie,{force:true});
  return {files,provider:result.provider?'public-fallback':'direct',warning:result.code!==0?'Chỉ lấy được một phần bài đăng. Một số tệp không tải được.':candidates.length===config.maxFiles?'Đã chạm giới hạn số tệp; bài có thể còn media chưa tải.':''};
}
module.exports={downloadPost,walk};
