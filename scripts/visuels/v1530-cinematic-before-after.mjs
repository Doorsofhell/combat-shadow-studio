// v1.53 - matched baseline 1.51.0 vs optional cinematic lighting from real WebGL.
// Same camera, coach, pose, kit, viewport, engine; only lighting differs.
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = 'captures/v1530-lighting';
const cases = [
  ['kadir','mma-kadir',0,'front'],['kadir','mma-kadir',35,'three-quarter'],['kadir','mma-kadir',90,'profile'],
  ['amara','mma-amara',0,'front'],['amara','mma-amara',35,'three-quarter'],['amara','mma-amara',90,'profile'],
];
const servers = [], manifest = [];
const browser = await chromium.launch({
  headless:true, args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],
});
try {
  for (const [dir,port] of [[resolve('reference-v1510'),5271],[process.cwd(),5272]]) {
    const vite = await createServer({root:dir,logLevel:'error',server:{port,strictPort:true,hmr:false,watch:null}});
    await vite.listen(); servers.push(vite);
  }
  for (const [coach,champion,az,angle] of cases) {
    for (const [label,port] of [['avant',5271],['apres',5272]]) {
      const page=await browser.newPage({viewport:{width:700,height:900},deviceScaleFactor:1,colorScheme:'dark'});
      const errors=[];
      page.on('pageerror', e=>errors.push(String(e)));
      page.on('console', m=>{if(m.type()==='error' && /shader|webgl|compile|GLSL/i.test(m.text())) errors.push(m.text());});
      const q=new URLSearchParams({champion,look:'realiste',d:'mma',tenue:'mma',motion:'garde',
        style:'mma',az:String(az),el:'6',span:'1.04',fy:'0.86',mood:'1',alpha:'1',cinema:'1'});
      try {
        await page.goto('http://localhost:'+port+'/#/lab?'+q,{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__labReady === true,null,{timeout:120000});
        await page.waitForFunction(()=>['portee','aucune','erreur'].includes(window.__labOutfit),null,{timeout:90000});
        const status=await page.evaluate(()=>window.__labOutfit);
        if(status!=='portee') throw Error('Outfit unavailable: '+status);
        await page.waitForTimeout(1300);
        if(errors.length)throw Error(errors.join(' | '));
        const png=await page.evaluate(()=>document.querySelector('canvas')?.toDataURL('image/png'));
        if(!png?.startsWith('data:image/png;base64,')) throw Error('Missing rendered canvas');
        const buffer=Buffer.from(png.split(',')[1],'base64');
        if(buffer.length<15000)throw Error('Empty WebGL image: '+buffer.length);
        mkdirSync(root+'/'+label,{recursive:true});
        writeFileSync(root+'/'+label+'/'+coach+'-'+angle+'.png',buffer);
        manifest.push({coach,champion,angle,az,label,status:'ok',bytes:buffer.length,
          lighting:label==='avant'?'1.51.0 mood lighting':'1.53.0 cinematic opt-in'});
        console.log('WEBGL',coach,angle,label,buffer.length);
      }catch(error){
        manifest.push({coach,angle,label,status:'failed',error:String(error)});
        console.error('WEBGL FAILED',coach,angle,label,String(error));
      }finally{await page.close();}
    }
  }
}finally{
  mkdirSync(root,{recursive:true});
  writeFileSync(root+'/manifest.json',JSON.stringify(manifest,null,2));
  await browser.close();
  for(const server of servers)await server.close();
}
if(manifest.length!==cases.length*2 || manifest.some(x=>x.status!=='ok'))process.exitCode=1;
