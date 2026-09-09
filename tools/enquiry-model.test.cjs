const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('../assets/enquiry-model.js');
const time = '115/09/09 14:00';
const input = (applicantId = 'N123456789') => ({ ...M.newDraft(), caseNumber: 'ENQ-DEMO-001', applicantId });

test('lookup places one protected spouse first, starting with zero fetuses', () => {
  const lookedUp = M.lookupRelationships(input());
  assert.equal(lookedUp.targets[0].relation, '配偶');
  assert.equal(lookedUp.targets[0].fetus, 0);
  assert.equal(M.population(lookedUp), 4);
  assert.deepEqual(M.removeTarget(lookedUp, 0), lookedUp);
  const repeated = M.lookupRelationships(lookedUp);
  assert.equal(repeated.targets.filter(t => t.relation === '配偶').length, 1);
});

test('single applicant stays single, including result, assets and requery', () => {
  const draft = M.lookupRelationships(input('A123456789'));
  assert.equal(draft.marriage, 'single');
  assert.ok(draft.targets.every(t => t.relation !== '配偶'));
  const submitted = M.submit(draft, null, time);
  assert.equal(submitted.result.marriage, 'single');
  assert.equal(submitted.result.realEstate.length, 1);
  assert.equal(submitted.result.movable.length, 1);
  assert.equal(M.finishRequery(submitted, time).spouseId, '');
});

test('submission and requery retain manual people and never restore a removed household member', () => {
  let draft = M.lookupRelationships(input());
  draft = M.removeTarget(draft, draft.targets.findIndex(t => t.id === 'N223456722'));
  draft.targets.push({ id: 'F123456789', fetus: 2, source: '自行新增' });
  draft.targetType = 'cohabitant';
  draft.cohabitantConfirmed = true;
  assert.deepEqual(M.validate(draft, [], true), []);
  const submitted = M.submit(draft, null, time);
  assert.ok(!submitted.targets.some(t => t.id === 'N223456722'));
  assert.ok(submitted.targets.some(t => t.id === 'F123456789'));
  const rerun = M.finishRequery(M.startRequery(submitted, time), time);
  assert.deepEqual(rerun.targets, submitted.targets);
  assert.equal(rerun.populationTotal, 6);
  assert.ok(M.lookupRelationships(draft).targets.every(t => t.id !== 'N223456722'));
});

test('editing a draft never mutates saved results or previous result during requery', () => {
  const record = M.defaults()[0];
  const before = M.clone(record);
  const draft = M.newDraft(record);
  draft.targets[0].fetus = 3;
  draft.targets.push({ id: 'F123456789', fetus: 1 });
  draft.targetType = 'cohabitant';
  assert.deepEqual(record, before);
  const running = M.startRequery(record, '115/09/09 15:00');
  assert.equal(running.status, '查調中');
  assert.deepEqual(running.result, before.result);
  const finished = M.finishRequery(running, '115/09/09 15:01');
  assert.deepEqual(finished.previousResult, before.result);
  assert.equal(finished.result.lastQuery, '115/09/09 15:01');
  assert.deepEqual(finished.targets, before.targets);
});

test('initial query is recordable before lookup, then retains partial results awaiting submission', () => {
  let draft = input();
  const started = M.beginInitialRecord(draft, time);
  assert.ok(started.recordId);
  assert.equal(started.phase, 'relationship');
  assert.equal(started.result, null);
  draft.recordId = started.recordId;
  draft = M.lookupRelationships(draft);
  const pending = M.initialRecord(draft, time);
  assert.equal(pending.recordId, started.recordId);
  assert.equal(pending.status, '待確認名單');
  assert.deepEqual(pending.result.received, { applicant: true, family: false, property: false, documents: false });
  const restored = JSON.parse(JSON.stringify(draft));
  restored.targets.push({ id: 'F123456789', fetus: 0, source: '自行新增' });
  assert.equal(pending.targets.length, 3);
  const complete = M.submit(restored, pending, time);
  assert.equal(complete.targets.length, 4);
  assert.equal(complete.status, '查調完成');
});

test('empty or invalid rows do not increase population; valid fetus edits do', () => {
  const draft = M.lookupRelationships(input());
  draft.targets.push({ id: '', fetus: 0 }, { id: 'BAD', fetus: 3 });
  assert.equal(M.population(draft), 4);
  draft.targets[0].fetus = 2;
  assert.equal(M.population(draft), 6);
  draft.targets[0].fetus = 1.5;
  assert.ok(M.validate(draft, [], true).some(e => e.message.includes('整數')));
});

test('case numbers are checked case-insensitively, editing the same case is allowed', () => {
  const existing = M.submit(M.lookupRelationships(input()), null, time);
  const duplicate = { ...input(), caseNumber: '  enq-demo-001  ' };
  assert.equal(M.validate(duplicate, [existing])[0].recordId, existing.recordId);
  assert.deepEqual(M.validate(M.newDraft(existing), [existing]), []);
});

test('applicant and spouse cannot be added again as another person', () => {
  const draft = M.lookupRelationships(input());
  draft.targets.push({ id: draft.applicantId, fetus: 0 });
  draft.targets.push({ id: draft.targets[0].id, fetus: 0 });
  assert.equal(M.population(draft), 4);
  assert.equal(M.validate(draft, [], true).filter(e => e.message.includes('重複')).length, 2);
});

test('cohabitant selection requires an explicit confirmation', () => {
  const draft = M.lookupRelationships(input());
  draft.targetType = 'cohabitant';
  assert.ok(M.validate(draft, [], true).some(e => e.message.includes('同住')));
  draft.cohabitantConfirmed = true;
  assert.deepEqual(M.validate(draft, [], true), []);
  const result = M.submit(draft, null, time).result;
  assert.ok(result.people.every(p => p.cohabiting));
});

test('changing applicant invalidates relationship data but retains manually entered people', () => {
  const draft = M.lookupRelationships(input());
  draft.targets.push({ id: 'F123456789', fetus: 0, source: '自行新增' });
  const changed = M.changeApplicant(draft, 'A123456789');
  assert.equal(changed.marriage, 'unknown');
  assert.deepEqual(changed.targets.map(t => t.id), ['F123456789']);
  assert.ok(M.validate(changed, [], true).some(e => e.message.includes('先查調')));
});

test('legacy data migration keeps saved population without assuming a fetus when unspecified', () => {
  const legacy = { caseNumber: 'LEGACY', applicantId: 'N123456789', spouseId: 'E234567789', targetType: 'family', targets: [], populationTotal: 3, status: '查調完成', lastQuery: time };
  const record = M.migrate(legacy);
  assert.equal(record.targets[0].fetus, 1);
  assert.equal(M.population(record), 3);
  assert.deepEqual(M.migrate(record), record);
  delete legacy.populationTotal;
  assert.equal(M.migrate(legacy).targets[0].fetus, 0);
  legacy.targets.push({ id: 'OLD-DEMO-ID', fetus: 0, source: '自行新增' });
  assert.ok(M.migrate(legacy).targets.some(target => target.id === 'OLD-DEMO-ID'));
});

test('a manually entered spouse is preserved through lookup, draft restoration, submission and requery', () => {
  let draft = input();
  draft.targets.push({ id: 'F823456789', fetus: 2, source: '自行新增' });
  draft = M.setTargetRelation(draft, 0, '配偶');
  draft = M.lookupRelationships(draft);
  assert.equal(draft.targets[0].id, 'F823456789');
  assert.equal(draft.targets[0].relation, '配偶');
  assert.equal(draft.targets[0].source, '自行新增');
  assert.equal(draft.targets[0].fetus, 2);
  assert.equal(draft.targets.filter(target => target.relation === '配偶').length, 1);
  assert.deepEqual(M.validate(draft, [], true), []);
  draft = JSON.parse(JSON.stringify(draft));
  const record = M.submit(draft, null, time);
  assert.equal(record.spouseId, 'F823456789');
  assert.equal(record.populationTotal, 6);
  assert.equal(record.result.marriageSource, 'manual');
  const repeated = M.finishRequery(record, time);
  assert.equal(repeated.spouseId, 'F823456789');
  assert.equal(repeated.result.people.find(person => person.relation === '配偶').fetus, 2);
});

test('a missing spouse can be supplemented after lookup without rewriting the original lookup status', () => {
  let draft = M.lookupRelationships(input('A123456789'));
  draft.targets.push({ id: 'F123456789', fetus: 0, source: '自行新增' });
  draft = M.setTargetRelation(draft, draft.targets.length - 1, '配偶');
  assert.equal(draft.targets[0].id, 'F123456789');
  assert.deepEqual(M.validate(draft, [], true), []);
  const record = M.submit(draft, null, time);
  assert.equal(record.marriage, 'married');
  assert.equal(record.queriedMarriage, 'single');
  assert.equal(record.result.marriageSource, 'manual');
  const restored = M.newDraft(record);
  assert.equal(restored.marriage, 'single');
  assert.equal(M.lookupRelationships(restored).targets[0].id, 'F123456789');
  const removed = M.removeTarget(restored, 0);
  assert.equal(M.submit(removed, record, time).marriage, 'single');
});

test('only one spouse may be selected, whether manual or returned by lookup', () => {
  const queried = M.lookupRelationships(input());
  queried.targets.push({ id: 'F123456789', fetus: 0, source: '自行新增' });
  assert.deepEqual(M.setTargetRelation(queried, queried.targets.length - 1, '配偶'), queried);
  assert.deepEqual(M.setTargetRelation(queried, 0, ''), queried);
  let manual = M.lookupRelationships(input('A123456789'));
  manual.targets.push({ id: 'F123456789', fetus: 0, source: '自行新增' });
  manual = M.setTargetRelation(manual, manual.targets.length - 1, '配偶');
  manual.targets.push({ id: 'H223456789', fetus: 0, source: '自行新增' });
  assert.deepEqual(M.setTargetRelation(manual, manual.targets.length - 1, '配偶'), manual);
  manual.targets[manual.targets.length - 1].relation = '配偶';
  assert.ok(M.validate(manual, [], true).some(error => error.message.includes('只能新增一位')));
});

test('an empty manual spouse must be completed and can still be corrected or removed', () => {
  let draft = M.lookupRelationships(input('A123456789'));
  draft.targets.push({ id: '', fetus: 0, source: '自行新增' });
  draft = M.setTargetRelation(draft, draft.targets.length - 1, '配偶');
  assert.ok(M.validate(draft, [], true).some(error => error.index === 0));
  assert.equal(M.setTargetRelation(draft, 0, '').targets[0].relation, '');
  assert.equal(M.removeTarget(draft, 0).targets.length, draft.targets.length - 1);
});
