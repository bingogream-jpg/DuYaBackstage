const fs=require('fs');
const path=require('path');
const crypto=require('crypto');

const root=path.resolve(__dirname,'..');
const role='mini';

const baseDir=path.join(root,'base');
const dataDir=path.join(root,'data');
const resDir=path.join(root,'res');
const distDir=path.join(root,'dist');
const sourceFiles=new Set();
const read=(base,relative)=>{
 const file=path.join(base,relative);
 sourceFiles.add(path.relative(root,file).replaceAll('\\','/'));
 return fs.readFileSync(file,'utf8');
};
const readSrc=name=>read(path.join(root,'src'),name);
const readBase=name=>read(baseDir,name);
const readData=name=>read(dataDir,name);
const jsInline=value=>value.replace(/<\/script/gi,'<\\/script');
const jsonInline=value=>JSON.stringify(value).replace(/</g,'\\u003c');

const commonJs=[
 'engine-r18.js','metrics-r19.js','engine-r20.js','data-r21.js',
 'invite-r23-data.js','engine-r25.js','engine-r26.js','engine-r28.js','engine-r31.js',
 'engine-r36.js','engine-r36-units.js','engine-r36-review.js','engine-r37.js',
 'engine-r37-comments.js','engine-r37-followup.js','engine-r38.js','engine-r38-diet.js','engine-r39-mode.js','engine-r39-recipes.js'
];
const demoJs=['demo.js','demo-r8.js','demo-r9.js','demo-r13.js','demo-r14.js','demo-r15.js','demo-r16.js','demo-r17.js','demo-r18.js','demo-r20.js','demo-diet-r33.js'];
const commonCss=[
 'local.css','growth.css','r18.css','r19.css','r20.css','r21.css','r22.css','r23.css','r24.css',
 'r25.css','r26.css','r27.css','r28.css','r29.css','r30.css','r31.css','r32.css','r33.css',
 'r37.css','r37-reward-status.css','r37-followup.css','r38.css','r38-diet.css'
];
const miniJs=[
 'invite-mini.js','growth-mini.js','mini-r20.js','mini-r23.js','qr-r13.js','mini-r25.js',
 'mini-r26.js','mini-r26.1.js','mini-r27.js','r29-slider.js','mini-r29.js','mini-r30.js',
 'mini-r31.js','mini-r33-refresh.js','mini-r35.js','mini-r36.js','mini-r36-visual.js',
 'mini-r36-refine.js','mini-r36-units.js','mini-r36-review.js','mini-r37.js',
 'mini-r37-diet.js','mini-r37-home.js','mini-r37-followup.js','mini-r38.js','mini-r38-diet.js','mini-r39-recipes.js','mini-r39-mode.js'
];
const miniRoleCss=['r33-mini-refresh.css','r33-comments.css','r35-mini.css','r36-mini.css','r36-visual.css','r36-refine.css','r36-units.css','r36-review.css','r37-diet.css','r37-home.css'];
const append=(items)=>items.map(readSrc).join('\n');

let engine=readSrc('store-source.js')
 .replace(/^const fs=require\('fs'\),path=require\('path'\);\r?\n/,'')
 .replace(/^const seed=require\('\.\/seed\.json'\);\r?\n/m,'const seed=window.__DUYA_SEED__;\n')
 .replace(/constructor\(\{file=[\s\S]*?this\.persist\(\);\}/,'constructor({initial,persist=()=>{},now=Date.now}={}){this.now=now;this.persistToBrowser=persist;this.data=clone(initial||fresh(now()));}')
 .replace(/persist\(\)\{const p=this\.file[\s\S]*?fs\.renameSync\(p,this\.file\);\}/,'persist(){this.persistToBrowser(clone(this.data));}')
 .replace("w.status='已使用';w.orderId='order-'+p.token;","w.status='已使用';w.orderId='order-'+p.token;w.usedAt=new Date(this.now()).toISOString();")
 .replace("delete w.orderId;}return o;","delete w.orderId;delete w.usedAt;}return o;")
 .replace("settings:{enabled:true,start:'2026-10-01',end:'2027-12-31',cap:10,target:'both'","settings:{enabled:true,start:'2026-10-01',end:'2027-12-31',cap:10,target:'both',bindWindowDays:7,condition:{type:'profile_complete'},conditionLabel:'完成初始设置'")
 .replace('module.exports={Store,fresh,dateKey,nutrients};','window.__DUYA_LOCAL_ENGINE={Store,fresh,dateKey,nutrients};');
engine='(()=>{\n'+engine+'\n})();\n'+append(commonJs);

const seed=JSON.parse(readData('seed.json'));
const vm=require('vm');
const context={window:{__DUYA_SEED__:seed}};
vm.createContext(context);
vm.runInContext(engine,context);
for(const file of demoJs)vm.runInContext(readSrc(file),context);
const initial=JSON.parse(readData('initial-state.json'));
context.window.R25Data?.migrate(initial);
context.window.R26Data?.migrate(initial);
context.window.R31Data?.migrate(initial);
context.window.R36Data?.migrate(initial);
context.window.R36Measure?.migrate(initial);
context.window.R36Review?.migrate(initial);
context.window.R37Activities?.migrate(initial);
context.window.R37CommentsData?.migrate(initial);
context.window.R37Followup?.migrate(initial);
context.window.R38Data?.migrate(initial);
fs.writeFileSync(path.join(dataDir,'initial-state.json'),JSON.stringify(initial,null,2));

function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]);}
const mime={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.gif':'image/gif','.woff2':'font/woff2'};
function mapFiles(dir,prefix,map){
 for(const file of walk(dir)){
  const ext=path.extname(file).toLowerCase();
  if(!mime[ext])continue;
  sourceFiles.add(path.relative(root,file).replaceAll('\\','/'));
  map[prefix+'/'+path.relative(dir,file).replaceAll('\\','/')]='data:'+mime[ext]+';base64,'+fs.readFileSync(file).toString('base64');
 }
}
const assetsMap={};
mapFiles(path.join(baseDir,'assets'),'assets',assetsMap);
if(role==='mini')for(const dir of fs.readdirSync(resDir,{withFileTypes:true}).filter(entry=>entry.isDirectory()))mapFiles(path.join(resDir,dir.name),dir.name,assetsMap);
const embed=value=>{
 for(const [key,data] of Object.entries(assetsMap).sort((a,b)=>b[0].length-a[0].length))value=value.split(key).join(data);
 return value;
};

let app=readBase('app.bundle.js');
app=app.replace('  /* ============================ 启动 ============================ */',()=>append(miniJs)+'\n  /* ============================ 启动 ============================ */');
app=app.replaceAll('esc(src)','esc(window.__offlineAsset(src))');
app=app.replace("v15Num(i.grams) + ' g'","(i.grams==null?'份量待确认':v15Num(i.grams)+' g')");
app=app.replace('<option value="NEW">首次登录用户</option><option value="INV">邀请人 · 已有计划</option><option value="PAID">已购新用户 · 可补填</option>','<option value="NEW">新用户</option><option value="INV">老用户</option>');
app=app
 .replaceAll('duya-r4-user','duya-local-r39-mini-user')
 .replaceAll('duya-r4-ui-','duya-local-r39-mini-ui-')
 .replaceAll('duya-v15-r4','duya-local-r39-mini')
 .replaceAll('duya-admin-v15-r4','duya-local-r39-admin')
 .replaceAll('V1.5-r4 联动演示','本地文件演示')
 .replaceAll('已连接 · ','本地演示 · ')
 .replaceAll('两端共用实时演示数据，保存后小程序读取同一份配置。','后台与小程序共用本地业务数据，两个文件可独立打开。')
 .replaceAll('后台与小程序在同一目录共用本地业务数据。','后台与小程序共用本地业务数据，构建与资源完全独立。')
 .replaceAll('两端已同步','本地已保存')
 .replaceAll('推荐配置已同步','推荐配置已保存')
 .replace("catch(err){toast('操作未完成',err.message,'error');","catch(err){if(err.cancelled)return false;toast('操作未完成',err.message,'error');")
 .replaceAll('duya-local-r26-','duya-local-r39-');
app=embed(app);

let html=readBase('index.html').replace(/<title>.*?<\/title>/,'<title>渡鸦管家 · 小程序本地文件版</title>');
html=html.replace('<html lang="zh-CN">','<html lang="zh-CN" data-local-role="'+role+'">');
html=html.replace(/<link\b([^>]*?)rel="stylesheet"([^>]*?)>/g,tag=>{
 const file=/href="([^"]+)"/.exec(tag)?.[1]?.split('?')[0];
 return file?'<style>'+embed(readBase(file))+'</style>':tag;
});
const commonStyle=commonCss.map(readSrc).join('\n')+'\n'+miniRoleCss.map(readSrc).join('\n');
const postStyle=readSrc('r37-comments.css')+'\n'+readSrc('r39-navigation.css')+'\n'+readSrc('r39-recipes.css')+'\n'+readSrc('r39-mode.css');
html=html.replace('</head>',()=>'<style>'+commonStyle+'</style><style data-r39-final-style>'+postStyle+'</style></head>');

const legacyInitial=JSON.parse(readData('legacy-initial-state.json'));
const boot='window.__DUYA_LEGACY_INITIAL__='+jsonInline(legacyInitial)+';window.__DUYA_LOCAL_ROLE__='+jsonInline(role)+';window.__DUYA_SEED__='+jsonInline(seed)+';window.__DUYA_INITIAL__='+jsonInline(initial)+';window.__OFFLINE_ASSETS__='+jsonInline(assetsMap)+';window.__offlineAsset=function(src){return window.__OFFLINE_ASSETS__[String(src).replace(/^\\.\\//,"")]||src;};\n'
 +engine+'\n'+readSrc('confirm.js')+'\n'+append(demoJs)+'\n'+readSrc('storage-r37.js')+'\n'+readSrc('local-client.js');
html=html.replace(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g,(tag,src)=>{
 if(src==='/client.js')return '<script>'+jsInline(boot)+'</script>';
 if(src.startsWith('app.'))return '<script>'+jsInline(app)+'</script>';
 return '<script>'+jsInline(embed(readBase(src.split('?')[0])))+'</script>';
});
html=html.replaceAll('duya-v15-r4','duya-local-r39-mini');
const postScript=readSrc('mini-r37-comments.js')+'\n'+readSrc('mini-r39-navigation.js');
const bodyEnd=html.lastIndexOf('</body>');
const suffix=html.slice(bodyEnd);
html=html.slice(0,bodyEnd)+'<script data-r39-final-script>'+jsInline(postScript)+'</script>';
html+='<script>'+jsInline(readSrc('transfer-tools.js'))+'</script>';
html+=suffix;

fs.mkdirSync(distDir,{recursive:true});
const generatedEngine=path.join(root,'src','engine.browser.js');
if(fs.existsSync(generatedEngine))fs.unlinkSync(generatedEngine);
const fileName='渡鸦管家-小程序.html';
const artifactPath=path.join(distDir,fileName);
fs.writeFileSync(artifactPath,html);
const artifact=fs.readFileSync(artifactPath);
const manifest={
 version:'V1.5-r39',
 role,
 storageKey:'duya-local-r39-data',
 generatedAt:new Date().toISOString(),
 artifact:{file:'dist/'+fileName,bytes:artifact.length,sha256:crypto.createHash('sha256').update(artifact).digest('hex').toUpperCase()},
 sourceFiles:[...sourceFiles].filter(file=>fs.existsSync(path.join(root,file))).sort().map(file=>{
  const content=fs.readFileSync(path.join(root,file));
  return {path:file,bytes:content.length,sha256:crypto.createHash('sha256').update(content).digest('hex').toUpperCase()};
 })
};
sourceFiles.add('tools/build.js');
manifest.sourceFiles=[...sourceFiles].filter(file=>fs.existsSync(path.join(root,file))).sort().map(file=>{
 const content=fs.readFileSync(path.join(root,file));
 return {path:file,bytes:content.length,sha256:crypto.createHash('sha256').update(content).digest('hex').toUpperCase()};
});
fs.writeFileSync(path.join(root,'build-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(role,fileName,Math.round(artifact.length/1024)+' KB',manifest.artifact.sha256);
