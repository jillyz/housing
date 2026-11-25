const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const data = fs.readFileSync(path.join(root, 'backend/assets/js/enquiry-rules-data.js'), 'utf8');
const script = fs.readFileSync(path.join(root, 'backend/assets/js/enquiry-rules.js'), 'utf8');
const historyScript = fs.readFileSync(path.join(root, 'backend/assets/js/enquiry-rules-history.js'), 'utf8');
const caseIds = ["LA115A00000001","LF115F00000002","CH115F00000003","LH115H00000004","LB115B00000005","LA115A00000006","CH115D00000007","LE115E00000008","LF115F00000009","LH115H00000010","CH115F00000011"];
function setup(id = 'LA115A00000001', supplemented = false, list = false, batch = '') {
  const nodes = new Map();
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, { value: '', textContent: '', innerHTML: '', handlers: {}, addEventListener(name, callback) { this.handlers[name] = callback; }, focus() {}, scrollIntoView() {} });
    return nodes.get(id);
  };
  const context = {
    URL, URLSearchParams, Intl,
    location: { search: `?case=${id}${supplemented ? '&members=complete' : ''}${batch ? '&batch=' + batch : ''}`, pathname: `/backend/enquiry-${list ? 'hub' : 'detail'}.html`, href: `http://localhost/backend/enquiry-detail.html?case=${id}`, assign(url) { this.assigned = url; } },
    history: { replaceState() {} },
    document: { querySelectorAll() { return []; }, getElementById(id) { if (id === (list ? 'detailBody' : 'enquiryCaseList')) return null; return node(id); } }
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(data, context);
  vm.runInContext(historyScript, context);
  vm.runInContext(script, context);
  return { model: context.EnquiryRuleDemo, node, context, html: node(list ? 'enquiryCaseList' : 'detailBody').innerHTML };
}

test('統一案件編號符合機關、年度、縣市及八碼流水號，列表明細歷史連結一致', () => {
  const { model, html: list } = setup('', false, true);
  const agencies = { '國家住都中心': 'CH', '新北市政府': 'LF', '臺北市政府': 'LA', '桃園市政府': 'LH', '臺中市政府': 'LB', '高雄市政府': 'LE' };
  const cities = ['A', 'F', 'F', 'H', 'B', 'A', 'D', 'E', 'F', 'H', 'F'];
  assert.equal(new Set(model.cases.map(record => record.id)).size, 11);
  model.cases.forEach((record, index) => {
    assert.match(record.id, /^[A-Z]{2}\d{3}[A-Z]\d{8}$/);
    assert.equal(record.id.length, 14);
    assert.equal(record.id, caseIds[index]);
    assert.equal(record.id.slice(0, 2), agencies[record.agency]);
    assert.equal(record.id.slice(2, 5), '115');
    assert.equal(record.id[5], cities[index]);
    assert.equal(record.id.slice(6), String(index + 1).padStart(8, '0'));
    assert.equal(record.id, record.agencyCode + record.caseYear + record.cityCode + record.sequence);
    if (record.querying) return;
    assert.ok(list.includes(`href="enquiry-detail.html?case=${record.id}"`));
    const detail = setup(record.id);
    assert.ok(detail.html.includes(`<dd>${record.id}</dd>`));
    assert.equal(detail.node('viewHistoryCase').textContent, record.id);
    assert.ok(detail.node('enquiryHistoryBody').innerHTML.includes(`enquiry-detail.html?case=${record.id}&batch=`));
  });
  assert.doesNotMatch(list, /DEMO115/);
});

test('十一種三代家庭情境包含四件缺漏、六件完成及一件查調中', () => {
  const { model } = setup();
  assert.equal(model.cases.length, 11);
  assert.equal(model.cases.filter(c => !model.ready(c)).length, 4);
  assert.equal(model.cases.filter(c => model.status(c) === '查調完成').length, 6);
  assert.equal(model.cases.filter(c => model.status(c) === '查調中').length, 1);
  for (const record of model.cases) {
    assert.ok(model.people(record).some(p => p.key === record.applicant));
    assert.equal(model.ready(record, model.requiredKeys(record)), true);
    assert.deepEqual([...new Set(model.people(record).filter(p => p.caseRequired !== false).map(p => p.generation))].sort(), [1, 2, 3]);
    assert.equal(model.requiredKeys(record).length, 5);
  }
});

test('全部案件以同一個五人家庭為基底，寄居者僅列戶政、不計入人數及財務', () => {
  const { model } = setup();
  const expectedNames = ['張大富', '張忠政', '張曉雯', '劉欣慧', '張曉晨'].sort();
  for (const record of model.cases) {
    const family = model.people(record).filter(p => model.requiredKeys(record).includes(p.key));
    assert.deepEqual(Array.from(family, p => p.name).sort(), expectedNames);
    assert.equal(family.find(p => p.name === '張曉雯').title, record.id === 'CH115F00000011' ? '外孫女' : '長孫女');
    assert.equal(family.find(p => p.name === '張曉晨').title, record.separate ? '長子' : '長孫');
    const lodgers = model.householdView(record).flatMap(h => h.members).filter(p => ['陳OO', '廖OO'].includes(p.name));
    assert.equal(lodgers.length, 2);
    lodgers.forEach(p => { assert.equal(p.title, '寄居'); assert.equal(p.relation, '未填列'); assert.equal(model.requiredKeys(record).includes(p.key), false); });
  }
  const record = JSON.parse(JSON.stringify(model.cases[6]));
  const baseline = model.totals(record);
  model.people(record).filter(p => p.caseRequired === false).forEach(p => { p.income = 99999999; p.interest = 99999999; p.fetus = 2; p.properties.push({ value: 99999999 }); });
  assert.deepEqual(model.totals(record), baseline);
  assert.equal(model.population(record).memberCount, 5);
  assert.equal(model.population(record).fetusCount, 1);
});

test('養父註記在張忠政，輔助宣告在張大富；空白註記與來源說明不呈現', () => {
  const { html } = setup('LE115E00000008');
  const family = html.match(/<section class="item" id="familyInfo"[\s\S]*?<\/section>/)[0];
  const rows = [...family.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map(m => m[1]).filter(row => row.includes('<td '));
  const elder = rows.find(row => row.includes('<td data-th="姓名">張大富</td>'));
  const applicant = rows.find(row => row.includes('<td data-th="姓名">張忠政</td>'));
  assert.match(elder, /與申請人關係">養父/);
  assert.match(elder, /rules-note-tag">輔助宣告/);
  assert.match(elder, /張忠政為張大富之輔助人/);
  assert.match(applicant, /養父：張大富/);
  assert.match(applicant, /有養父母：是/);
  assert.doesNotMatch(applicant, /<span>父：/);
  assert.doesNotMatch(elder, /有養父母：是/);
  for (let n = 1; n <= 9; n++) {
    const detail = setup(`${caseIds[n - 1]}`, n <= 4).html;
    assert.doesNotMatch(detail, /有養父母：否|無個人記事|記事類型、代碼與格式參考|docs.google.com\/spreadsheets/);
    assert.match(detail, /data-th="註記"><\/td>/);
    for (const id of ['welfareInfo', 'incomeInfo', 'propertyInfo', 'movableInfo']) {
      const section = detail.match(new RegExp(`<section class="item" id="${id}"[\\s\\S]*?<\\/section>`))[0];
      assert.doesNotMatch(section, /陳OO|廖OO/);
    }
  }
});

test('同一成員跨情境字號固定，十碼格式、性別碼與檢查碼均正確', () => {
  const { model } = setup();
  const regions = [10, 11, 12, 13, 14, 15, 16, 17, 34, 18, 19, 20, 21, 22, 35, 23, 24, 25, 26, 27, 28, 29, 32, 30, 31, 33];
  const genders = { '張大富': '1', '張忠政': '1', '張曉晨': '1', '張曉雯': '2', '劉欣慧': '2', '陳OO': '1', '廖OO': '2' };
  const identities = new Map();
  for (const record of model.cases) for (const person of model.people(record)) {
    const id = person.idNumber;
    assert.match(id, /^[A-Z][12]\d{8}$/);
    assert.equal(id[1], genders[person.name]);
    const region = regions[id.charCodeAt(0) - 65];
    const sum = Math.floor(region / 10) + region % 10 * 9
      + [...id.slice(1)].reduce((total, digit, i) => total + Number(digit) * [8, 7, 6, 5, 4, 3, 2, 1, 1][i], 0);
    assert.equal(sum % 10, 0, `${person.name} 檢查碼`);
    if (identities.has(person.name)) assert.equal(id, identities.get(person.name));
    identities.set(person.name, id);
  }
  assert.equal(new Set(identities.values()).size, 7);
});

test('養父及社福資格沿用同一家庭基底，未成年子女逐一列名', () => {
  const { model } = setup();
  for (let n = 1; n <= 9; n++) {
    const record = model.cases[n - 1];
    const applicant = model.people(record).find(p => p.key === record.applicant);
    assert.equal(applicant.adoptiveFather, '張大富');
    assert.equal(applicant.father, '未登載');
    const { html } = setup(record.id, n <= 4);
    const welfare = html.match(/<section class="item" id="welfareInfo"[\s\S]*?<\/section>/)[0];
    const rows = [...welfare.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(m => m[1]);
    const elder = rows.find(row => row.includes('data-th="姓名">張大富'));
    const applicantRow = rows.find(row => row.includes('data-th="姓名">張忠政'));
    assert.match(elder, /65歲以上老人/);
    assert.match(elder, /身心障礙（輕度）/);
    assert.match(applicantRow, /中低收入戶/);
    assert.match(applicantRow, /平地原住民/);
    assert.match(applicantRow, /育有未成年子女<ol class="rules-minor-children"><li>張曉雯<\/li><li>張曉晨<\/li><\/ol>/);
    assert.doesNotMatch(applicantRow, /身心障礙/);
  }
});

test('有偶先取得配偶姓名，再以姓名比對案件成員，未比對到即呈現分戶', () => {
  const { model } = setup();
  for (const record of model.cases) {
    const result = model.spouseCheck(record);
    assert.equal(result.name, '劉欣慧');
    assert.equal(Boolean(result.member), record.declared.includes(record.spouse));
    if (!result.member) {
      assert.equal(result.separate, true);
      assert.equal(record.households[0].members.some(p => p.name === result.name), false);
      assert.ok(record.households[1].members.some(p => p.name === result.name));
      assert.match(setup(record.id).html, /劉欣慧<\/strong>（分戶）/);
    }
    const supplemented = model.spouseCheck(record, model.requiredKeys(record));
    assert.equal(supplemented.member.name, '劉欣慧');
  }
  const record = JSON.parse(JSON.stringify(model.cases[4]));
  record.spouse = 999;
  assert.equal(model.spouseCheck(record).member.name, '劉欣慧', '配偶姓名比對不依賴預設配偶鍵值');
  model.people(record).find(p => p.key === record.applicant).spouseName = '未比對到的配偶';
  assert.equal(model.spouseCheck(record).member, undefined);
  assert.equal(model.spouseCheck(record).separate, true);
  assert.equal(model.ready(record), false);
  record.marriage = '無偶';
  assert.equal(model.spouseCheck(record), null);
});

test('兩戶以外的已列案件成員另列一區，仍計入授權、人數與財產且不重複', () => {
  const { model, html } = setup('CH115F00000011');
  const record = model.cases[10];
  const others = model.otherCaseMembers(record);
  assert.deepEqual(Array.from(others, p => p.name), ['張曉雯']);
  assert.equal(others[0].relation, '女兒');
  assert.equal(record.households.flatMap(h => h.members).some(p => p.key === 114), false);
  assert.equal(model.ready(record), true);
  assert.equal(model.population(record).memberCount, 5);
  assert.equal(model.population(record).total, 6);
  assert.equal(model.totals(record).movable, 197604);
  const family = html.match(/<section class="item" id="familyInfo"[\s\S]*?<\/section>/)[0];
  assert.match(family, /id="otherCaseMembers"><h3>其他案件成員（不在申請人戶及配偶戶）<\/h3>/);
  assert.match(family, /role="note">多列成員，審查時需剔除。<\/p>/);
  assert.equal((family.match(/data-th="姓名">張曉雯<\/td>/g) || []).length, 1);
  for (const id of ['caseInfo', 'incomeInfo', 'welfareInfo', 'movableInfo']) {
    const section = html.match(new RegExp(`<section class="item" id="${id}"[\\s\\S]*?<\\/section>`))[0];
    assert.match(section, /data-th="姓名">張曉雯<\/td>/);
  }
  const declared = record.declared.filter(key => key !== 114);
  assert.equal(model.otherCaseMembers(record, declared).length, 0);
  assert.equal(model.ready(record, declared), false);
  assert.ok(model.missing(record, declared).some(p => p.key === 114));
  const moved = JSON.parse(JSON.stringify(record));
  moved.households[0].members.push(moved.caseMembers.find(p => p.key === 114));
  assert.equal(model.otherCaseMembers(moved).length, 0);
  assert.equal(model.people(moved).filter(p => p.key === 114).length, 1);
  assert.equal(model.totals(moved).movable, 197604);
});

test('同戶與分戶的申請人配偶皆必須列入案件', () => {
  const { model } = setup();
  for (const record of model.cases.filter(c => c.marriage === '有偶')) {
    assert.equal(model.ready(record, record.declared.filter(key => key !== record.spouse)), false);
    assert.ok(model.missing(record, [record.applicant]).some(p => p.key === record.spouse));
  }
  const both = model.cases.find(c => c.id === 'LH115H00000004');
  assert.equal(model.ready(both, [41, 44, 45, 42]), false, '只補配偶但未補長輩仍不可完整查調');
  assert.equal(model.ready(both, [41, 44, 45, 43]), false, '只補長輩但未補配偶仍不可完整查調');
});

test('成員未齊的戶政表格保留八欄，未填列者僅提供姓名稱謂及填列狀態', () => {
  for (let n = 1; n <= 4; n++) {
    const { html, model } = setup(`${caseIds[n - 1]}`);
    assert.doesNotMatch(html, /id="(?:welfareInfo|incomeInfo|propertyInfo|movableInfo)"/);
    assert.match(html, /身分證字號/);
    assert.match(html, /是否同意授權查調/);
    const record = model.cases[n - 1];
    for (const household of model.householdView(record)) for (const person of household.members) {
      if (record.declared.includes(person.key)) assert.ok(person.idNumber && person.birth && person.father && person.mother && Array.isArray(person.notes));
      else assert.deepEqual(Object.keys(person).sort(), ['key', 'name', 'relation', 'title']);
    }
    const family = html.match(/<section class="item" id="familyInfo"[\s\S]*?<\/section>/)[0];
    assert.match(family, /身分證字號/);
    assert.match(family, /生日/);
    assert.match(family, /個人記事/);
    assert.match(family, /有養父母：是/);
    assert.equal(model.assessment(record), null);
    const rows = [...family.matchAll(/<tr class="rules-member-row--(unlisted|declared)">([\s\S]*?)<\/tr>/g)];
    assert.equal(rows.length, 7);
    for (const row of rows) {
      assert.equal(row[1] === 'unlisted', row[2].includes('rules-unfilled'));
      const cells = [...row[2].matchAll(/<td data-th="([^"]+)">([\s\S]*?)<\/td>/g)];
      if (row[1] === 'unlisted') {
        for (const cell of cells) if (!['姓名', '與申請人關係', '（稱謂）與戶長關係'].includes(cell[1])) assert.equal(cell[2], '');
      } else {
        assert.ok(cells.find(cell => cell[1] === '身分證字號')[2]);
        assert.ok(cells.find(cell => cell[1] === '生日')[2]);
      }
    }
    assert.equal(rows.filter(row => row[1] === 'unlisted').length, model.missing(record).length + 2);
    const headerGroups = [...family.matchAll(/<thead>(.*?)<\/thead>/g)].map(match => match[1]);
    assert.ok(headerGroups.length);
    assert.ok(headerGroups.every(headers => (headers.match(/<th /g) || []).length === 8));
    if (record.marriage === '有偶') assert.match(html, /申請人配偶姓名/);
  }
});

test('全部九案的完整狀態都有五類查調資料，還原入口只出現在補齊模擬', () => {
  for (let n = 1; n <= 9; n++) {
    const { html } = setup(`${caseIds[n - 1]}`, n <= 4);
    for (const id of ['familyInfo', 'welfareInfo', 'incomeInfo', 'propertyInfo', 'movableInfo']) assert.ok(html.includes(`id="${id}"`));
    for (const label of ['身分證字號', '生日', '父／養父', '母／養母', '註記']) assert.ok(html.includes(label));
    assert.equal(html.includes('還原成員未齊情境'), n <= 4);
  }
});

test('其他成員的分戶配偶不會被延伸為必要成員', () => {
  const { model, html } = setup('LF115F00000009');
  const record = model.cases[8];
  assert.equal(model.requiredKeys(record).length, 5);
  assert.equal(model.ready(record), true);
  assert.match(html, /申請人配偶姓名：<strong>劉欣慧/);
  assert.equal(model.people(record).find(p => p.key === 93).spouseName, '張陳梅');
  assert.equal(model.people(record).some(p => p.name === '張陳梅'), false);
  assert.doesNotMatch(html, /data-th="姓名">張陳梅/);
});

test('多筆記事及養父母都能獨立呈現，不以歷史記事判斷現有婚姻', () => {
  const marriage = setup('LA115A00000006');
  assert.match(marriage.html, /查看 3 筆個人記事/);
  assert.match(marriage.html, /申請人配偶姓名：<strong>劉欣慧/);
  const adoption = setup('LE115E00000008');
  assert.match(adoption.html, /有養父母：是/);
  assert.match(adoption.html, /養父：張大富/);
  assert.match(adoption.html, /輔助宣告/);
  assert.match(adoption.html, /張忠政為張大富之輔助人/);
});

test('所得與財產加總一致，零筆財產明確呈現為查無紀錄', () => {
  const { model, html } = setup('CH115D00000007');
  const totals = model.totals(model.cases[6]);
  assert.equal(totals.income, 216000);
  assert.equal(totals.property, 0);
  assert.equal(totals.movable, 138802);
  assert.match(html, /3,000 元/);
  const single = setup('LB115B00000005');
  assert.match(single.html, /均無不動產紀錄（合計 0 元）/);
  assert.equal(single.model.totals(single.model.cases[4]).movable, 0);
});

test('案件與戶政分開呈現與申請人關係及與戶長關係', () => {
  const before = setup('CH115F00000003');
  const record = before.model.cases[2];
  const members = before.html.match(/<section class="item" id="caseInfo"[\s\S]*?<\/section>/)[0];
  assert.deepEqual([...members.matchAll(/<th scope="col">(.*?)<\/th>/g)].map(m => m[1]), ['姓名', '與申請人關係', '身分證字號', '是否同意授權查調']);
  const family = before.model.householdView(record).flatMap(h => h.members);
  assert.equal(family.find(p => p.key === 31).relation, '本人');
  assert.equal(family.find(p => p.key === 31).title, '長子');
  assert.equal(family.find(p => p.key === 33).relation, '養父');
  assert.equal(family.find(p => p.key === 33).title, '戶長');
  assert.equal(family.find(p => p.key === 34).relation, '女兒');
  assert.equal(family.find(p => p.key === 34).title, '長孫女');
  assert.equal(family.find(p => p.key === 32).relation, '未填列');
  assert.equal(family.find(p => p.key === 32).title, '戶長');
  const after = before.model.householdView(record, before.model.requiredKeys(record)).flatMap(h => h.members);
  assert.equal(after.find(p => p.key === 32).relation, '配偶');
  const adopted = before.model.cases[7];
  assert.equal(before.model.relationship(adopted, 83), '養父');
  assert.equal(before.model.relationship(adopted, 82), '配偶');
  assert.equal(before.model.relationship(before.model.cases[8], 95), '兒子');
  const rendered = setup('CH115F00000003', true).html.match(/<section class="item" id="familyInfo"[\s\S]*?<\/section>/)[0];
  assert.match(rendered, /<th scope="col">與申請人關係<\/th>/);
  assert.match(rendered, /<th scope="col">（稱謂）<br>與戶長關係<\/th>/);
  assert.match(rendered, /<td data-th="與申請人關係">配偶<\/td>/);
});

test('人數依案件已列成員加胎兒數，未填列成員的胎兒不先計入', () => {
  const before = setup('CH115F00000003');
  const record = before.model.cases[2];
  assert.equal(before.model.population(record).memberCount, 4);
  assert.equal(before.model.population(record).fetusCount, 0);
  assert.equal(before.model.population(record).total, 4);
  assert.match(before.html, /總人數：<strong>4 人/);
  const after = setup('CH115F00000003', true);
  const counts = after.model.population(after.model.cases[2], after.model.requiredKeys(after.model.cases[2]));
  assert.equal(counts.memberCount, 5);
  assert.equal(counts.fetusCount, 1);
  assert.equal(counts.total, 6);
  assert.match(after.html, /總人數：<strong>6 人/);
  const historical = setup('CH115F00000003', true, false, 'INQ-003');
  assert.match(historical.html, /總人數：<strong>4 人/);
  const filled = setup('LB115B00000005');
  assert.match(filled.html, /<h3 class="rules-members-heading">案件成員<\/h3><p class="rules-population">總人數：<strong>6 人/);
  const duplicated = record.declared.concat(record.declared);
  assert.equal(before.model.population(record, duplicated).total, 4);
});

test('平均所得分母含胎兒，列表初判、案件總人數與明細計算一致', () => {
  const sample = setup('CH115D00000007');
  const record = sample.model.cases[6];
  assert.equal(sample.model.assessment(record)[1].value, 3000);
  assert.match(sample.html, /總人數：6 人（含胎兒）/);
  assert.match(sample.html, /÷ 總人數（含胎兒）/);
  const clone = JSON.parse(JSON.stringify(record));
  clone.households[1].members[0].fetus = 2;
  assert.equal(sample.model.population(clone).total, 7);
  assert.equal(sample.model.assessment(clone)[1].value, 2571);
  const { html } = setup('', false, true);
  const row = html.match(/<tr data-case-id="CH115D00000007">[\s\S]*?<\/tr>/)[0];
  assert.match(row, /每人每月平均所得：3,000 元/);
  for (const record of sample.model.cases) {
    const spouse = sample.model.people(record).find(p => p.key === record.spouse);
    assert.equal(spouse.fetus, 1);
    assert.equal(sample.model.population(record).fetusCount, Number(record.declared.includes(record.spouse)));
    if (record.querying) continue;
    const supplemented = !sample.model.ready(record);
    const detail = setup(record.id, supplemented).html;
    const declared = sample.model.requiredKeys(record);
    const expectedAverage = Math.round(sample.model.totals(record).income / 12 / 6);
    assert.equal(sample.model.population(record, declared).total, 6);
    assert.equal(sample.model.assessment(record, declared)[1].value, expectedAverage);
    const info = detail.match(/<section class="item" id="caseInfo"[\s\S]*?<\/section>/)[0];
    assert.match(info, /案件成員<\/h3><p class="rules-population">總人數：<strong>6 人/);
    assert.match(info, /劉欣慧<small class="rules-muted d-block">胎兒 1 人<\/small>/);
    assert.ok(detail.includes(`每人每月平均所得<strong>${new Intl.NumberFormat('zh-TW').format(expectedAverage)} 元`));
  }
});

test('動產以利息換算存款本金，加上證券、中獎與其他一次性所得，限額採嚴格小於', () => {
  const { model, html } = setup('CH115D00000007');
  assert.equal(model.parameters.interestRate, 1.67, '利率參數以百分比數值設定');
  const person = { interest: 1500, securities: 20000, prizeIncome: 30000, oneTimeIncome: 5000 };
  assert.equal(model.movable(person).deposit, 89820);
  assert.equal(model.movable(person).total, 144820);
  model.parameters.interestRate = 3;
  assert.equal(model.movable(person).deposit, 50000);
  assert.equal(model.movable(person).total, 105000);
  model.parameters.interestRate = 1.67;
  const record = model.cases[6];
  model.parameters.movableLimit = 138802;
  assert.equal(model.assessment(record)[3].value, 138802);
  assert.equal(model.assessment(record)[3].limit, 138802);
  assert.equal(model.assessment(record)[3].pass, false);
  model.parameters.movableLimit = 138803;
  assert.equal(model.assessment(record)[3].pass, true);
  const section = html.match(/<section class="item" id="movableInfo"[\s\S]*?<\/section>/)[0];
  assert.match(section, /利率：1\.67%/);
  assert.deepEqual([...section.matchAll(/<th scope="col">(.*?)<\/th>/g)].map(m => m[1]), ['姓名', '利息（存款本金）', '中獎所得', '其他所得', '小計']);
  assert.match(section, /data-th="利息（存款本金）">750 元<\/td>/);
  assert.doesNotMatch(section, /（存款本金 [\d,]+ 元）/);
  assert.match(section, /data-th="中獎所得">12,000 元/);
  assert.match(section, /data-th="其他所得">8,000 元/);
  assert.match(section, /data-th="小計">64,910 元/);
  assert.match(section, /含有價證券 20,000 元/);
  assert.match(section, /全案動產價值合計<strong>138,802 元/);
  const list = setup('', false, true).html;
  assert.match(list.match(/<tr data-case-id="CH115D00000007">[\s\S]*?<\/tr>/)[0], /動產價值：138,802 元，未超標/);
  model.parameters.interestRate = 0;
  assert.throws(() => model.movable(person), /利率參數/);
});

test('不動產標記原住民保留地與道路用地，一般房屋為否', () => {
  for (const [id, uses] of [['LA115A00000006', [false, true]], ['CH115D00000007', [true, true]]]) {
    const { html } = setup(id);
    const section = html.match(/<section class="item" id="propertyInfo"[\s\S]*?<\/section>/)[0];
    const cells = [...section.matchAll(/<td data-th="原住民保留地、道路用地">([\s\S]*?)<\/td>/g)];
    assert.equal(cells.length, uses.length);
    cells.forEach((cell, index) => assert.ok(cell[1].includes(`aria-label="${uses[index] ? '是' : '否'}"`)));
  }
});

test('不動產呈現九欄、兩位持有者，明細與初判總額一致', () => {
  for (const [id, supplemented, expected] of [['CH115F00000003', true, 1200000], ['LA115A00000006', false, 7500000], ['CH115D00000007', false, 0]]) {
    const { html, model } = setup(id, supplemented);
    const propertySection = html.match(/<section class="item" id="propertyInfo"[\s\S]*?<\/section>/)[0];
    const propertyTable = propertySection.match(/<table[^>]*rules-property-table[^>]*>[\s\S]*?<\/table>/)[0];
    const headers = [...propertyTable.matchAll(/<th scope="col">(.*?)<\/th>/g)].map(match => match[1]);
    assert.deepEqual(headers, ['持有者', '類別', '地段地號建號／座落', '戶籍地', '持分比', '房地面積', '房地現值金額', '公同共有', '原住民保留地、道路用地']);
    assert.equal((propertySection.match(/<td data-th="持有者">/g) || []).length, 2);
    assert.match(propertySection, /張忠政/);
    assert.match(propertySection, /劉欣慧/);
    assert.match(propertySection, /平方公尺/);
    assert.doesNotMatch(propertySection, /undefined|未提供/);
    assert.match(propertySection, /aria-label="是"/);
    assert.match(propertySection, /aria-label="否"/);
    const record = model.cases.find(c => c.id === id);
    assert.equal(model.totals(record).property, expected);
    assert.equal(model.assessment(record, model.requiredKeys(record))[2].value, expected);
    assert.ok(propertySection.includes(new Intl.NumberFormat('zh-TW').format(expected) + ' 元'));
  }
});

test('列表入口、交集篩選、重設與無結果提示', () => {
  const { node } = setup('', false, true);
  assert.deepEqual([...node('enquiryCaseList').innerHTML.matchAll(/<tr data-case-id="([^"]+)">/g)].map(match => match[1]), ['LF115F00000002', 'CH115F00000003', 'LH115H00000004', 'LA115A00000001', 'LB115B00000005', 'LA115A00000006', 'CH115D00000007', 'LE115E00000008', 'LF115F00000009', 'LH115H00000010', 'CH115F00000011']);
  assert.equal((node('enquiryCaseList').innerHTML.match(/href="enquiry-detail.html\?case=/g) || []).length, 10);
  node('enquiryAgency').value = '新北市政府';
  node('enquiryStage').value = 'members';
  node('enquiryFilter').handlers.submit({ preventDefault() {} });
  assert.equal((node('enquiryCaseList').innerHTML.match(/href="enquiry-detail.html\?case=/g) || []).length, 1);
  assert.match(node('enquiryCaseList').innerHTML, /LF115F00000002/);
  node('enquiryKeyword').value = '找不到的名字';
  node('enquiryFilter').handlers.submit({ preventDefault() {} });
  assert.match(node('enquiryCaseList').innerHTML, /查無符合條件/);
  node('enquiryFilter').handlers.reset({ preventDefault() {} });
  assert.match(node('enquirySummary').textContent, /共 11 筆查調案件/);
});

test('列表隱藏情境欄，拆分社宅機關，六項初判有勾號與注意圖示', () => {
  const { html } = setup('', false, true);
  assert.doesNotMatch(html, /<th[^>]*>案件情境<\/th>|申請社宅／權責機關/);
  assert.match(html, /<th[^>]*>申請社宅<\/th>/);
  assert.match(html, /<th[^>]*>權責機關<\/th>/);
  assert.match(html, /colspan="6" scope="colgroup">資格初判/);
  assert.equal((html.match(/rules-info"/g) || []).length, 11);
  assert.match(html, /rules-verdict--pass/);
  assert.match(html, /rules-verdict--fail/);
  assert.match(html, /rules-result-cell--waiting/);
  assert.match(html, /rules-result-cell--loading/);
});

test('Excel 匯出採目前已套用的篩選及順序，查無資料時停用', async () => {
  const { node, context } = setup('', false, true);
  let downloaded = [];
  context.EnquiryRuleExport = { async download(records) { downloaded = Array.from(records, r => r.id); } };
  node('enquiryAgency').value = '國家住都中心';
  node('enquiryStage').value = 'complete';
  node('enquiryFilter').handlers.submit({ preventDefault() {} });
  await node('enquiryExport').handlers.click();
  assert.deepEqual(downloaded, ['CH115D00000007', 'CH115F00000011']);
  assert.equal(node('enquiryExportStatus').textContent, '已匯出 2 筆案件。');
  assert.equal(node('enquiryExport').disabled, false);
  node('enquiryKeyword').value = '不存在的案件';
  node('enquiryFilter').handlers.submit({ preventDefault() {} });
  assert.equal(node('enquiryExport').disabled, true);
  await node('enquiryExport').handlers.click();
  assert.equal(downloaded.length, 2);
});

test('Excel 匯出失敗顯示原因，且可重試', async () => {
  const { node, context } = setup('', false, true);
  context.EnquiryRuleExport = { async download() { throw new Error('下載暫時失敗'); } };
  await node('enquiryExport').handlers.click();
  assert.equal(node('enquiryExportStatus').textContent, '匯出失敗：下載暫時失敗');
  assert.equal(node('enquiryExport').disabled, false);
});

test('未齊全不初判、完整回傳五項判定與參考門檻一致', () => {
  const { model } = setup();
  assert.equal(model.assessment(model.cases[0]), null);
  const over = model.assessment(model.cases[5]);
  assert.equal(over.length, 5);
  assert.ok(over.every(c => c.pass === false));
  const lowIncome = model.assessment(model.cases[6]);
  assert.ok(lowIncome.every(c => c.pass));
  assert.equal(lowIncome[4].value, 1);
  const record = JSON.parse(JSON.stringify(model.cases[4]));
  record.households[0].members[0].income = 1450000;
  record.households[0].members.slice(1).forEach(p => { p.income = 0; });
  assert.equal(model.assessment(record)[0].value, 1450000);
  assert.equal(model.assessment(record)[0].pass, false, '總所得須小於門檻');
});

test('列表成員未完備六格黃底留白，明細保留等待提示', () => {
  const { html } = setup('', false, true);
  for (let n = 1; n <= 4; n++) {
    const row = html.match(new RegExp(`<tr data-case-id="${caseIds[n - 1]}">[\\s\\S]*?<\\/tr>`))[0];
    assert.doesNotMatch(row, /fa-hourglass-half|fa-circle-exclamation|fa-circle-check/);
    assert.equal((row.match(/class="rules-result-cell rules-result-cell--waiting" aria-label="[^"]+"><\/td>/g) || []).length, 6);
    const detail = setup(`${caseIds[n - 1]}`).html;
    const summary = detail.match(/<section class="item" id="enquirySummary"[\s\S]*?<\/section>/)[0];
    assert.equal((summary.match(/fa-hourglass-half/g) || []).length, 4);
    assert.doesNotMatch(summary, /fa-circle-exclamation|fa-circle-check/);
  }
});

test('租金級距僅呈現文字，超出級距時留白，列表明細均無圖示', () => {
  const { html } = setup('', false, true);
  const rents = [...html.matchAll(/<td data-th="租金級距" class="rules-result-cell[^"]*"[^>]*>(.*?)<\/td>/g)];
  assert.equal(rents.length, 11);
  rents.forEach(cell => assert.doesNotMatch(cell[1], /<button|<i |超標|注意/));
  assert.match(rents[4][1], /第1級/);
  assert.equal(rents[5][1], '');
  assert.match(rents[6][1], /第1級/);
  for (const id of ['LB115B00000005', 'LA115A00000006', 'CH115D00000007']) {
    const cells = [...setup(id).html.matchAll(/<td data-th="租金級距">([\s\S]*?)<\/td>/g)];
    assert.equal(cells.length, 3);
    cells.forEach(cell => assert.doesNotMatch(cell[1], /<i |fa-circle|超標|注意/));
    if (id === 'LA115A00000006') assert.equal(cells[0][1] + cells[2][1], '');
  }
});

test('查調中案例操作留白、可篩選且直接網址無法開啟明細或累計檢視', () => {
  const { node, model } = setup('', false, true);
  const record = model.cases[9];
  assert.equal(model.ready(record), true);
  assert.equal(model.canView(record), false);
  assert.equal(model.assessment(record), null);
  node('enquiryStage').value = 'querying';
  node('enquiryFilter').handlers.submit({ preventDefault() {} });
  const row = node('enquiryCaseList').innerHTML;
  assert.match(row, /LH115H00000010/);
  assert.doesNotMatch(row, /href="enquiry-detail.html/);
  assert.match(row, /<td data-th="操作"><\/td>/);
  assert.doesNotMatch(row, /尚未開放|disabled/);
  assert.doesNotMatch(row, /fa-spinner|rules-spin/);
  assert.equal((row.match(/class="rules-result-cell rules-result-cell--loading" aria-label="[^"]+"><\/td>/g) || []).length, 6);
  for (const supplemented of [false, true]) {
    const detail = setup('LH115H00000010', supplemented, false, 'INQ-003');
    assert.match(detail.html, /查調中，暫不開放明細/);
    assert.doesNotMatch(detail.html, /id="(?:caseInfo|familyInfo|incomeInfo)"|身分證字號/);
    assert.equal(detail.node('viewHistoryCount').textContent, '');
  }
});

test('三代稱謂相對戶長，配偶同戶與分戶的名單一致', () => {
  const { model } = setup();
  const same = model.cases[0];
  assert.equal(same.households.length, 1);
  assert.deepEqual(Array.from(same.households[0].members, p => p.title), ['戶長', '長子', '長孫女', '長媳', '長孫', '寄居', '寄居']);
  const separate = model.cases[2];
  assert.equal(separate.households.length, 2);
  assert.deepEqual(Array.from(separate.households[0].members, p => p.title), ['戶長', '長子', '長孫女', '寄居', '寄居']);
  assert.equal(separate.households[1].members[0].title, '戶長');
  for (const record of model.cases.filter(c => c.separate)) {
    const son = model.people(record).find(p => p.name === '張曉晨');
    assert.equal(record.households[0].members.some(p => p.key === son.key), false);
    assert.equal(record.households[1].members.some(p => p.key === son.key), true);
    assert.equal(son.title, '長子');
    assert.equal(model.relationship(record, son.key), '兒子');
    assert.equal(model.requiredKeys(record).includes(son.key), true);
    assert.equal(model.ready(record, model.requiredKeys(record).filter(key => key !== son.key)), false);
    assert.equal(model.population(record, model.requiredKeys(record)).memberCount, 5);
  }
  assert.deepEqual(Array.from(model.missing(model.cases[0]), p => p.name), ['張曉雯']);
  assert.deepEqual(Array.from(model.missing(model.cases[3]), p => p.name).sort(), ['劉欣慧', '張大富']);
});

test('歷次查調保留補齊前後名單，歷史版本及不存在批次正確顯示', () => {
  const historical = setup('CH115F00000003', true, false, 'INQ-003');
  assert.match(historical.node('enquiryVersionInfo').innerHTML, /歷史版本/);
  assert.doesNotMatch(historical.html, /id="incomeInfo"/);
  assert.match(historical.html, /尚未查調/);
  const current = setup('CH115F00000003', true, false, 'INQ-004');
  assert.match(current.node('enquiryVersionInfo').innerHTML, /目前採用版本/);
  assert.match(current.html, /id="incomeInfo"/);
  const invalid = setup('CH115F00000003', false, false, 'INVALID');
  assert.match(invalid.html, /此批次不存在或已超過保存期限/);
  assert.doesNotMatch(invalid.html, /id="incomeInfo"/);
  assert.equal(historical.context.EnquiryRuleHistory.available(historical.model.cases[2], false, new Date('2027-05-19T00:00:00+08:00')).length, 0);
});

test('檢視次數本機累加並包含批次，無儲存權限時可正常顯示', () => {
  const { model, context } = setup();
  const store = new Map();
  const storage = { getItem: key => store.get(key), setItem: (key, value) => store.set(key, value) };
  const history = context.EnquiryRuleHistory;
  const first = history.trackView(model.cases[0], 'INQ-003', storage);
  assert.equal(first.count, 4);
  assert.equal(first.persisted, true);
  const next = history.trackView(model.cases[0], 'INQ-001', storage);
  assert.equal(next.count, 5);
  assert.equal(next.visits[0].batchId, 'INQ-001');
  const blocked = history.trackView(model.cases[0], 'INQ-003', { getItem() { throw Error(); }, setItem() { throw Error(); } });
  assert.equal(blocked.count, 4);
  assert.equal(blocked.persisted, false);
});

test('無效案件有可返回的錯誤訊息', () => {
  const { html } = setup('INVALID');
  assert.match(html, /查無此案件情境/);
  assert.doesNotMatch(html, /id="incomeInfo"/);
});

test('頁面相對資源均存在', () => {
  for (const name of ['enquiry-hub.html', 'enquiry-detail.html']) {
    const fullPath = path.join(root, 'backend', name);
    const html = fs.readFileSync(fullPath, 'utf8');
    for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      const target = match[1];
      if (target.startsWith('#') || target.startsWith('.js-') || /^https?:/.test(target)) continue;
      assert.ok(fs.existsSync(path.resolve(path.dirname(fullPath), target.split(/[?#]/)[0])), `${name}: ${target}`);
    }
  }
});

function housingCase(model, holdings) {
  const record = JSON.parse(JSON.stringify(model.cases[4]));
  model.people(record).forEach(person => { person.properties = []; });
  holdings.forEach(({ owner = '張忠政', ...property }) => {
    model.people(record).find(person => person.name === owner).properties.push({
      type: '房屋', propertyId: 'F-HOUSE-1', cityCode: 'F', isResidential: true,
      shareNumerator: 1, shareDenominator: 4, totalArea: 80, household: false,
      location: '新北市／同一住宅', ...property
    });
  });
  return record;
}

test('明細註記不顯示代碼，關係為本人，社福來源包含戶政司', () => {
  const { html } = setup('LA115A00000006');
  const family = html.match(/<section class="item" id="familyInfo"[\s\S]*?<\/section>/)[0];
  assert.doesNotMatch(family, /代碼：|2003900001|2004900001|申請人本人/);
  assert.match(family, /民國95年5月20日與陳美玲結婚/);
  assert.match(family, /data-th="與申請人關係">本人<\/td>/);
  assert.match(html, /社福資格（衛福部、戶政司）/);
});

test('自有住宅先依公告縣市篩選，排除土地與非住宅，不以申請人戶籍縣市替代範圍', () => {
  const { model } = setup();
  const result = holdings => model.selfOwnedHousing(housingCase(model, holdings));
  assert.equal(result([{ cityCode: 'E', shareNumerator: 1, shareDenominator: 1, household: true }]).pass, true);
  assert.equal(result([{ type: '土地', household: true }]).pass, true);
  assert.equal(result([{ isResidential: false, household: true }]).pass, true);
  const record = housingCase(model, [{ shareNumerator: 1, shareDenominator: 1 }]);
  model.people(record).find(person => person.key === record.applicant).registration.cityCode = 'E';
  assert.equal(model.selfOwnedHousing(record).pass, false);
  model.parameters.selfOwnedHousing.cityCodes = ['E'];
  assert.equal(model.selfOwnedHousing(record).pass, true);
});

test('個別共有面積須大於40㎡，完全持有或戶籍設於住宅亦各自構成持有', () => {
  const { model } = setup();
  const result = property => model.selfOwnedHousing(housingCase(model, [property]));
  assert.equal(result({ totalArea: 159.6 }).checks[2].met, false);
  assert.equal(result({ totalArea: 160 }).checks[2].met, false);
  assert.equal(result({ totalArea: 160.4 }).checks[2].met, true);
  assert.equal(result({ totalArea: 1, shareNumerator: 1, shareDenominator: 1 }).pass, false);
  assert.equal(result({ totalArea: 1, household: true }).pass, false);
});

test('同一共有住宅跨家庭成員合計：面積40㎡含邊界，持分合計1亦構成持有', () => {
  const { model } = setup();
  const result = holdings => model.selfOwnedHousing(housingCase(model, holdings));
  assert.equal(result([{ totalArea: 79.8 }, { owner: '張大富', totalArea: 79.8 }]).checks[4].met, false);
  const atForty = result([{}, { owner: '張大富' }]);
  assert.equal(atForty.pass, false);
  assert.ok(atForty.matches.some(match => match.rules.includes('家庭成員換算面積合計達 40㎡')));
  const full = result([{ totalArea: 10, shareDenominator: 2 }, { owner: '張大富', totalArea: 10, shareDenominator: 2 }]);
  assert.equal(full.pass, false);
  assert.ok(full.matches.some(match => match.rules.includes('家庭成員持分合計為 1')));
  assert.equal(result([{}, { owner: '張大富', propertyId: 'OTHER-HOUSE' }]).checks[4].met, false);
  assert.equal(result([{}, { owner: '張大富', cityCode: 'E' }]).checks[4].met, false);
  assert.equal(result([{}, {}]).checks[4].met, false, '同一人重複回傳的持分不可累加');
  assert.equal(result([{}, { owner: '陳OO' }]).checks[4].met, false, '未列為家庭成員的寄居者不併入');
});

test('未完成或資料不齊不推定無住宅，無財產及可確認的無持有才顯示符合', () => {
  const { model } = setup();
  assert.equal(model.selfOwnedHousing(model.cases[0]), null);
  assert.equal(model.selfOwnedHousing(model.cases[9]), null);
  assert.equal(model.selfOwnedHousing(housingCase(model, [])).pass, true);
  assert.equal(model.selfOwnedHousing(housingCase(model, [{ totalArea: undefined }])).pass, false, '已確認在公告範圍有住宅，面積缺值不改變第一項命中結果');
  assert.equal(model.selfOwnedHousing(housingCase(model, [{ cityCode: undefined }])).pass, null);
  model.parameters.selfOwnedHousing.cityCodes = [];
  assert.equal(model.selfOwnedHousing(housingCase(model, [])).pass, null);
});

test('原住民保留地及道路用地不計入不動產金額、初判與住宅判斷', () => {
  const { model } = setup();
  for (const landUse of ['原住民保留地', '道路用地']) {
    const record = housingCase(model, [{ landUse, value: 9000000, shareDenominator: 1, household: true }]);
    assert.equal(model.totals(record).property, 0);
    assert.equal(model.assessment(record)[2].pass, true);
    const result = model.selfOwnedHousing(record);
    assert.equal(result.pass, true);
    assert.ok(result.checks.every(check => check.met === false));
    model.people(record).find(person => person.name === '張忠政').properties[0].landUse = '一般用地';
    assert.equal(model.totals(record).property, 9000000);
    assert.equal(model.assessment(record)[2].pass, false);
    assert.equal(model.selfOwnedHousing(record).pass, false);
  }
  const mixed = housingCase(model, [{ value: 100 }, { owner: '張大富', value: 9000000, landUse: '道路用地' }]);
  assert.equal(model.totals(mixed).property, 100);
  assert.equal(model.selfOwnedHousing(mixed).checks[4].met, false, '排除的持分與面積不併入家庭共有');
  assert.equal(model.selfOwnedHousing(mixed).pass, false, '未排除的住宅仍命中第一項');
});

test('排除財產仍可查看原金額，明細標示不納入計算且列表初判同步扣除', () => {
  const { html, model } = setup('CH115D00000007');
  const section = html.match(/<section class="item" id="propertyInfo"[\s\S]*?<\/section>/)[0];
  assert.match(section, /180,000 元/);
  assert.match(section, /320,000 元/);
  assert.equal((section.match(/<small class="rules-empty ms-2">不納入計算<\/small>/g) || []).length, 2);
  assert.match(section, /納入計算不動產總額<strong>0 元<\/strong>/);
  const list = setup('', false, true).html;
  assert.equal(model.assessment(model.cases[6])[2].value, 0);
  assert.match(list, /不動產價值：0 元，未超標/);
});

test('不動產明細顯示獨立的無持有自有住宅結果，含個人與家庭40㎡邊界情境', () => {
  const expected = { 'LB115B00000005': true, 'LA115A00000006': false, 'CH115D00000007': true, 'LE115E00000008': false, 'LF115F00000009': false, 'CH115F00000011': false };
  for (const [id, pass] of Object.entries(expected)) {
    const { html, model } = setup(id);
    const result = model.selfOwnedHousing(model.cases.find(record => record.id === id));
    assert.equal(result.pass, pass, id);
    const block = html.match(/<div class="rules-housing-summary mb-4" id="selfOwnedHousingResult">[\s\S]*?<\/dl><\/div>/)[0];
    assert.match(block, /無持有自有住宅/);
    assert.match(block, /aria-label="查看公告範圍縣市"/);
    assert.match(block, /<li>臺北市<\/li><li>新北市<\/li>/);
    assert.ok(block.includes(pass ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation'));
    assert.ok(block.indexOf('無持有自有住宅：</strong>') < block.indexOf('rules-housing-verdict'));
  }
});

test('結果優先顯示、五項規則完整保留名稱並以卡片標示是或否，下方為財產明細', () => {
  const labels = [
    '於公告範圍縣市有自有住宅',
    '完全持有住宅(持分為1)',
    '個別持有共有住宅面積>40㎡',
    '戶籍設於持有住宅地址',
    '多名家庭成員持有同一共有住宅:持分合計為1(完全持有)或換算面積≥40㎡'
  ];
  const expected = {
    'LB115B00000005': [false, false, false, false, false],
    'LA115A00000006': [true, true, false, true, false],
    'LE115E00000008': [true, false, false, false, true],
    'LF115F00000009': [true, false, false, false, false],
    'CH115F00000011': [true, false, true, false, false]
  };
  for (const [id, flags] of Object.entries(expected)) {
    const { html, model } = setup(id);
    const result = model.selfOwnedHousing(model.cases.find(record => record.id === id));
    assert.deepEqual(Array.from(result.checks, check => check.met), flags);
    assert.deepEqual(Array.from(result.checks, check => check.label), labels);
    const summary = html.match(/<div class="rules-housing-summary mb-4" id="selfOwnedHousingResult">[\s\S]*?<\/dl><\/div>/)[0];
    const answers = [...summary.matchAll(/<dd class="rules-housing-answer[^"]*">(是|否)<\/dd>/g)].map(match => match[1]);
    assert.deepEqual(answers, flags.map(flag => flag ? '是' : '否'));
    const highlighted = [...summary.matchAll(/class="rules-housing-check( is-hit)?" data-housing-check="\d"/g)].map(match => Boolean(match[1]));
    assert.deepEqual(highlighted, flags, '包含第一項在內，符合的條件均標紅');
    const shownLabels = [...summary.matchAll(/<span class="rules-housing-label">(.*?)<\/span>/g)].map(match => match[1].replaceAll('&gt;', '>'));
    assert.deepEqual(shownLabels, labels, '畫面完整顯示使用者提供的名稱');
    assert.equal(result.pass, !flags.some(Boolean), '五項條件任一為是即不符合無自有住宅');
    assert.ok(summary.indexOf('rules-housing-conclusion') < summary.indexOf('持有住宅五項判斷規則'));
    assert.equal((summary.match(/data-housing-check=/g) || []).length, 5);
    assert.match(summary, /<details class="rules-housing-scope">/);
    assert.doesNotMatch(summary, /公告範圍縣市：/);
    assert.doesNotMatch(html, />不動產明細<\/h3>/);
    if (id !== 'LB115B00000005') assert.ok(html.indexOf('rules-housing-checks') < html.indexOf('rules-property-table'));
  }
  const { model } = setup();
  const pending = model.selfOwnedHousing(housingCase(model, [{ cityCode: undefined }]));
  assert.equal(pending.pass, null);
  assert.ok(pending.checks.every(check => check.met === null), '無法判斷時不以否代替');
});

test('戶籍設於持有住宅地址即有自有住宅，不需同時滿足完全持有或面積門檻', () => {
  const { model } = setup();
  const record = housingCase(model, [{ household: true, totalArea: 1 }]);
  const result = model.selfOwnedHousing(record);
  assert.equal(result.pass, false);
  assert.deepEqual(Array.from(result.checks, check => check.met), [true, false, false, true, false]);
  model.people(record).find(person => person.key === record.applicant).properties[0].household = false;
  assert.equal(model.selfOwnedHousing(record).pass, false, '戶籍條件改為否，公告範圍有住宅仍判定持有');
});

test('列表新增無自有住宅置於不動產價值左邊，與各案明細結果一致', () => {
  const { html, model } = setup('', false, true);
  const headings = [...html.matchAll(/<th scope="col">([^<]+)<\/th>/g)].map(match => match[1]);
  assert.deepEqual(headings, ['總所得', '每人每月平均所得', '無自有住宅', '不動產價值', '動產價值', '租金級距']);
  for (const record of model.cases) {
    const row = html.match(new RegExp(`<tr data-case-id="${record.id}">[\\s\\S]*?<\\/tr>`))[0];
    const cell = row.match(/<td data-th="無自有住宅"[^>]*>([\s\S]*?)<\/td>/)[1];
    const result = model.selfOwnedHousing(record);
    if (!result) assert.equal(cell, '');
    else assert.ok(cell.includes(result.pass ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation'));
    assert.doesNotMatch(cell, /[\d,]+ 元/);
  }
});

function pageRows(node) {
  return [...node('enquiryCaseList').innerHTML.matchAll(/<tr data-case-id="([^"]+)"/g)].map(match => match[1]);
}
function clickPage(node, number) {
  node('enquiryPagination').handlers.click({ preventDefault() {}, target: { closest() { return { dataset: { page: String(number) } }; } } });
}
function addPageCases(model, count) {
  const template = JSON.parse(JSON.stringify(model.cases[4]));
  for (let index = 0; index < count; index++) model.cases.push({ ...template, id: `LB115B${String(index + 12).padStart(8, '0')}` });
}

test('分頁預設20筆，切換10筆可瀏覽第二頁並限制無效頁碼', () => {
  const { node } = setup('', false, true);
  assert.equal(node('enquiryPageSize').value, '20');
  assert.equal(pageRows(node).length, 11);
  assert.equal(node('enquiryPageNumber').disabled, true);
  assert.match(node('enquiryPagination').innerHTML, /aria-disabled="true"[^>]*aria-label="下一頁"/);
  node('enquiryPageSize').value = '10';
  node('enquiryPageSize').handlers.change();
  const first = pageRows(node);
  assert.equal(first.length, 10);
  clickPage(node, 2);
  assert.deepEqual(pageRows(node), ['CH115F00000011']);
  assert.match(node('enquirySummary').textContent, /第 11–11 筆.*第 2／2 頁/);
  assert.match(node('enquiryPagination').innerHTML, /aria-current="page" aria-label="第 2 頁"/);
  for (const invalid of [0, -1, 3, 1.5, NaN]) {
    node('enquiryPageNumber').value = String(invalid);
    node('enquiryPageJump').handlers.submit({ preventDefault() {} });
    assert.deepEqual(pageRows(node), ['CH115F00000011']);
  }
  clickPage(node, 1);
  assert.deepEqual(pageRows(node), first);
});

test('多頁可跳頁與切換筆數，匯出維持全部篩選結果，查詢與重設回第一頁', async () => {
  const { model, node, context } = setup('', false, true);
  addPageCases(model, 45);
  node('enquiryFilter').handlers.reset({ preventDefault() {} });
  assert.equal(pageRows(node).length, 20);
  assert.equal(node('enquiryPageNumber').max, '3');
  node('enquiryPageNumber').value = '3';
  node('enquiryPageJump').handlers.submit({ preventDefault() {} });
  assert.equal(pageRows(node).length, 16);
  assert.match(node('enquirySummary').textContent, /第 41–56 筆/);
  node('enquiryKeyword').value = '尚未送出的篩選';
  node('enquiryPageSize').value = '50';
  node('enquiryPageSize').handlers.change();
  assert.equal(pageRows(node).length, 50, '換頁或換筆數不套用尚未送出的條件');
  let exported;
  context.EnquiryRuleExport = { async download(records) { exported = Array.from(records, record => record.id); } };
  await node('enquiryExport').handlers.click();
  assert.equal(exported.length, 56, '匯出包含所有頁面');
  node('enquiryPageSize').value = '20';
  node('enquiryPageSize').handlers.change();
  clickPage(node, 3);
  node('enquiryKeyword').value = 'LB115B00000056';
  node('enquiryFilter').handlers.submit({ preventDefault() {} });
  assert.deepEqual(pageRows(node), ['LB115B00000056']);
  assert.equal(node('enquiryPageNumber').value, '1');
  node('enquiryKeyword').value = '無符合案件';
  node('enquiryFilter').handlers.submit({ preventDefault() {} });
  assert.deepEqual(pageRows(node), []);
  assert.equal(node('enquiryPageGo').disabled, true);
  assert.equal(node('enquiryExport').disabled, true);
  node('enquiryFilter').handlers.reset({ preventDefault() {} });
  assert.equal(pageRows(node).length, 20);
  assert.equal(node('enquiryPageNumber').value, '1');
});

test('多頁頁碼保留首末頁、目前頁與省略號，成員狀態同步改為成員未完備', () => {
  const { model, node } = setup('', false, true);
  addPageCases(model, 210);
  node('enquiryFilter').handlers.reset({ preventDefault() {} });
  clickPage(node, 7);
  const pager = node('enquiryPagination').innerHTML;
  assert.equal((pager.match(/…/g) || []).length, 2);
  assert.match(pager, /aria-current="page" aria-label="第 7 頁"/);
  assert.match(pager, /aria-label="第 1 頁"/);
  assert.match(pager, /aria-label="第 12 頁"/);
  const detail = setup('CH115F00000003');
  assert.equal(detail.model.status(detail.model.cases[2]), '成員未完備');
  assert.match(detail.node('detailStatus').innerHTML, /成員未完備/);
  assert.match(detail.node('enquiryHistoryBody').innerHTML, /成員未完備/);
  assert.doesNotMatch(detail.html + detail.node('enquiryHistoryBody').innerHTML, /待補齊成員/);
});
