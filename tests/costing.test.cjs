const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('../ops-model.js');
function setup(){const map=new Map(),disk={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};return {map,disk,store:M.createStore(disk)};}
function add(store,type,values){store.upsert(type,{...M.defaults(M.schemas[type].fields),...values});return store.data.entities[type].at(-1);}
const line=(overrides={})=>({ingredientId:'',name:'米',packPrice:3000,packQuantity:5,packUnit:'kg',usageQuantity:500,usageUnit:'g',...overrides});
function recipe(store,overrides={}){return add(store,'recipes',{name:'炊き込みご飯',date:'2026-10-03',servings:4,sellingPrice:500,lines:[line()],...overrides});}
function update(store,type,row,changes){const {id,createdAt,updatedAt,...v}=row;store.upsert(type,{...v,...changes},id);}

test('mass and volume conversions, multiple ingredients, yield, ratio, margin and rounding',()=>{
  const r={servings:4,sellingPrice:500,lines:[line(),line({name:'だし',packPrice:200,packQuantity:1,packUnit:'L',usageQuantity:250,usageUnit:'mL'})]};
  assert.deepEqual(M.recipeCost(r),{total:350,perServing:87.5,rate:17.5,margin:412.5});
  assert.equal(M.recipeCost({...r,servings:3}).perServing,116.67);
});
test('unknown price is not zero, zero-price sales have no rate, explicit free material is zero',()=>{
  assert.equal(M.recipeCost({servings:1,sellingPrice:500,lines:[line({packPrice:null})]}),null);
  assert.equal(M.recipeCost({servings:1,sellingPrice:0,lines:[line()]}).rate,null);
  assert.equal(M.recipeCost({servings:1,sellingPrice:null,lines:[line()]}).margin,null);
  assert.equal(M.recipeCost({servings:1,sellingPrice:500,lines:[line({packPrice:0})]}).perServing,0);
});
test('recipe save rejects missing/negative prices, nonpositive quantities/yield and incompatible units',()=>{
  const {store}=setup();for(const override of [{servings:0},{servings:-1},{lines:[line({packQuantity:0})]},{lines:[line({usageQuantity:0})]},{lines:[line({usageQuantity:-1})]},{lines:[line({packPrice:null})]},{lines:[line({packPrice:-1})]},{lines:[line({packPrice:1.5})]},{lines:[line({packUnit:'L',usageUnit:'g'})]},{lines:[line({packUnit:'袋',usageUnit:'g'})]}])assert.throws(()=>recipe(store,override));
  assert.equal(store.data.entities.recipes.length,0);
});
test('ingredients link inventory, preserve recipe price snapshots, and recipes preserve sales cost snapshots',()=>{
  const {store}=setup();const item=add(store,'stock',{name:'米',unit:'kg',opening:10});
  const ingredient=add(store,'ingredients',{name:'米',stockId:item.id,packPrice:3000,packQuantity:5,packUnit:'kg'});
  const menu=add(store,'menu',{name:'ご飯',price:500});
  const r=recipe(store,{menuId:menu.id,status:'採用',lines:[line({ingredientId:ingredient.id})]});
  const sale=add(store,'sales',{name:'食事',date:'2026-10-03',guests:1,lines:[{menuId:menu.id,name:'ご飯',quantity:1,price:500,unitCost:M.menuCost(store.data,menu.id,'2026-10-03')}]});
  assert.equal(M.saleCost(sale),75);
  update(store,'ingredients',ingredient,{packPrice:6000});assert.equal(M.recipeCost(store.data.entities.recipes[0]).perServing,75);
  update(store,'recipes',r,{lines:[line({ingredientId:ingredient.id,packPrice:6000})]});assert.equal(M.menuCost(store.data,menu.id,'2026-10-03'),150);
  assert.equal(M.saleCost(store.data.entities.sales[0]),75);
});
test('future or trial recipes do not affect cost before adoption date; manual fallback can be unknown',()=>{
  const {store}=setup();const menu=add(store,'menu',{name:'ご飯',price:500});assert.equal(M.menuCost(store.data,menu.id),null);
  recipe(store,{menuId:menu.id,status:'試作'});assert.equal(M.menuCost(store.data,menu.id),null);
  recipe(store,{menuId:menu.id,status:'採用',date:'2026-10-05'});assert.equal(M.menuCost(store.data,menu.id,'2026-10-04'),null);assert.equal(M.menuCost(store.data,menu.id,'2026-10-05'),75);
});
test('unknown receipt costs are separately counted and never folded into a zero-cost profit',()=>{
  const {store}=setup();for(const unitCost of [75,null])add(store,'sales',{name:'売上',date:'2026-10-03',guests:1,lines:[{menuId:'',name:'食事',price:500,quantity:1,unitCost}]});
  const s=M.summary(store.data,'2026-10-01','2026-10-31');assert.deepEqual([s.revenue,s.costedCount,s.unknownCostCount,s.costedRevenue,s.materialCost,s.materialMargin],[1000,1,1,500,75,425]);
});
test('costing data round trips through storage and backup with decimal snapshots intact',()=>{
  const {store,disk}=setup();recipe(store,{servings:3});const raw=store.backup();const parsed=M.parseBackup(raw);store.restore(parsed.data,store.rawData());
  const reloaded=M.createStore(disk);assert.equal(M.recipeCost(reloaded.data.entities.recipes[0]).perServing,100);assert.deepEqual(reloaded.data.entities.recipes,store.data.entities.recipes);
});
test('version-1 storage and backup migrate in memory without touching bytes or inventing historical cost',()=>{
  const {store,disk,map}=setup();add(store,'menu',{name:'旧商品',price:500,cost:0});add(store,'sales',{name:'旧売上',date:'2026-10-03',guests:1,lines:[{menuId:'',name:'旧商品',price:500,quantity:1,unitCost:null}]});
  const old=store.data;old.version=1;delete old.entities.ingredients;delete old.entities.recipes;old.entities.sales[0].lines.forEach(l=>delete l.unitCost);
  const raw=JSON.stringify(old);disk.setItem(M.KEY,raw);const migrated=M.createStore(disk);
  assert.equal(migrated.error,null);assert.equal(map.get(M.KEY),raw);assert.equal(migrated.data.version,2);assert.equal(migrated.data.entities.menu[0].cost,null);assert.equal(M.saleCost(migrated.data.entities.sales[0]),null);
  const backup=JSON.stringify({format:'restaurant-ops-backup',version:1,exportedAt:new Date().toISOString(),data:old});assert.equal(M.parseBackup(backup).data.version,2);
  const invalid=M.clone(old);invalid.entities.recipes=[{unexpected:'not legacy'}];assert.throws(()=>M.validate(M.migrate(invalid)));
});
