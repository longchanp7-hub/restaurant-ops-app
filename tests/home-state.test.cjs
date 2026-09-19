const test = require('node:test');
const assert = require('node:assert/strict');
const HomeState = require('../home-state.js');

const IDS = ['sales','shift','stock','accounting','staff','tasks','reports','ai','alerts'];

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

test('normalize removes duplicate and unknown IDs while restoring missing known IDs', () => {
  const state = HomeState.normalize({
    order: ['sales','sales','unknown','stock'],
    hidden: ['sales','sales','unknown']
  }, IDS);
  assert.deepEqual(state.hidden, ['sales']);
  assert.equal(state.order.length, IDS.length);
  assert.equal(new Set(state.order).size, IDS.length);
  assert.deepEqual(state.order.slice(0, 2), ['sales','stock']);
  assert.deepEqual(new Set(state.order), new Set(IDS));
});

test('load falls back to all modules when v2 JSON is broken', () => {
  const storage = memoryStorage({'restaurantOpsHome.v2':'{broken'});
  assert.deepEqual(HomeState.load(storage, IDS), {order: IDS, hidden: []});
});

test('load falls back to legacy v1 when v2 is missing or invalid', () => {
  const legacy = {order:['shift','sales'], hidden:['alerts']};
  const storage = memoryStorage({
    'restaurantOpsHome.v2':'{"order":"bad","hidden":[]}',
    'restaurantOpsHome.v1':JSON.stringify(legacy)
  });
  const state = HomeState.load(storage, IDS);
  assert.equal(state.order[0], 'shift');
  assert.equal(state.order[1], 'sales');
  assert.deepEqual(state.hidden, ['alerts']);
});

test('v2 takes precedence over v1 when both are valid', () => {
  const storage = memoryStorage({
    'restaurantOpsHome.v2':JSON.stringify({order:['ai'],hidden:['stock']}),
    'restaurantOpsHome.v1':JSON.stringify({order:['sales'],hidden:['alerts']})
  });
  const state = HomeState.load(storage, IDS);
  assert.equal(state.order[0], 'ai');
  assert.deepEqual(state.hidden, ['stock']);
});

test('save returns false instead of throwing when storage rejects writes', () => {
  const storage = memoryStorage({}, true);
  assert.equal(HomeState.save(storage, {order: IDS, hidden: []}), false);
});

test('save writes state to the v2 key when storage is available', () => {
  const storage = memoryStorage();
  const state = {order:[...IDS], hidden:['alerts']};
  assert.equal(HomeState.save(storage, state), true);
  assert.deepEqual(JSON.parse(storage.map.get('restaurantOpsHome.v2')), state);
});

test('move reorders a module and preserves hidden state', () => {
  const original = {order:[...IDS], hidden:['alerts']};
  const moved = HomeState.move(original, 'sales', 'stock');
  assert.equal(moved.order[2], 'sales');
  assert.deepEqual(moved.hidden, ['alerts']);
  assert.notStrictEqual(moved.order, original.order);
  assert.notStrictEqual(moved.hidden, original.hidden);
});

test('move is a no-op for unknown IDs or identical source/target', () => {
  const state = {order:[...IDS], hidden:[]};
  assert.strictEqual(HomeState.move(state, 'missing', 'stock'), state);
  assert.strictEqual(HomeState.move(state, 'sales', 'sales'), state);
});
