const test=require('node:test'),assert=require('node:assert/strict');
const {instagramURLs}=require('../../server/fallback.cjs');
const item=(name,ext='jpg',quality=1080)=>({url:'https://media.example.test/'+name+'.'+ext,ext,quality});
test('single Reel object is accepted without downloading thumbnail or multiple qualities',()=>{
 const low=item('low','mp4',720),high=item('high','mp4',1080);
 assert.deepEqual(instagramURLs({url:[item('cover'),low,high],thumb:'https://media.example.test/preview.jpg',meta:{dash_manifest:'not a media file'}}),[{url:high.url,ext:'mp4'}]);
});
test('carousel array keeps media order, including mixed photos and videos',()=>{
 const a=item('first'),b=item('second','mp4'),c=item('third','webp');
 assert.deepEqual(instagramURLs([{url:[a]},{url:[b]},{url:[c]}]),[a,b,c].map(({url,ext})=>({url,ext})));
});
test('single photo object uses one supported image variant',()=>{
 const a=item('photo');assert.deepEqual(instagramURLs({url:[a]}),[{url:a.url,ext:'jpg'}]);
});
test('empty, missing, malformed and unsupported media cannot look like a successful album',()=>{
 for(const value of [null,undefined,[],{}, {url:[]},{url:[{url:'https://media.example.test/video.m3u8',ext:'m3u8'}]},[{url:[item('valid')]},{url:[]}]])assert.throws(()=>instagramURLs(value));
});
test('malformed URLs, credentials, non-HTTPS and nonstandard ports are rejected',()=>{
 for(const url of ['not-a-url','http://media.example.test/a.mp4','https://user:secret@media.example.test/a.mp4','https://media.example.test:8080/a.mp4'])assert.throws(()=>instagramURLs({url:[{url,ext:'mp4'}]}));
});
