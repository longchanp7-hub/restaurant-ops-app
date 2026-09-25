const test = require('node:test');
const assert = require('node:assert/strict');
const HomeState = require('../home-state.js');

const HOME = [
  'sales','shift','stock','staff','accounting','tasks','reports','alerts',
  'booking','customers','menu','help','website','instagram','facebook','x','tiktok'
];
const DOCK = ['ai','line','calendar','settings'];
const ALL = [...HOME,...DOCK];

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

test('legacy normalize still removes duplicate and unknown IDs', () => {
  const state = HomeState.normalize(
    {order:['sales','sales','unknown','stock'],hidden:['sales','unknown']},
    HOME
  );
  assert.equal(state.order.length, HOME.length);
  assert.equal(new Set(state.order).size, HOME.length);
  assert.deepEqual(state.hidden,['sales']);
});

test('layout defaults to 17 home apps and four dock apps', () => {
  const layout = HomeState.normalizeLayout(null,ALL,HOME,DOCK,4);
  assert.deepEqual(layout.home,HOME);
  assert.deepEqual(layout.dock,DOCK);
  assert.deepEqual(layout.hidden,[]);
});

test('layout removes duplicates and unknown IDs across zones', () => {
  const layout = HomeState.normalizeLayout({
    home:['sales','sales','unknown','ai'],
    dock:['ai','line','line'],
    hidden:['x','x','missing']
  },ALL,HOME,DOCK,4);
  assert.equal(new Set([...layout.home,...layout.dock,...layout.hidden]).size,ALL.length);
  assert.equal(layout.dock.includes('ai'),true);
  assert.deepEqual(layout.hidden,['x']);
});

test('old v2 state migrates while keeping the default dock', () => {
  const storage = memoryStorage({
    'restaurantOpsHome.v2':JSON.stringify({
      order:['shift','sales','stock'],
      hidden:['alerts']
    })
  });
  const layout = HomeState.loadLayout(storage,ALL,HOME,DOCK,4);
  assert.deepEqual(layout.home.slice(0,3),['shift','sales','stock']);
  assert.deepEqual(layout.dock,DOCK);
  assert.deepEqual(layout.hidden,['alerts']);
});

test('v3 layout takes precedence over legacy state', () => {
  const storage = memoryStorage({
    'restaurantOpsHome.v3':JSON.stringify({
      home:['instagram','sales'],
      dock:['settings','line','ai','calendar'],
      hidden:['stock']
    }),
    'restaurantOpsHome.v2':JSON.stringify({
      order:['sales'],hidden:['alerts']
    })
  });
  const layout = HomeState.loadLayout(storage,ALL,HOME,DOCK,4);
  assert.equal(layout.home[0],'instagram');
  assert.deepEqual(layout.dock,['settings','line','ai','calendar']);
  assert.deepEqual(layout.hidden,['stock']);
});

test('saveLayout stores v3 and handles denied storage', () => {
  const layout = HomeState.normalizeLayout(null,ALL,HOME,DOCK,4);
  const ok = memoryStorage();
  assert.equal(HomeState.saveLayout(ok,layout),true);
  assert.deepEqual(JSON.parse(ok.map.get('restaurantOpsHome.v3')),layout);
  assert.equal(HomeState.saveLayout(memoryStorage({},true),layout),false);
});

test('home icon can move into a dock with room', () => {
  const base={home:[...HOME],dock:['ai','line','calendar'],hidden:[]};
  const moved=HomeState.moveLayout(base,'sales','dock','calendar',4);
  assert.deepEqual(moved.dock,['ai','line','sales','calendar']);
  assert.equal(moved.home.includes('sales'),false);
});

test('dropping a home icon on a full dock swaps the target back home', () => {
  const base={home:[...HOME],dock:[...DOCK],hidden:[]};
  const moved=HomeState.moveLayout(base,'sales','dock','line',4);
  assert.deepEqual(moved.dock,['ai','sales','calendar','settings']);
  assert.equal(moved.home.includes('line'),true);
  assert.equal(moved.home.includes('sales'),false);
});

test('dock icon can move to the home grid', () => {
  const base={home:[...HOME],dock:[...DOCK],hidden:[]};
  const moved=HomeState.moveLayout(base,'line','home','stock',4);
  assert.equal(moved.dock.includes('line'),false);
  assert.equal(moved.home.indexOf('line'),moved.home.indexOf('stock')-1);
});

test('icons can be hidden and restored to the home grid', () => {
  const base={home:[...HOME],dock:[...DOCK],hidden:[]};
  const hidden=HomeState.hideLayout(base,'line');
  assert.equal(hidden.dock.includes('line'),false);
  assert.deepEqual(hidden.hidden,['line']);
  const restored=HomeState.restoreLayout(hidden,'line');
  assert.equal(restored.hidden.includes('line'),false);
  assert.equal(restored.home.at(-1),'line');
});
