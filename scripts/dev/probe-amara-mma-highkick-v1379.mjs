import { chromium } from '@playwright/test';
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:360,height:590},deviceScaleFactor:1});
 const url='http://127.0.0.1:4173/#/lab?champion=mma-amara&d=mma&tenue=mma&tech=high-kick-arriere&az=40&light=app&zoom=1';
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__labReady===true&&window.__labOutfit==='portee',null,{timeout:120000});
 await page.waitForTimeout(1100);
 for(let y=270;y<=385;y+=10){
  const line=[];
  for(let x=95;x<=215;x+=10){
   const p=await page.evaluate(([x,y])=>typeof window.__labPick==='function'?window.__labPick(x,y):[],[x,y]);
   const a=p[0];
   let tag='-';
   if(a){tag=a.mesh?.includes('short-vale-tudo')?'S':a.mesh?.includes('haut-')?'T':a.mesh?.includes('bande-')?'B':a.mesh?.includes('body')?'D':a.mesh?.includes('photo')?'P':'X';}
   line.push(tag);
   if(x>=115&&x<=195&&y>=300&&y<=380&&p.length>0)console.log('PICK',x,y,JSON.stringify(p.slice(0,3)));
  }
  console.log('GRID',y,line.join(''));
 }
 const out=await page.evaluate(()=>window.__labStretch(3,.04).filter(x=>x.mesh.includes('short-vale-tudo')));
 console.log('STRETCHED',out.length,JSON.stringify(out.slice(0,16)));
}finally{await browser.close();}
