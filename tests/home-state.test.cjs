const test = require('node:test');
const assert = require('node:assert/strict');
const HomeState = require('../home-state.js');

const HOME = [
  'sales','shift','stock','staff','accounting','tasks','reports','alerts',
  'booking','customers','menu','help','website','instagram','facebook','x','tiktok',
  'ai','line','calendar','settings'
];
const DOCK = [];
const ALL = [...HOME];

function memoryStorage(seed = {}, blocked = false) {
  const map = new Map(Object.entries(seed));
  return {
    map,
    getItem(key) { return map.get(key) ?? null; },
    setItem(key, value) {
      if (blocked) throw new Error('QuotaExceededError');
      map.set(key, value);
    }
  };
}

test('dockless layout defaults to all 21 apps on home', () => {
  const layout = HomeState.normalizeLayout(null,ALL,HOME,DOCK,0);
  assert.deepEqual(layout.home,HOME);
  assert.deepEqual(layout.dock,[]);
  assert.deepEqual(layout.hidden,[]);
});

test('old v3 dock apps migrate back into home', () => {
  const storage = memoryStorage({
    'restaurantOpsHome.v3':JSON.stringify({
      home:['instagram','sales'],
      dock:['settings','line','ai','calendar'],
      hidden:['stock']
    })
  });
  const layout = HomeState.loadLayout(storage,ALL,HOME,DOCK,0);
  assert.deepEqual(layout.dock,[]);
  assert.equal(layout.home[0],'instagram');
  assert.equal(layout.home[1],'sales');
  for (const id of ['settings','line','ai','calendar']) assert.equal(layout.home.includes(id),true);
  assert.deepEqual(layout.hidden,['stock']);
});

test('old v2 state migrates to dockless home', () => {
  const storage = memoryStorage({
    'restaurantOpsHome.v2':JSON.stringify({
      order:['shift','sales','stock'],
      hidden:['alerts']
    })
  });
  const layout = HomeState.loadLayout(storage,ALL,HOME,DOCK,0);
  assert.deepEqual(layout.home.slice(0,3),['shift','sales','stock']);
  assert.deepEqual(layout.dock,[]);
  assert.equal(layout.home.includes('line'),true);
  assert.equal(layout.home.includes('settings'),true);
  assert.deepEqual(layout.hidden,['alerts']);
});

test('saveLayout stores dockless v3 layout and handles denied storage', () => {
  const layout = HomeState.normalizeLayout(null,ALL,HOME,DOCK,0);
  const ok = memoryStorage();
  assert.equal(HomeState.saveLayout(ok,layout),true);
  assert.deepEqual(JSON.parse(ok.map.get('restaurantOpsHome.v3')),layout);
  assert.equal(HomeState.saveLayout(memoryStorage({},true),layout),false);
});

test('home icons can reorder within the grid', () => {
  const base={home:[...HOME],dock:[],hidden:[]};
  const moved=HomeState.moveLayout(base,'sales','home','stock',0);
  assert.equal(moved.home.indexOf('sales'),moved.home.indexOf('stock')-1);
  assert.deepEqual(moved.dock,[]);
});

test('icons can be hidden and restored to the home grid', () => {
  const base={home:[...HOME],dock:[],hidden:[]};
  const hidden=HomeState.hideLayout(base,'line');
  assert.equal(hidden.home.includes('line'),false);
  assert.deepEqual(hidden.hidden,['line']);
  const restored=HomeState.restoreLayout(hidden,'line');
  assert.equal(restored.hidden.includes('line'),false);
  assert.equal(restored.home.at(-1),'line');
});
