import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:720},isMobile:true,hasTouch:true});
const consoleErrors=[];
const pageErrors=[];
page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
page.on('pageerror',e=>pageErrors.push(e.message));
const assert=(v,m)=>{if(!v)throw new Error(m)};

await page.goto(process.env.TARGET_URL||'http://127.0.0.1:4173/',{waitUntil:'networkidle'});
await page.evaluate(()=>localStorage.clear());
await page.reload({waitUntil:'networkidle'});
assert(await page.locator('#tileGrid .app-item').count()===17,'home icon count mismatch');
assert(await page.locator('#dockGrid .app-item').count()===4,'dock icon count mismatch');

await page.locator('#editBtn').click();
assert(await page.locator('body').evaluate(el=>el.classList.contains('editing')),'edit mode did not activate');

const source=page.locator('#dockGrid .dock-app').nth(0);
const target=page.locator('#dockGrid .dock-app').nth(2);
const sb=await source.boundingBox();
const tb=await target.boundingBox();
assert(sb&&tb,'dock bounds unavailable');

await page.mouse.move(sb.x+sb.width/2,sb.y+sb.height/2);
await page.mouse.down();
await page.mouse.move(sb.x+sb.width/2+12,sb.y+sb.height/2+4,{steps:2});
await page.waitForTimeout(30);

const ghost=page.locator('.drag-ghost');
assert(await ghost.count()===1,'drag ghost did not appear');
const g1=await ghost.evaluate(el=>{
  const s=getComputedStyle(el);
  return {left:s.left,top:s.top,transform:s.transform,animation:s.animationName,willChange:s.willChange};
});
assert(parseFloat(g1.left)===0&&parseFloat(g1.top)===0,'ghost still uses left/top positioning');
assert(g1.transform!=='none','ghost transform missing');
assert(g1.animation==='none','drag ghost is still jiggling');
assert(g1.willChange.includes('transform'),'ghost transform is not compositor-hinted');

const positions=[];
for(let i=1;i<=14;i++){
  const x=sb.x+sb.width/2+(tb.x-sb.x)*i/14;
  const y=sb.y+sb.height/2+(tb.y-sb.y)*i/14;
  await page.mouse.move(x,y);
  await page.waitForTimeout(10);
  positions.push(await ghost.evaluate(el=>getComputedStyle(el).transform));
}
assert(new Set(positions).size>=8,'ghost transform did not update smoothly enough');

await page.mouse.move(tb.x+tb.width/2,tb.y+tb.height/2,{steps:4});
await page.waitForTimeout(40);
await page.mouse.up();
await page.waitForTimeout(120);

assert(await page.locator('.drag-ghost').count()===0,'drag ghost remained after drop');
assert(!(await page.locator('body').evaluate(el=>el.classList.contains('drag-active'))),'drag-active remained after drop');

const order=await page.locator('#dockGrid .dock-app').evaluateAll(ns=>ns.map(n=>n.dataset.id));
assert(order.join(',')!=='ai,line,calendar,settings','dock order did not change');

const dockBefore=await page.locator('#dockGrid').boundingBox();
await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
await page.waitForTimeout(80);
const dockAfter=await page.locator('#dockGrid').boundingBox();
assert(dockBefore&&dockAfter&&Math.abs(dockBefore.y-dockAfter.y)<2,'dock moved on page scroll');

assert(consoleErrors.length===0,'console errors: '+consoleErrors.join(' | '));
assert(pageErrors.length===0,'page errors: '+pageErrors.join(' | '));

await page.screenshot({path:'smooth-drag-check.png',fullPage:true});
console.log(JSON.stringify({ok:true,ghost:g1,dockOrder:order,transformSamples:new Set(positions).size,consoleErrors,pageErrors},null,2));
await browser.close();

// trigger runtime check
