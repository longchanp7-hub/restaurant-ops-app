import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.goto('https://longchanp7-hub.github.io/restaurant-ops-app/',{waitUntil:'networkidle'});
await page.evaluate(()=>localStorage.clear());
await page.reload({waitUntil:'networkidle'});

const count=await page.locator('#tileGrid .app-item').count();
if(count!==21) throw new Error('expected 21 home icons, got '+count);
if(await page.locator('#dockGrid').count()) throw new Error('dockGrid still exists');
if(await page.locator('.ios-dock').count()) throw new Error('ios-dock still exists');
if(await page.locator('.home-controls').count()) throw new Error('bottom search/page controls still exist');

for(const id of ['ai','line','calendar','settings']){
  if(await page.locator(`#tileGrid [data-id="${id}"]`).count()!==1) throw new Error(id+' not migrated to home grid');
}

await page.locator('#editBtn').click();
const line=page.locator('#tileGrid [data-id="line"]');
const target=page.locator('#tileGrid [data-id="calendar"]');
const lb=await line.boundingBox();
const tb=await target.boundingBox();
if(!lb||!tb) throw new Error('drag targets missing');
await page.mouse.move(lb.x+lb.width/2,lb.y+lb.height/2);
await page.mouse.down();
await page.mouse.move(lb.x+lb.width/2+10,lb.y+lb.height/2+5,{steps:2});
await page.mouse.move(tb.x+tb.width/2,tb.y+tb.height/2,{steps:8});
await page.mouse.up();
await page.waitForTimeout(100);

if(errors.length) throw new Error('runtime errors: '+errors.join(' | '));
await page.screenshot({path:'nodock-production.png',fullPage:true});
console.log(JSON.stringify({ok:true,homeCount:count,dock:false,errors},null,2));
await browser.close();
