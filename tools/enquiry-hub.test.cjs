const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup(saved, options = {}) {
  const context = { document: null };
  context.window = context;
  const confirmations = [];
  context.confirm = message => { confirmations.push(message); return options.confirm === true; };
  const nodes = new Map();
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, {
      value: id === 'hubStatusFilter' ? 'all' : '', handlers: {}, hidden: false,
      addEventListener(type, callback) { this.handlers[type] = callback; },
      querySelectorAll() { return []; }, focus() {},
      closest() { return { querySelector() { return node('propertyWaiting'); } }; }
    });
    return nodes.get(id);
  };
  context.document = { getElementById: node };
  vm.createContext(context);
  for (const file of ['enquiry-model.js', 'admin-enquiry-hub.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets', file), 'utf8'), context);
  }
  const M = context.window.EnquiryModel;
  const page = context.window.EnquiryPage;
  let selected;
  let stored = saved;
  let writes = 0;
  page.initReadOnly({ readRecords: () => stored,
    writeRecords: value => { writes++; if (options.failSave) return false; stored = JSON.parse(JSON.stringify(value)); return true; },
    renderResults: record => { selected = record; } });
  return { M, page, node, confirmations, get writes() { return writes; }, get selected() { return selected; },
    get stored() { return stored; }, set stored(value) { stored = value; },
    search(keyword, status = 'all') {
      node('hubSearchInput').value = keyword;
      node('hubStatusFilter').value = status;
      node('hubSearchForm').handlers.submit({ preventDefault() {} });
    } };
}

test('demo list covers four states and opens the existing case as running', () => {
  const app = setup(null);
  const records = app.M.defaults();
  assert.equal(records.length, 5);
  assert.deepEqual([...new Set(records.map(record => app.page.statusMeta(record).label))].sort(),
    ['查調資料申請中', '待查調', '查調中', '已完成'].sort());
  assert.equal(app.selected.caseNumber, 'TA-116-000123-B');
  assert.equal(app.selected.status, '查調中');
  app.page.renderPeople(app.selected);
  assert.match(app.node('householdResultBody').innerHTML, /張忠政/);
});

test('case number and status filters combine, names do not match, clear restores list', () => {
  const app = setup(null);
  app.search('ta-116-000125', '待查調');
  assert.equal(app.selected.caseNumber, 'TA-116-000125-B');
  app.search('ta-116-000125', '已完成');
  assert.equal(app.selected, undefined);
  assert.match(app.node('hubSearchStatus').textContent, /查無/);
  app.search('張忠政');
  assert.equal(app.selected, undefined);
  app.node('hubSearchClear').handlers.click();
  assert.equal(app.node('hubStatusFilter').value, 'all');
  assert.equal(app.node('hubSearchStatus').textContent, '');
  assert.equal((app.node('hubCaseList').innerHTML.match(/data-case-id=/g) || []).length, 5);
});

test('requesting cases cannot be opened by click, search or status filter', () => {
  const app = setup(null);
  assert.match(app.node('hubCaseList').innerHTML, /data-case-id="hub-demo-124"[^>]* disabled/);
  app.node('hubCaseList').handlers.click({ target: { closest: () => ({ dataset: { caseId: 'hub-demo-124' } }) } });
  assert.equal(app.selected.recordId, 'hub-demo-123');
  app.search('000124');
  assert.equal(app.selected, undefined);
  assert.equal(app.node('hubResultEmpty').hidden, false);
  assert.match(app.node('hubResultEmpty').textContent, /尚未開放查看/);
  app.search('', '查調資料申請中');
  assert.equal(app.selected, undefined);
  app.search('');
  assert.equal(app.selected.recordId, 'hub-demo-123');
  assert.equal(app.node('hubResultEmpty').hidden, true);
  app.search('', '已完成');
  app.page.renderPeople(app.selected);
  app.page.renderStatus(app.selected);
  assert.equal(app.node('resultPendingMessage').textContent, '人員已作確認');
  assert.match(app.node('householdResultBody').innerHTML, /李雅雯/);
  assert.doesNotMatch(app.node('householdResultBody').innerHTML, /張忠政/);
});

test('completion requires confirmation and cancellation leaves the case unchanged', () => {
  const app = setup(null);
  app.node('completeCase').handlers.click();
  assert.equal(app.confirmations.length, 1);
  assert.match(app.confirmations[0], /TA-116-000123-B/);
  assert.equal(app.writes, 0);
  assert.equal(app.selected.status, '查調中');
});

test('confirmed completion persists across reloads and updates status filters', () => {
  const app = setup(null, { confirm: true });
  app.search('000123', '查調中');
  app.node('completeCase').handlers.click();
  assert.equal(app.selected.status, '已完成');
  assert.ok(app.selected.confirmedAt);
  assert.equal(app.node('hubStatusFilter').value, '已完成');
  assert.match(app.node('hubCaseList').innerHTML, /已完成/);
  app.page.renderStatus(app.selected);
  assert.equal(app.node('completeCase').disabled, true);
  app.node('completeCase').handlers.click();
  assert.equal(app.writes, 1);
  const reopened = setup(app.stored);
  assert.equal(reopened.selected.status, '已完成');
  reopened.search('000123', '查調中');
  assert.equal(reopened.selected, undefined);
});

test('incomplete data cannot be confirmed and save failure does not claim completion', () => {
  const pending = setup(null, { confirm: true });
  pending.search('', '查調資料申請中');
  assert.equal(pending.selected, undefined);
  pending.node('completeCase').handlers.click();
  assert.equal(pending.confirmations.length, 0);
  assert.equal(pending.writes, 0);
  const failed = setup(null, { confirm: true, failSave: true });
  failed.node('completeCase').handlers.click();
  assert.equal(failed.selected.status, '查調中');
  assert.equal(failed.node('storageNotice').hidden, false);
  assert.match(failed.node('storageNotice').textContent, /未能儲存/);
});

test('data readiness is distinct from human review and confirmation', () => {
  const app = setup(null);
  for (const [status, description] of [
    ['待查調', '全部查調資料皆已回傳'],
    ['查調中', '人員正在查看查調結果'],
    ['已完成', '人員已作確認']
  ]) {
    app.search('', status);
    assert.ok(Object.values(app.selected.result.received).every(Boolean));
    app.page.renderStatus(app.selected);
    assert.equal(app.node('resultPendingMessage').textContent, description);
  }
  app.search('', '查調資料申請中');
  assert.equal(app.selected, undefined);
  const received = Object.values(app.M.defaults().find(record => record.status === '查調資料申請中').result.received);
  assert.ok(received.some(Boolean));
  assert.ok(received.some(value => !value));
  assert.equal(app.page.statusMeta({ status: '查調完成' }).label, '待查調');
  assert.equal(app.page.statusMeta({ status: '待確認名單' }).label, '查調資料申請中');
});

test('stored cases are preserved, demos are deduplicated and do not write storage', () => {
  const original = setup(null).M.defaults();
  original[0].recordId = 'existing-primary';
  const custom = { ...original[2], recordId: 'existing-custom', caseNumber: 'LOCAL-001', applicantName: '自訂案件' };
  const saved = JSON.parse(JSON.stringify([original[0], custom]));
  const before = JSON.stringify(saved);
  const app = setup(saved);
  assert.equal((app.node('hubCaseList').innerHTML.match(/data-case-id=/g) || []).length, 6);
  app.search('LOCAL-001');
  assert.equal(app.selected.applicantName, '自訂案件');
  assert.equal(JSON.stringify(saved), before);
});

test('ready, reviewing and completed cases remain clickable', () => {
  const app = setup(null);
  for (const [id, status] of [['125', '待查調'], ['126', '查調中'], ['127', '已完成']]) {
    app.node('hubCaseList').handlers.click({ target: { closest: () => ({ dataset: { caseId: `hub-demo-${id}` } }) } });
    assert.equal(app.selected.status, status);
  }
});

test('initial selection skips requesting cases, including the primary demo', () => {
  const records = setup(null).M.defaults();
  records[0].status = '查調資料申請中';
  const app = setup(records);
  assert.equal(app.selected.status, '待查調');
  assert.equal(app.selected.recordId, 'hub-demo-125');
});
