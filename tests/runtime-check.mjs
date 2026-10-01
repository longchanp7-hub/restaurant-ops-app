import { chromium } from 'playwright';

const base = process.env.TARGET_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:390,height:640}, isMobile:true, hasTouch:true});
const consoleErrors=[];
const pageErrors=[];
page.on('console', msg => { if(msg.type()==='error') consoleErrors.push(msg.text()); });
page.on('pageerror', err => pageErrors.push(err.message));

function assert(condition, message){
  if(!condition) throw new Error(message);
}

await page.goto(base,{waitUntil:'networkidle'});
await page.evaluate(() => localStorage.clear());
await page.reload({waitUntil:'networkidle'});

const homeCount = await page.locator('#tileGrid .app-item').count();
const dockCount = await page.locator('#dockGrid .app-item').count();
assert(homeCount===17, 'Expected 17 home icons, got '+homeCount);
assert(dockCount===4, 'Expected 4 dock icons, got '+dockCount);
assert(await page.locator('[data-id="website"]').count()===1, 'Homepage icon is missing');

const wallpaper = await page.locator('.wallpaper').evaluate(el => {
  const s=getComputedStyle(el);
  return {position:s.position,backgroundImage:s.backgroundImage,zIndex:s.zIndex};
});
assert(wallpaper.position==='fixed', 'Wallpaper is not fixed');
assert(wallpaper.backgroundImage && wallpaper.backgroundImage!=='none', 'Wallpaper background not rendered');

const dockStyle = await page.locator('#dockGrid').evaluate(el => {
  const s=getComputedStyle(el);
  return {position:s.position,bottom:s.bottom,touchAction:s.touchAction};
});
assert(dockStyle.position==='fixed', 'Dock must be fixed, got '+dockStyle.position);

const controlsStyle = await page.locator('.home-controls').evaluate(el => getComputedStyle(el).position);
assert(controlsStyle==='fixed', 'Search/page controls must be fixed');

const dockBefore = await page.locator('#dockGrid').boundingBox();
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(150);
const dockAfter = await page.locator('#dockGrid').boundingBox();
assert(dockBefore && dockAfter, 'Dock bounding box unavailable');
assert(Math.abs(dockBefore.y-dockAfter.y)<2, 'Dock moved while page scrolled');

// Homepage icon opens the placeholder sheet.
await page.locator('[data-id="website"] .tile-main').click();
await page.waitForTimeout(80);
assert((await page.locator('#sheetTitle').textContent())==='ホームページ', 'Homepage sheet did not open');
await page.locator('#closeSheet').click();

// Return to top and long-press a dock icon to enter edit mode.
await page.evaluate(() => window.scrollTo(0,0));
const firstDock = page.locator('#dockGrid .dock-app').first();
const firstBox = await firstDock.boundingBox();
assert(firstBox, 'First dock icon missing');
await page.mouse.move(firstBox.x+firstBox.width/2, firstBox.y+firstBox.height/2);
await page.mouse.down();
await page.waitForTimeout(620);
await page.mouse.up();
assert(await page.locator('body').evaluate(el=>el.classList.contains('editing')), 'Dock long-press did not enter edit mode');
assert(await page.locator('#dockGrid .dock-remove').count()===4, 'Dock remove controls not rendered in edit mode');

// Drag first dock icon onto the third icon; dock order must change without page auto-scroll.
const dockItems = page.locator('#dockGrid .dock-app');
const source = await dockItems.nth(0).boundingBox();
const target = await dockItems.nth(2).boundingBox();
assert(source && target, 'Dock drag boxes unavailable');
const scrollBeforeDrag = await page.evaluate(()=>scrollY);
await page.mouse.move(source.x+source.width/2, source.y+source.height/2);
await page.mouse.down();
await page.mouse.move(source.x+source.width/2+10, source.y+source.height/2,{steps:2});
await page.mouse.move(target.x+target.width/2, target.y+target.height/2,{steps:8});
await page.waitForTimeout(80);
await page.mouse.up();
await page.waitForTimeout(100);
const dockOrderAfter = await page.locator('#dockGrid .dock-app').evaluateAll(nodes=>nodes.map(n=>n.dataset.id));
assert(dockOrderAfter.join(',')!=='ai,line,calendar,settings', 'Dock drag did not change order');
const scrollAfterDrag = await page.evaluate(()=>scrollY);
assert(Math.abs(scrollAfterDrag-scrollBeforeDrag)<4, 'Page auto-scrolled during dock drag');

// Drag a home icon into a full dock. The target dock app should swap back to home.
const sales = page.locator('[data-id="sales"]');
const salesBox = await sales.boundingBox();
const targetDockBox = await page.locator('#dockGrid .dock-app').nth(1).boundingBox();
assert(salesBox && targetDockBox, 'Home-to-dock drag boxes unavailable');
const targetDockId = await page.locator('#dockGrid .dock-app').nth(1).getAttribute('data-id');
await page.mouse.move(salesBox.x+salesBox.width/2, salesBox.y+salesBox.height/2);
await page.mouse.down();
await page.mouse.move(salesBox.x+salesBox.width/2+10, salesBox.y+salesBox.height/2+10,{steps:2});
await page.mouse.move(targetDockBox.x+targetDockBox.width/2,targetDockBox.y+targetDockBox.height/2,{steps:10});
await page.mouse.up();
await page.waitForTimeout(100);
const newDockIds = await page.locator('#dockGrid .dock-app').evaluateAll(nodes=>nodes.map(n=>n.dataset.id));
const newHomeIds = await page.locator('#tileGrid .app-item').evaluateAll(nodes=>nodes.map(n=>n.dataset.id));
assert(newDockIds.includes('sales'), 'Home icon did not move into full dock');
assert(targetDockId && newHomeIds.includes(targetDockId), 'Displaced dock icon did not return to home');

// Hide and restore an icon.
const website = page.locator('[data-id="website"]');
await website.locator('.remove-home').click({force:true});
assert(await page.locator('[data-id="website"]').count()===0, 'Website icon did not hide');
await page.locator('#addCard').click();
assert((await page.locator('#sheetTitle').textContent())==='機能を追加', 'Add sheet did not open');
const websiteRow = page.locator('.hidden-item').filter({hasText:'ホームページ'});
assert(await websiteRow.count()===1, 'Hidden homepage item missing from add sheet');
await websiteRow.locator('button').click({force:true});
await page.locator('#closeSheet').click();
assert(await page.locator('[data-id="website"]').count()===1, 'Website icon did not restore');

assert(consoleErrors.length===0, 'Console errors: '+consoleErrors.join(' | '));
assert(pageErrors.length===0, 'Page errors: '+pageErrors.join(' | '));

await page.screenshot({path:'runtime-check-mobile.png',fullPage:true});
console.log(JSON.stringify({
  ok:true,
  homeCount,
  dockCount,
  wallpaper,
  dockStyle,
  dockOrderAfter,
  newDockIds,
  consoleErrors,
  pageErrors
},null,2));

await browser.close();
