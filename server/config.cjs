const fs = require('node:fs');
const path = require('node:path');
function loadConfig(env=process.env) {
  const integer=(key,fallback,min,max)=>{const n=Number(env[key]??fallback);if(!Number.isInteger(n)||n<min||n>max)throw new Error('Invalid '+key);return n;};
  const secret=(key)=>env[key+'_FILE']?fs.readFileSync(env[key+'_FILE'],'utf8').trim():(env[key]||'');
  const token=secret('API_TOKEN');
  if(!/^[a-f0-9]{64}$/.test(token))throw new Error('API_TOKEN must be 64 random hex characters.');
  return {token,setupToken:secret('SETUP_TOKEN'),dataDir:path.resolve(env.DATA_DIR||'data'),
    port:integer('PORT',8787,0,65535),host:env.HOST||'0.0.0.0',
    concurrency:integer('CONCURRENCY',1,1,4),maxQueue:integer('MAX_QUEUE',8,1,100),
    maxFiles:integer('MAX_FILES',100,1,500),maxJobBytes:integer('MAX_JOB_MB',512,1,2048)*1024*1024,
    maxCacheBytes:integer('MAX_CACHE_MB',2048,10,10240)*1024*1024,
    timeoutMs:integer('JOB_TIMEOUT_SECONDS',600,10,1800)*1000,
    ttlMs:integer('FILE_TTL_SECONDS',3600,60,86400)*1000,
    cookiesDir:path.resolve(env.COOKIES_DIR||'cookies'),
    publicFallback:env.ALLOW_PUBLIC_FALLBACK==='1',
    publicURL:env.PUBLIC_URL||'http://localhost:8787',version:require('../package.json').version};
}
module.exports={loadConfig};
