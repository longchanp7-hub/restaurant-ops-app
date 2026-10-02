/* Runs against an isolated browser profile; never uses a real customer's storage. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {createServer}=require('../scripts/serve.cjs');
const M=require('../ops-model.js');
const evidence=path.resolve(process.env.EVIDENCE_DIR||'test-results');

(async()=>{
  await fs.mkdir(evidence,{recursive:true});
  const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=process.env.APP_URL||'http://127.0.0.1:'+server.address().port;
  let browser,page;const errors=[],checks=[],externalRequests=[];
  const check=(name)=>{checks.push(name);console.log('PASS '+name);};
  try{
    browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:'ja-JP',timezoneId:'Asia/Tokyo',acceptDownloads:true});
    const ids=['sales','shift','stock','staff','accounting','tasks','reports','alerts','booking','customers','menu','help','website','instagram','facebook','x','tiktok','ai','line','calendar','settings'];
    const layout={home:['menu',...ids.filter(x=>!['menu','facebook'].includes(x))],dock:[],hidden:['facebook']};
    await context.addInitScript(value=>{if(!localStorage.getItem('restaurantOpsHome.v3'))localStorage.setItem('restaurantOpsHome.v3',JSON.stringify(value));},layout);
    page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',msg=>{if(msg.type()==='error'&&!msg.text().includes('favicon'))errors.push(msg.text());});
    page.on('request',req=>{if(/^https?:/.test(req.url())&&new URL(req.url()).origin!==new URL(url).origin)externalRequests.push(req.url());});
    page.on('dialog',dialog=>dialog.dismiss());
    await page.goto(url);await page.locator('[data-id=sales]').waitFor();
    const visibleCount=await page.locator('.tile').count();assert.equal(visibleCount,20);assert.equal(await page.locator('.badge').count(),0);
    assert.equal(await page.locator('.tile').first().getAttribute('data-id'),'menu');
    assert.deepEqual(JSON.parse(await page.evaluate(()=>localStorage.getItem('restaurantOpsHome.v3'))),layout);
    assert.equal(await page.locator('.tile-grid').evaluate(n=>getComputedStyle(n).gridTemplateColumns.split(' ').length),4);
    await page.screenshot({path:path.join(evidence,'01-home-mobile.png')});check('existing four-column home, hidden icon and zero fake badges');
    const click=async name=>page.getByRole('button',{name,exact:true}).click();
    const close=async()=>{if(await page.locator('#bottomSheet').isVisible())await click('閉じる');};
    const open=async id=>{await close();await page.locator('[data-id='+id+'] .tile-main').click();await page.locator('#bottomSheet').waitFor({state:'visible'});};
    const fill=async(name,value)=>page.locator('[name="'+name+'"]').fill(String(value));
    const select=async(name,value)=>page.locator('[name="'+name+'"]').selectOption({label:value});
    const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('restaurantOpsData.v1')));
    const saved=async(type,count)=>{await click('保存');await page.waitForFunction(({type,count})=>JSON.parse(localStorage.getItem('restaurantOpsData.v1'))?.entities[type]?.length===count,{type,count});await page.waitForFunction(()=>!document.querySelector('.ops-form'));};
    const today=M.today();

    await open('settings');await fill('name','検証用食堂');await fill('seats',20);await fill('target',300000);await click('保存');await page.waitForFunction(()=>document.querySelector('#storeBtn strong').textContent==='検証用食堂');
    await open('staff');await click('スタッフを追加');await fill('name','テスト担当');await fill('wage',1200);await saved('staff',1);
    await open('menu');await click('商品を追加');await fill('name','テスト定食');await fill('price',1100);await fill('cost',400);await saved('menu',1);
    await open('customers');await click('顧客を追加');await fill('name','テスト顧客');await fill('phone','000-0000-0000');await saved('customers',1);
    check('settings, staff, menu and customer CRUD');

    await open('sales');await click('売上を追加');await select('customerId','テスト顧客');await fill('guests',2);
    await page.getByLabel('登録メニュー',{exact:true}).selectOption({label:'テスト定食'});
    await page.getByLabel('明細の数量',{exact:true}).fill('2');await fill('discount',200);
    await click('明細を追加');await page.getByLabel('明細の商品名',{exact:true}).nth(1).fill('サービスのお茶');await page.getByLabel('明細の数量',{exact:true}).nth(1).fill('2');
    assert.match(await page.locator('.ops-total').textContent(),/2,000/);await saved('sales',1);
    assert.match(await page.locator('.ops-records').textContent(),/2,000/);
    assert.equal((await state()).entities.sales[0].lines.length,2);
    await click('詳細・編集');await fill('discount',300);await click('保存');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('restaurantOpsData.v1')).entities.sales[0].discount===300);
    await page.reload();await open('sales');assert.match(await page.locator('.ops-records').textContent(),/1,900/);
    await page.getByLabel('記録を検索').fill('見つからない名前');assert.match(await page.locator('.ops-empty').textContent(),/該当する記録/);await page.getByLabel('記録を検索').fill('');
    const csvDownloadPromise=page.waitForEvent('download');await click('表示対象をCSV保存');const csvDownload=await csvDownloadPromise;await csvDownload.saveAs(path.join(evidence,'sales-test.csv'));assert.match(await fs.readFile(path.join(evidence,'sales-test.csv'),'utf8'),/サービスのお茶/);
    check('multiple receipt lines, totals, edit, reload, filters and CSV export');

    await open('shift');await click('シフトを追加');await select('staffId','テスト担当');assert.equal(await page.locator('[name=wage]').inputValue(),'1200');
    await fill('start','22:00');await fill('end','06:00');await page.locator('[name=overnight]').check();await select('status','勤務済');await saved('shift',1);
    assert.match(await page.locator('.ops-records').textContent(),/420分/);
    await click('シフトを追加');await select('staffId','テスト担当');await fill('start','22:30');await fill('end','23:30');await fill('breakMinutes',0);await click('保存');
    await page.locator('.ops-error').waitFor({state:'visible'});assert.match(await page.locator('.ops-error').textContent(),/重複/);assert.equal((await state()).entities.shift.length,1);
    // Cancel is dismissed by default, so verify unsaved input stays before explicitly discarding.
    await click('閉じる');assert.equal(await page.locator('[name=start]').inputValue(),'22:30');
    page.removeAllListeners('dialog');page.on('dialog',d=>d.accept());await close();check('overnight shifts, actual attendance, overlap rejection and unsaved-input guard');

    await open('stock');await click('在庫品を追加');await fill('name','テスト米');await fill('unit','kg');await fill('opening',10);await fill('minimum',8);await saved('stock',1);
    await click('入出庫を記録');await select('kind','出庫');await fill('quantity',3);await saved('movements',1);assert.match(await page.locator('.ops-records').textContent(),/7 kg/);
    await click('入出庫を記録');await select('kind','出庫');await fill('quantity',8);await click('保存');await page.locator('.ops-error').waitFor({state:'visible'});assert.match(await page.locator('.ops-error').textContent(),/負数/);assert.equal((await state()).entities.movements.length,1);await close();check('stock ledger and negative-stock protection');

    await open('accounting');await click('経費を記録');await fill('name','テスト仕入');await fill('amount',500);await saved('expenses',1);assert.match(await page.locator('.ops-metrics').textContent(),/1,400/);
    await open('tasks');await click('タスクを追加');await fill('name','テスト発注');await saved('tasks',1);
    await open('booking');await click('予約を追加');await select('customerId','テスト顧客');await fill('start','18:00');await fill('end','20:00');await fill('guests',2);await fill('table','A1');await saved('booking',1);
    await click('予約を追加');await fill('name','重複の確認');await fill('start','19:00');await fill('end','20:00');await fill('table','A1');await click('保存');await page.locator('.ops-notice').waitFor({state:'visible'});assert.match(await page.locator('.ops-notice').textContent(),/同じ席/);assert.equal((await state()).entities.booking.length,1);await close();
    await open('customers');await click('来店履歴');assert.match(await page.locator('#sheetBody').textContent(),/1,900/);assert.match(await page.locator('#sheetBody').textContent(),/予約履歴/);
    await open('calendar');assert.match(await page.locator('#sheetBody').textContent(),/テスト担当/);assert.match(await page.locator('#sheetBody').textContent(),/テスト発注/);assert.match(await page.locator('#sheetBody').textContent(),/テスト顧客/);
    await click('予定を追加');await fill('name','テスト清掃');await saved('events',1);
    await open('reports');await click('日報を書く');await fill('name','テスト日報');await fill('notes','改善点を記録');await saved('reports',1);
    await page.screenshot({path:path.join(evidence,'02-report-mobile.png')});check('accounting, tasks, bookings, visit history, calendar aggregation and daily reports');

    await open('alerts');assert.match(await page.locator('#sheetBody').textContent(),/発注目安以下/);await click('すべて確認済みにする');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('restaurantOpsData.v1')).acknowledged.length===3);await close();assert.equal(await page.locator('[data-id=alerts] .badge').count(),0);
    assert.equal(await page.locator('[data-id=booking] .badge').textContent(),'1');check('data-derived notifications and acknowledgement badges');

    // Restore the hidden Facebook icon through the established home customization.
    await click('編集');await click('機能を追加');await page.locator('.hidden-item').filter({hasText:'Facebook'}).getByRole('button',{name:'追加',exact:true}).click();await close();await click('完了');
    for(const channel of M.CHANNELS){
      await open(channel);assert.match(await page.locator('#sheetBody').textContent(),/自動連携なし/);
      await click('外部ページのURLを設定');await fill('url','https://example.com/'+channel);await click('保存');await page.getByRole('link',{name:'登録した接続先を開く'}).waitFor();
      assert.equal(await page.getByRole('link',{name:'登録した接続先を開く'}).getAttribute('rel'),'noopener noreferrer');
      await click('下書きを追加');await fill('name',channel+'テスト');await fill('body','<img src=x onerror=alert(1)> テスト本文');await saved('drafts',M.CHANNELS.indexOf(channel)+1);
    }
    await open('ai');await page.locator('#f-topic').fill('運営の改善案を整理');await page.locator('#f-include').check();await click('相談文を作成して保存');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('restaurantOpsData.v1')).entities.drafts.length===8);
    const ai=(await state()).entities.drafts.at(-1);assert.match(ai.body,/1900円/);assert.ok(!ai.body.includes('テスト顧客'));assert.equal(await page.locator('#sheetBody img').count(),0);check('all seven external hubs save links/drafts; AI prompt is local and excludes customer PII; HTML remains text');

    await open('settings');const downloadPromise=page.waitForEvent('download');await click('JSONバックアップを保存');const download=await downloadPromise;const backupPath=path.join(evidence,'backup-test.json');await download.saveAs(backupPath);const backup=M.parseBackup(await fs.readFile(backupPath,'utf8'));assert.equal(backup.data.entities.sales.length,1);
    const homeBefore=await page.evaluate(()=>localStorage.getItem('restaurantOpsHome.v3'));
    await fill('name','復元前の店舗');await click('保存');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('restaurantOpsData.v1')).settings.name==='復元前の店舗');
    await page.getByLabel('バックアップJSONを選択').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{broken')});await page.locator('.ops-error').waitFor({state:'visible'});assert.equal((await state()).settings.name,'復元前の店舗');
    await page.getByLabel('バックアップJSONを選択').setInputFiles(backupPath);await page.getByText('復元内容の確認',{exact:true}).waitFor();await page.getByText('現在の業務データを、この内容に置き換える',{exact:true}).click();await click('確認したバックアップを復元');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('restaurantOpsData.v1')).settings.name==='検証用食堂');
    assert.equal(await page.evaluate(()=>localStorage.getItem('restaurantOpsHome.v3')),homeBefore);
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('restaurantOpsData.v1.beforeRestore')).settings.name),'復元前の店舗');check('downloaded JSON, invalid-file rejection, previewed restore, safety copy and unchanged layout');

    // Simulate storage exhaustion only in this disposable page and restore the native API afterward.
    await open('tasks');await click('タスクを追加');await fill('name','保存失敗の入力');const beforeFailure=await page.evaluate(()=>localStorage.getItem('restaurantOpsData.v1'));
    await page.evaluate(()=>{window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='restaurantOpsData.v1')throw new DOMException('full','QuotaExceededError');return window.originalSetItem.call(this,k,v);};});
    await click('保存');await page.locator('.ops-error').waitFor({state:'visible'});assert.equal(await page.locator('[name=name]').inputValue(),'保存失敗の入力');assert.equal(await page.evaluate(()=>localStorage.getItem('restaurantOpsData.v1')),beforeFailure);
    await page.evaluate(()=>{Storage.prototype.setItem=window.originalSetItem;});await close();check('quota failure keeps input and durable data');

    await open('menu');await click('原価計算');await click('材料・仕入価格');await click('材料を追加');await select('stockId','テスト米');await fill('name','原価テスト米');await fill('packPrice',3000);await fill('packQuantity',5);await select('packUnit','kg');await saved('ingredients',1);
    await open('menu');await click('原価計算');await click('原価計算を追加');await select('menuId','テスト定食');await fill('servings',4);await select('status','採用');await page.getByLabel('登録材料',{exact:true}).selectOption({label:'原価テスト米'});await page.getByLabel('明細の使用量',{exact:true}).fill('500');await page.getByLabel('明細の使用量単位',{exact:true}).selectOption('g');
    assert.match(await page.locator('.ops-cost-result').textContent(),/75.00円/);await page.screenshot({path:path.join(evidence,'04-costing-mobile.png')});await saved('recipes',1);
    await open('stock');await click('材料・仕入価格');await click('詳細・編集');await fill('packPrice',6000);await click('保存');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('restaurantOpsData.v1')).entities.ingredients[0].packPrice===6000);
    await open('menu');await click('原価計算');assert.match(await page.locator('.ops-records').textContent(),/75.00円/);
    await open('sales');await click('売上を追加');await page.getByLabel('登録メニュー',{exact:true}).selectOption({label:'テスト定食'});assert.equal(await page.getByLabel('明細の1点原価',{exact:true}).inputValue(),'75');await saved('sales',2);
    await page.reload();await open('reports');assert.match(await page.locator('#sheetBody').textContent(),/原価未登録を含む伝票 1件/);assert.match(await page.locator('#sheetBody').textContent(),/75.00円/);
    await open('settings');const costDownloadPromise=page.waitForEvent('download');await click('JSONバックアップを保存');const costDownload=await costDownloadPromise;const costBackupPath=path.join(evidence,'cost-backup-test.json');await costDownload.saveAs(costBackupPath);const costBackup=M.parseBackup(await fs.readFile(costBackupPath,'utf8'));assert.equal(costBackup.data.entities.recipes[0].lines[0].packPrice,3000);await page.getByLabel('バックアップJSONを選択').setInputFiles(costBackupPath);await page.getByText('復元内容の確認',{exact:true}).waitFor();await page.getByText('現在の業務データを、この内容に置き換える',{exact:true}).click();await click('確認したバックアップを復元');await page.waitForFunction(()=>!document.querySelector('#sheetBody input[type=checkbox]'));assert.equal((await state()).entities.sales.at(-1).lines[0].unitCost,75);check('ingredient purchase units, recipe costing, immutable prices, sale cost snapshots and backup restore');

    // A second isolated tab on the same origin proves stale writes cannot replace newer data.
    const other=await context.newPage();await other.goto(url);await open('tasks');await click('タスクを追加');await fill('name','競合する入力');
    await other.locator('[data-id=tasks] .tile-main').click();await other.getByRole('button',{name:'タスクを追加',exact:true}).click();await other.locator('[name=name]').fill('別タブの記録');await other.getByRole('button',{name:'保存',exact:true}).click();await other.waitForFunction(()=>JSON.parse(localStorage.getItem('restaurantOpsData.v1')).entities.tasks.length===2);
    await click('保存');await page.locator('.ops-error').waitFor({state:'visible'});assert.match(await page.locator('.ops-error').textContent(),/別のタブ/);assert.equal((await state()).entities.tasks.length,2);await close();await other.close();await open('settings');await click('保存データを再読込');check('stale-tab conflict is rejected');

    for(const width of [360,390,874,1280]){
      await page.setViewportSize({width,height:844});await open('sales');await click('売上を追加');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page overflow at '+width);
      assert.ok(await page.locator('#bottomSheet').evaluate(n=>n.scrollWidth<=n.clientWidth+1),'sheet overflow at '+width);
      await page.screenshot({path:path.join(evidence,'03-sale-form-'+width+'.png')});await close();
    }
    await page.setViewportSize({width:390,height:844});await open('help');assert.match(await page.locator('#sheetBody').textContent(),/バックアップと端末移行/);
    await page.locator('#closeSheet').focus();await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.textContent),'設定・バックアップへ');await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'closeSheet');check('360/390/874/1280 layouts, helper content and modal keyboard focus');

    await close();await page.locator('[data-id=sales] .tile-main').scrollIntoViewIfNeeded();const salesBox=await page.locator('[data-id=sales] .tile-main').boundingBox();await page.mouse.move(salesBox.x+20,salesBox.y+20);await page.mouse.down();await page.waitForTimeout(650);await page.mouse.up();assert.equal(await page.locator('#editBtn').getAttribute('aria-pressed'),'true');
    const from=await page.locator('[data-id=stock] .tile-main').boundingBox(),to=await page.locator('[data-id=menu] .tile-main').boundingBox();await page.mouse.move(from.x+25,from.y+25);await page.mouse.down();await page.mouse.move(to.x+25,to.y+25,{steps:8});await page.mouse.up();
    assert.equal(await page.locator('.tile').first().getAttribute('data-id'),'stock');await page.waitForTimeout(600);await click('完了');await page.reload();assert.equal(await page.locator('.tile').first().getAttribute('data-id'),'stock');check('long press, drag reorder and persistent home layout');

    // Corrupt startup must preserve the exact bytes and permit an explicit valid restore.
    const goodRaw=await page.evaluate(()=>localStorage.getItem('restaurantOpsData.v1'));
    await page.evaluate(()=>localStorage.setItem('restaurantOpsData.v1','{bad'));await page.reload();await open('settings');assert.match(await page.locator('.ops-error').textContent(),/元データを保護/);assert.equal(await page.evaluate(()=>localStorage.getItem('restaurantOpsData.v1')),'{bad');
    await page.getByLabel('バックアップJSONを選択').setInputFiles(backupPath);await page.getByText('復元内容の確認',{exact:true}).waitFor();await page.getByText('現在の業務データを、この内容に置き換える',{exact:true}).click();await click('確認したバックアップを復元');await page.waitForFunction(()=>localStorage.getItem('restaurantOpsData.v1')!=='{bad');assert.equal(await page.evaluate(()=>localStorage.getItem('restaurantOpsData.v1.beforeRestore')),'{bad');
    assert.ok(goodRaw);check('corrupt startup is protected and can recover through explicit restore');

    assert.deepEqual(errors,[]);assert.deepEqual(externalRequests,[]);check('no JavaScript or console errors and no external API requests');
    await fs.writeFile(path.join(evidence,'browser-results.json'),JSON.stringify({url,checks,errors,completedAt:new Date().toISOString()},null,2));
    console.log('Browser checks complete: '+checks.length);
  }catch(error){if(page)await page.screenshot({path:path.join(evidence,'failure.png')}).catch(()=>{});throw error;}
  finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
