/* 查調工作台：草稿、送出名單與回傳結果分開保存。 */
(function (root) {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const normalizeId = value => String(value || '').trim().toUpperCase();
  const caseKey = value => normalizeId(value);
  const validApplicant = value => /^[A-Z][12]\d{8}$/.test(normalizeId(value));
  const validPerson = value => /^(?:[A-Z][1289]\d{8}|[A-Z][A-D]\d{8})$/.test(normalizeId(value));
  const fetusNumber = value => Number.isInteger(Number(value)) && Number(value) >= 0 ? Number(value) : 0;
  const typeText = type => type === 'cohabitant' ? '共居者' : '家庭成員';
  const uid = () => root.crypto?.randomUUID?.() || `enq-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const knownPeople = {
    N123456789: { name: '陳ＯＯ', birth: '1988-05-12', income: 720000, identity: '原住民' },
    A123456789: { name: '李ＯＯ', birth: '1988-05-12', income: 720000, identity: '原住民' },
    E234567789: { name: '王ＯＯ', birth: '1990-11-18', income: 600000, identity: '一般身分' },
    N223456722: { name: '陳ＯＯ', relation: '子女', birth: '2012-04-23', income: 0, identity: '一般身分' },
    B223456780: { name: '林ＯＯ', relation: '母親', birth: '1958-02-08', income: 180000, identity: '六十五歲以上之老人' }
  };

  function newDraft(record) {
    if (record) return {
      recordId: record.recordId,
      caseNumber: record.caseNumber,
      applicantId: record.applicantId,
      targetType: record.targetType,
      targets: clone(record.targets),
      relationshipApplicant: record.relationshipApplicant || '',
      marriage: record.queriedMarriage || record.marriage || 'unknown',
      excludedIds: clone(record.excludedIds || []),
      cohabitantConfirmed: Boolean(record.cohabitantConfirmed)
    };
    return { recordId: null, caseNumber: '', applicantId: '', targetType: 'family', targets: [], relationshipApplicant: '', marriage: 'unknown', excludedIds: [], cohabitantConfirmed: false };
  }

  function targetsFor(record) {
    const seen = new Set([normalizeId(record.applicantId)]);
    return record.targets.filter(target => {
      const id = normalizeId(target.id);
      if (!validPerson(id) || seen.has(id)) return false;
      seen.add(id);
      return true;
    }).map(target => ({ ...clone(target), id: normalizeId(target.id), fetus: fetusNumber(target.fetus) }));
  }

  function population(record) {
    return (validApplicant(record.applicantId) ? 1 : 0) + targetsFor(record).reduce((total, target) => total + 1 + target.fetus, 0);
  }

  function validate(draft, records, requireLookup = false) {
    const errors = [];
    if (String(draft.caseNumber).trim().length < 3) errors.push({ field: 'caseNumber', message: '請輸入至少 3 個字元的案件編號。' });
    const duplicate = records.find(record => record.recordId !== draft.recordId && caseKey(record.caseNumber) === caseKey(draft.caseNumber));
    if (duplicate) errors.push({ field: 'caseNumber', recordId: duplicate.recordId, message: '案件編號已存在，請開啟既有案件，或使用其他編號。' });
    if (!validApplicant(draft.applicantId)) errors.push({ field: 'applicantId', message: '請輸入本國人身分證字號格式。' });
    if (!requireLookup) return errors;
    if (normalizeId(draft.relationshipApplicant) !== normalizeId(draft.applicantId) || draft.marriage === 'unknown') {
      errors.push({ field: 'targets', message: '請先查調配偶／戶籍，再確認名單送出。' });
    }
    const seen = new Set([normalizeId(draft.applicantId)]);
    draft.targets.forEach((target, index) => {
      const id = normalizeId(target.id);
      if (!id && !Number(target.fetus) && target.relation !== '配偶') return;
      if (!validPerson(id)) errors.push({ field: 'targets', index, message: `第 ${index + 1} 筆請輸入身分證字號或居留證號。` });
      else if (seen.has(id)) errors.push({ field: 'targets', index, message: `第 ${index + 1} 筆 ID 與申請人或其他成員重複。` });
      seen.add(id);
      if (!Number.isInteger(Number(target.fetus)) || Number(target.fetus) < 0) errors.push({ field: 'targets', index, message: `第 ${index + 1} 筆胎兒數須為 0 以上的整數。` });
    });
    const spouses = targetsFor(draft).filter(target => target.relation === '配偶');
    if (draft.targets.filter(target => target.relation === '配偶').length > 1) errors.push({ field: 'targets', message: '配偶只能新增一位，請確認名單。' });
    if (draft.marriage === 'married' && spouses.length !== 1) errors.push({ field: 'targets', message: '配偶資料不完整，請重新查調配偶／戶籍。' });
    if (draft.targetType === 'cohabitant' && targetsFor(draft).length && !draft.cohabitantConfirmed) errors.push({ field: 'targets', message: '請確認名單中的人員同住後勾選。' });
    return errors;
  }

  // Demo 提供有配偶、無配偶兩種情境；新查得的胎兒數一律從 0 開始。
  function lookupRelationships(draft) {
    const next = clone(draft);
    const applicantId = normalizeId(next.applicantId);
    const married = applicantId !== 'A123456789';
    const spouseId = applicantId === 'E234567789' ? 'N123456789' : 'E234567789';
    const previousSpouse = next.targets.find(target => normalizeId(target.id) === spouseId);
    const manualSpouses = next.targets.filter(target => target.relation === '配偶' && target.source === '自行新增');
    next.targets = next.targets.filter(target => target.relation !== '配偶');
    // 手動補填的配偶與胎兒數不被示範查調資料覆寫，也不另加第二位配偶。
    if (manualSpouses.length) {
      next.targets.unshift(...manualSpouses);
    } else if (married) {
      next.targets = next.targets.filter(target => normalizeId(target.id) !== spouseId);
      next.targets.unshift({ id: spouseId, name: knownPeople[spouseId].name, relation: '配偶', fetus: previousSpouse?.fetus ?? 0, source: '戶籍查得', household: true, cohabiting: true });
    }
    for (const id of ['N223456722', 'B223456780']) {
      if (id === applicantId || next.excludedIds.includes(id) || next.targets.some(target => normalizeId(target.id) === id)) continue;
      next.targets.push({ id, name: knownPeople[id].name, relation: knownPeople[id].relation, fetus: 0, source: '戶籍查得', household: true, cohabiting: false });
    }
    next.relationshipApplicant = applicantId;
    next.marriage = married ? 'married' : 'single';
    next.cohabitantConfirmed = false;
    return next;
  }

  function removeTarget(draft, index) {
    const next = clone(draft);
    const target = next.targets[index];
    if (!target || (target.relation === '配偶' && target.source !== '自行新增')) return next;
    if (target.source === '戶籍查得' && target.id) next.excludedIds = [...new Set([...next.excludedIds, normalizeId(target.id)])];
    next.targets.splice(index, 1);
    next.cohabitantConfirmed = false;
    return next;
  }

  function setTargetRelation(draft, index, relation) {
    const next = clone(draft);
    const target = next.targets[index];
    if (!target || target.source !== '自行新增') return next;
    if (relation === '配偶' && next.targets.some((item, i) => i !== index && item.relation === '配偶')) return next;
    target.relation = relation === '配偶' ? '配偶' : '';
    if (target.relation === '配偶') next.targets.unshift(...next.targets.splice(index, 1));
    next.cohabitantConfirmed = false;
    return next;
  }

  function changeApplicant(draft, value) {
    const next = clone(draft);
    next.applicantId = normalizeId(value);
    if (next.applicantId !== normalizeId(next.relationshipApplicant)) {
      next.targets = next.targets.filter(target => target.source !== '戶籍查得' && target.relation !== '配偶');
      next.relationshipApplicant = '';
      next.marriage = 'unknown';
      next.excludedIds = [];
      next.cohabitantConfirmed = false;
    }
    return next;
  }

  function snapshot(record, timestamp, partial = false) {
    const applicantId = normalizeId(record.applicantId);
    const applicant = { ...(knownPeople[applicantId] || { name: '陳ＯＯ', birth: '1988-05-12', income: 720000, identity: '原住民' }), id: applicantId, relation: '本人', fetus: 0, household: true, cohabiting: true };
    const targets = targetsFor(record);
    const people = [applicant, ...targets.map((target, index) => ({
      ...(knownPeople[target.id] || { name: `查調對象 ${index + 1}`, birth: '—', income: 0, identity: '一般身分' }),
      ...target,
      name: target.name || knownPeople[target.id]?.name || `查調對象 ${index + 1}`,
      relation: target.relation || knownPeople[target.id]?.relation || typeText(record.targetType),
      household: Boolean(target.household),
      cohabiting: record.targetType === 'cohabitant' ? Boolean(record.cohabitantConfirmed) : Boolean(target.cohabiting)
    }))];
    const spouse = people.find(person => person.relation === '配偶');
    const realEstate = [{ owner: applicant.name, category: '房屋', address: '新北市／三重段／00123-000', household: true, share: '5 分之 2', area: '36 平方公尺', value: 1200000, common: false }];
    if (spouse) realEstate.push({ owner: spouse.name, category: '土地', address: '南投縣／南投段／0427-0013', household: false, share: '100 分之 5', area: '18.5 平方公尺', value: 320000, common: false });
    const movable = [{ name: applicant.name, interest: 2000, preferred: true, prize: 2000, other: 0, subtotal: 121760 }];
    if (spouse) movable.push({ name: spouse.name, interest: 4000, preferred: false, prize: 0, other: 0, subtotal: 239520 });
    const group = typeText(record.targetType);
    const documents = [
      ['戶籍資料證明', `${applicantId}_戶政查調_戶籍資料證明.pdf`],
      ['婚姻關係資料', `${applicantId}_戶政查調_婚姻關係資料.pdf`],
      ['所得資料清單', `${group}_財稅查調_所得資料清單.pdf`],
      ['全國財產稅總歸戶清單', `${group}_財稅查調_財產歸戶清單.pdf`],
      ['警消人員職務列等資料', `${applicantId}_警政查調_職務列等資料.pdf`]
    ];
    return { applicant, people, marriage: record.marriage, marriageSource: targets.some(target => target.relation === '配偶' && target.source === '自行新增') ? 'manual' : 'lookup', targetType: record.targetType, realEstate, movable, documents, lastQuery: timestamp, received: { applicant: true, family: !partial, property: !partial, documents: !partial } };
  }

  function recordFromDraft(draft, timestamp) {
    const targets = targetsFor(draft);
    const spouse = targets.find(target => target.relation === '配偶');
    return {
      schemaVersion: 2, recordId: draft.recordId || uid(), caseNumber: String(draft.caseNumber).trim(), applicantId: normalizeId(draft.applicantId),
      targetType: draft.targetType, targets, spouseId: spouse?.id || '',
      marriage: spouse ? 'married' : draft.marriage, queriedMarriage: draft.marriage, relationshipApplicant: draft.relationshipApplicant, excludedIds: clone(draft.excludedIds), cohabitantConfirmed: Boolean(draft.cohabitantConfirmed),
      targetTotal: 1 + targets.length, populationTotal: population(draft), lastQuery: timestamp
    };
  }

  function initialRecord(draft, timestamp) {
    const record = { ...recordFromDraft(draft, timestamp), status: '待確認名單', phase: 'confirm', progress: '1/4' };
    record.result = snapshot(record, timestamp, true);
    return record;
  }

  function beginInitialRecord(draft, timestamp) {
    return { ...recordFromDraft(draft, timestamp), status: '查調中', phase: 'relationship', progress: '0/4', result: null };
  }

  // 送出與重新查調使用已確認名單，不再次執行戶籍帶入。
  function submit(draft, existing, timestamp) {
    const record = { ...(existing ? clone(existing) : {}), ...recordFromDraft(draft, timestamp), status: '查調完成', phase: 'complete', progress: '4/4' };
    if (existing?.result) record.previousResult = clone(existing.result);
    record.result = snapshot(record, timestamp);
    return record;
  }

  function startRequery(record, timestamp) {
    return { ...clone(record), status: '查調中', requestedAt: timestamp };
  }

  function finishRequery(record, timestamp) {
    return submit(newDraft(record), record, timestamp);
  }

  function migrate(record) {
    if (record.schemaVersion === 2) return clone(record);
    const targets = clone(record.targets || []).filter(target => normalizeId(target.id) !== normalizeId(record.spouseId));
    if (record.spouseId) {
      const targetFetuses = targets.reduce((total, target) => total + fetusNumber(target.fetus), 0);
      const legacyFetus = record.populationTotal == null ? 0 : Math.max(0, Number(record.populationTotal) - (2 + targets.length) - targetFetuses);
      targets.unshift({ id: normalizeId(record.spouseId), relation: '配偶', name: knownPeople[normalizeId(record.spouseId)]?.name || '王ＯＯ', fetus: fetusNumber(record.spouseFetus ?? legacyFetus), source: '戶籍查得', household: true, cohabiting: true });
    }
    const draft = {
      ...newDraft(), caseNumber: record.caseNumber, applicantId: normalizeId(record.applicantId), targetType: record.targetType || targets[0]?.type || 'family',
      targets: targets.map(target => ({ ...target, household: target.household ?? target.type !== 'cohabitant', cohabiting: target.cohabiting ?? true })),
      relationshipApplicant: normalizeId(record.applicantId), marriage: record.spouseId ? 'married' : 'single', cohabitantConfirmed: true
    };
    const migrated = { ...clone(record), ...recordFromDraft(draft, record.lastQuery), targets: clone(draft.targets), status: record.status || '查調完成' };
    migrated.result = snapshot(migrated, record.lastQuery, migrated.status !== '查調完成');
    return migrated;
  }

  function defaults() {
    return [
      { caseNumber: 'ENQ-116-000123', applicantId: 'N123456789', spouseId: 'E234567789', targetType: 'family', targets: [{ id: 'N223456722', fetus: 0, source: '戶籍查得', type: 'family' }, { id: 'B223456780', fetus: 0, source: '自行新增', type: 'family' }], targetTotal: 4, populationTotal: 5, lastQuery: '116/07/03 13:49', status: '查調完成' },
      { caseNumber: 'ENQ-116-000127', applicantId: 'A123456789', spouseId: '', targetType: 'cohabitant', targets: [{ id: 'B223456780', fetus: 0, source: '自行新增', type: 'cohabitant' }], targetTotal: 2, populationTotal: 2, lastQuery: '116/07/03 14:12', status: '查調完成' }
    ].map(migrate);
  }

  const api = { clone, normalizeId, caseKey, validApplicant, validPerson, fetusNumber, typeText, uid, knownPeople, newDraft, targetsFor, population, validate, lookupRelationships, removeTarget, setTargetRelation, changeApplicant, snapshot, beginInitialRecord, initialRecord, submit, startRequery, finishRequery, migrate, defaults };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.EnquiryModel = api;
})(globalThis);
