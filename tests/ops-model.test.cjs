const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('../ops-model.js');

function storage(seed={}){
  const map=new Map(Object.entries(seed));let failKey=null,readBlocked=false;
  return {map,getItem(k){if(readBlocked)throw Error('SecurityError');return map.get(k)??null;},setItem(k,v){if(failKey===k||failKey==='*')throw Error('QuotaExceededError');map.set(k,v);},fail(k){failKey=k;},blockRead(){readBlocked=true;}};
}
function setup(){const disk=storage();return {disk,store:M.createStore(disk)};}
function add(store,type,values={}){store.upsert(type,{...M.defaults(M.schemas[type].fields),...values});return store.data.entities[type].at(-1);}
function sale(store,values={}){const v={name:'食事',date:'2026-10-03',guests:2,lines:[{menuId:'',name:'定食',quantity:2,price:1100}],...values};v.lines=v.lines.map(l=>({unitCost:null,...l}));return add(store,'sales',v);}
function staff(store){return add(store,'staff',{name:'スタッフ',wage:1200});}
function stock(store,values={}){return add(store,'stock',{name:'米',unit:'kg',openingDate:'2026-10-01',opening:10,minimum:2,...values});}
function movement(store,item,values={}){return add(store,'movements',{stockId:item.id,date:'2026-10-03',kind:'出庫',quantity:1,...values});}
function shift(store,person,values={}){return add(store,'shift',{staffId:person.id,date:'2026-10-03',start:'10:00',end:'18:00',breakMinutes:60,wage:1200,...values});}

test('new data is empty, defaulting never overwrites storage or home layout',()=>{
  const disk=storage({'restaurantOpsHome.v3':'keep'}),s=M.createStore(disk);
  assert.equal(s.error,null);assert.equal(s.data.revision,0);assert.equal(disk.map.size,1);
  assert.ok(Object.values(s.data.entities).every(rs=>rs.length===0));assert.deepEqual(M.alerts(s.data),[]);
});
test('sale save, edit and reload preserve values; cancel removes from totals without deleting history',()=>{
  const {store,disk}=setup();const r=sale(store,{discount:200});
  assert.equal(M.saleTotal(r),2000);assert.equal(M.summary(store.data,'2026-10-01','2026-10-31').average,1000);
  const {id,createdAt,updatedAt,...values}=r;store.upsert('sales',{...values,status:'取消'},id);
  const next=M.createStore(disk);assert.equal(next.data.entities.sales.length,1);assert.equal(next.data.entities.sales[0].createdAt,createdAt);
  assert.equal(M.summary(next.data,'2026-10-01','2026-10-31').revenue,0);
});
test('sale amounts reject negative prices, fractional counts, huge totals, excessive discounts, missing lines',()=>{
  const {store}=setup();
  for(const override of [{discount:2201},{guests:0},{guests:1.2},{lines:[]},{lines:[{menuId:'',name:'食事',price:-1,quantity:1}]},{lines:[{menuId:'',name:'食事',price:1,quantity:1.5}]},{lines:[{menuId:'',name:'食事',price:100000000,quantity:2}]}])assert.throws(()=>sale(store,override));
  assert.equal(store.data.entities.sales.length,0);
  assert.equal(M.saleTotal(sale(store,{discount:2200})),0);
});
test('menu price changes do not alter historical receipts; archived references still work',()=>{
  const {store}=setup();const item=add(store,'menu',{name:'カレー',price:900});
  sale(store,{lines:[{menuId:item.id,name:item.name,quantity:1,price:item.price}]});
  const {id,createdAt,updatedAt,...values}=item;store.upsert('menu',{...values,price:1000,status:'休止'},id);
  assert.equal(M.saleTotal(store.data.entities.sales[0]),900);
});
test('quota failures leave both in-memory and durable data unchanged',()=>{
  const {store,disk}=setup();sale(store);const before=store.data,raw=disk.getItem(M.KEY);disk.fail(M.KEY);
  assert.throws(()=>sale(store),/保存できません/);assert.deepEqual(store.data,before);assert.equal(disk.getItem(M.KEY),raw);
});
test('corrupt and newer-version saved data are protected until explicit restore',()=>{
  for(const raw of ['{broken',JSON.stringify({...M.blank(),version:99}),JSON.stringify({...M.blank(),settings:{}})]){
    const disk=storage({[M.KEY]:raw}),s=M.createStore(disk);assert.ok(s.error);assert.throws(()=>sale(s));assert.equal(disk.getItem(M.KEY),raw);assert.throws(()=>s.backup());
    s.restore(M.blank(),raw);assert.equal(disk.getItem(M.RECOVERY_KEY),raw);assert.equal(s.error,null);
  }
});
test('storage read failures do not initialize or overwrite business data',()=>{
  const disk=storage({[M.KEY]:'keep'});disk.blockRead();const s=M.createStore(disk);assert.ok(s.error);assert.throws(()=>sale(s));assert.equal(disk.map.get(M.KEY),'keep');
});
test('stale tabs cannot overwrite another tab; explicit reload resumes saving',()=>{
  const {store:a,disk}=setup(),b=M.createStore(disk);sale(a);
  assert.throws(()=>sale(b),/別のタブ/);assert.equal(M.createStore(disk).data.entities.sales.length,1);
  b.load();sale(b);assert.equal(M.createStore(disk).data.entities.sales.length,2);
});
test('backup round trip, revision, and safe pre-restore copy never touch home',()=>{
  const {store,disk}=setup();disk.setItem('restaurantOpsHome.v3','unchanged');sale(store);const b=M.parseBackup(store.backup());
  sale(store,{date:'2026-10-04'});const old=disk.getItem(M.KEY),oldRevision=store.data.revision;
  store.restore(b.data,old);assert.equal(store.data.entities.sales.length,1);assert.ok(store.data.revision>oldRevision);
  assert.equal(disk.getItem(M.RECOVERY_KEY),old);assert.equal(disk.getItem('restaurantOpsHome.v3'),'unchanged');
});
test('restore cannot overwrite changes after preview, invalid data or failed safety copy',()=>{
  const {store,disk}=setup();sale(store);const old=disk.getItem(M.KEY);const copy=store.data;
  sale(store);assert.throws(()=>store.restore(copy,old),/プレビュー後/);const latest=disk.getItem(M.KEY);
  disk.fail(M.RECOVERY_KEY);assert.throws(()=>store.restore(copy,latest),/安全コピー/);assert.equal(disk.getItem(M.KEY),latest);
  disk.fail(M.KEY);assert.throws(()=>store.restore(copy,latest),/元データは変更していません/);assert.equal(disk.getItem(M.KEY),latest);
  assert.throws(()=>store.restore({...copy,version:10},latest));assert.equal(disk.getItem(M.KEY),latest);
});
test('strict backup validation rejects truncation, foreign format, unsupported version and missing or duplicate references',()=>{
  const {store}=setup();sale(store);const good=JSON.parse(store.backup());
  assert.throws(()=>M.parseBackup('{'));
  for(const change of [b=>{b.format='other';},b=>{b.version=99;},b=>{b.data.entities.sales[0].customerId='missing';},b=>{b.data.entities.sales.push({...b.data.entities.sales[0]});},b=>{delete b.data.entities.menu;},b=>{b.data.entities.sales[0].unexpected=true;}]){const bad=M.clone(good);change(bad);assert.throws(()=>M.parseBackup(JSON.stringify(bad)));}
});
test('dates, times, enums, numeric types and precision are validated',()=>{
  const {store}=setup();for(const date of ['2026-02-29','2026-13-01','2026-04-31','1999-12-31','2101-01-01'])assert.throws(()=>sale(store,{date}));
  sale(store,{date:'2028-02-29'});assert.throws(()=>sale(store,{payment:'unknown'}));assert.throws(()=>sale(store,{guests:'2'}));assert.throws(()=>stock(store,{opening:0.0001}));
  assert.throws(()=>add(store,'events',{name:'予定',start:'24:00',date:'2026-10-03'}));
});
test('stock ledger handles decimals, waste, correction and rejects negative chronological balance',()=>{
  const {store}=setup();const item=stock(store,{opening:1});movement(store,item,{quantity:0.2});movement(store,item,{kind:'廃棄',quantity:0.1});
  assert.equal(M.stockQuantity(store.data,item.id),0.7);movement(store,item,{kind:'差分調整',quantity:-0.2});assert.equal(M.stockQuantity(store.data,item.id),0.5);
  assert.throws(()=>movement(store,item,{quantity:0.6}),/負数/);assert.throws(()=>movement(store,item,{quantity:0}));assert.throws(()=>movement(store,item,{date:'2026-09-30'}),/開始日/);
  movement(store,item,{kind:'入庫',quantity:3,date:'2026-10-05'});
  assert.throws(()=>movement(store,item,{kind:'出庫',quantity:2,date:'2026-10-04'}),/負数/);
});
test('voiding an inbound movement cannot make later stock negative',()=>{
  const {store}=setup();const item=stock(store,{opening:0});const incoming=movement(store,item,{kind:'入庫',quantity:2,date:'2026-10-02'});movement(store,item,{quantity:2});
  const {id,createdAt,updatedAt,...values}=incoming;assert.throws(()=>store.upsert('movements',{...values,status:'取消'},id),/負数/);assert.equal(M.stockQuantity(store.data,item.id),0);
});
test('overnight shift duration, breaks, overlap across days and touching boundaries',()=>{
  const {store}=setup();const person=staff(store);const night=shift(store,person,{start:'22:00',end:'06:00',overnight:true,breakMinutes:60});
  assert.equal(M.shiftMinutes(night),420);
  assert.throws(()=>shift(store,person,{date:'2026-10-04',start:'05:00',end:'08:00',breakMinutes:0}),/重複/);
  shift(store,person,{date:'2026-10-04',start:'06:00',end:'08:00',breakMinutes:0});
  assert.throws(()=>shift(store,person,{date:'2026-10-05',start:'12:00',end:'11:00',breakMinutes:0}));
  assert.throws(()=>shift(store,person,{date:'2026-10-05',start:'10:00',end:'11:00',breakMinutes:60}));
});
test('reports count only active receipts/expenses and completed shifts, do not double-count payroll',()=>{
  const {store}=setup();sale(store);sale(store,{status:'取消'});sale(store,{date:'2026-11-01'});
  add(store,'expenses',{name:'仕入',date:'2026-10-03',amount:500});add(store,'expenses',{name:'取消',date:'2026-10-03',amount:900,status:'取消'});
  const p=staff(store);shift(store,p,{status:'勤務済'});shift(store,p,{date:'2026-10-04'});
  const s=M.summary(store.data,'2026-10-01','2026-10-31');assert.deepEqual([s.revenue,s.expense,s.balance,s.guests,s.transactions,s.labor,s.minutes],[2200,500,1700,2,1,8400,420]);
});
test('alerts are derived, acknowledgement does not hide unresolved item and changed quantity alerts again',()=>{
  const {store}=setup();const item=stock(store,{opening:2,minimum:2});const a=M.alerts(store.data,'2026-10-03');assert.equal(a.length,1);
  store.commit(d=>d.acknowledged.push(a[0].key));assert.equal(M.alerts(store.data,'2026-10-03')[0].read,true);
  movement(store,item);assert.equal(M.alerts(store.data,'2026-10-03')[0].read,false);
  add(store,'tasks',{name:'発注',date:'2026-10-02'});assert.equal(M.alerts(store.data,'2026-10-03').length,2);
});
test('calendar joins bookings, staff shifts, tasks and events and excludes canceled records',()=>{
  const {store}=setup();const p=staff(store);shift(store,p);add(store,'booking',{name:'予約',date:'2026-10-03',start:'18:00',end:'20:00',guests:2});
  add(store,'tasks',{name:'発注',date:'2026-10-03'});add(store,'events',{name:'休業',date:'2026-10-04'});add(store,'events',{name:'取消',date:'2026-10-04',status:'取消'});
  const rows=M.calendar(store.data,'2026-10-01','2026-10-31');assert.equal(rows.length,4);assert.equal(rows[0].kind,'tasks');assert.equal(rows[1].kind,'shift');
});
test('URL validation rejects script, credential and plaintext endpoints, CSV neutralizes formulas',()=>{
  for(const url of ['javascript:alert(1)','data:text/html,x','http://example.com','https://user:password@example.com'])assert.throws(()=>M.safeUrl(url));
  assert.equal(M.safeUrl('https://example.com/path'),'https://example.com/path');
  assert.equal(M.csv([['=1+1','a"b','複数\n行']]),'\uFEFF"\'=1+1","a""b","複数\n行"');
});
