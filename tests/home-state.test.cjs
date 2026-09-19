const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
function boot({ saved = null, blocked = false, invalid = false } = {}) {
  const elements = new Map();
  const storage = new Map(saved ? [['restaurantOpsHome.v2', JSON.stringify(saved)]] : []);
  if (invalid) storage.set('restaurantOpsHome.v2', '{broken');
  const element = () => ({
    hidden: false, textContent: '', dataset: {}, children: [], listeners: {},
    style: { setProperty() {} }, classList: { toggle() {}, add() {}, remove() {} },
    set innerHTML(value) { this.children = []; },
    appendChild(child) { this.children.push(child); },
    addEventListener(name, fn) { this.listeners[name] = fn; },
    querySelector() { return element(); }
  });
  const document = {
    body: element(), createElement: element,
    getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); }
  };
  const context = vm.createContext({
    document, setTimeout() { return 1; }, clearTimeout() {},
    localStorage: {
      getItem(key) { return storage.get(key) ?? null; },
      setItem(key, value) { if (blocked) throw new Error('QuotaExceededError'); storage.set(key, value); }
    }
  });
  vm.runInContext(source, context);
  return { run: code => vm.runInContext(code, context), elements, storage };
}

test('duplicate and unknown saved module IDs are removed', () => {
  const app = boot({ saved: { order: ['sales', 'sales', 'unknown'], hidden: ['sales', 'sales', 'unknown'] } });
  assert.equal(app.run('state.order.length'), 9);
  assert.equal(app.run('new Set(state.order).size'), 9);
  assert.equal(app.run('JSON.stringify(state.hidden)'), '["sales"]');
  assert.equal(app.elements.get('tileGrid').children.length, 8);
});

test('broken stored JSON falls back to all nine modules', () => {
  const app = boot({ invalid: true });
  assert.equal(app.elements.get('tileGrid').children.length, 9);
});

test('hiding and restoring survives a page reload', () => {
  const app = boot();
  app.run("hideModule('sales')");
  assert.equal(app.elements.get('tileGrid').children.length, 8);
  const reloaded = boot({ saved: JSON.parse(app.storage.get('restaurantOpsHome.v2')) });
  assert.equal(reloaded.elements.get('tileGrid').children.length, 8);
  reloaded.run("restoreModule('sales')");
  assert.equal(reloaded.elements.get('tileGrid').children.length, 9);
});

test('denied storage does not stop hide, restore, reorder or reset', () => {
  const app = boot({ blocked: true });
  app.run("hideModule('sales')");
  assert.equal(app.elements.get('tileGrid').children.length, 8);
  assert.match(app.elements.get('toast').textContent, /保存できない/);
  app.run("restoreModule('sales'); reorder('sales', 'stock')");
  assert.equal(app.elements.get('tileGrid').children.length, 9);
  assert.equal(app.run('state.order[2]'), 'sales');
  app.elements.get('resetBtn').listeners.click();
  assert.equal(app.run('state.order[0]'), 'sales');
  assert.match(app.elements.get('toast').textContent, /保存できない/);
});

test('touch move defers storage until completion', () => {
  const app = boot();
  app.run("reorder('sales', 'stock', false)");
  assert.equal(app.storage.size, 0);
  assert.equal(app.run('save()'), true);
  assert.equal(JSON.parse(app.storage.get('restaurantOpsHome.v2')).order[2], 'sales');
});
