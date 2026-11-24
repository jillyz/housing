/* 查調規則互動原型：所有案件、人員與金額均為虛構資料，未連接查調服務。 */
(() => {
  const parameters = { interestRate: 0.015, movableLimit: 4710000 };
  const note = (type, code, text) => ({ type, code, text });
  const marriage = name => note('結婚登記', '2003900001', `民國100年6月18日與${name}結婚（民國100年6月18日申登）。`);
  const divorce = name => note('離婚登記', '2004900001', `民國98年3月20日與${name}兩願離婚（民國98年3月20日申登）。`);
  // 固定模擬字號：同一人跨情境使用同一字號，依健保署檢核規則計算末碼。
  const identityProfiles = {
    '張忠政': ['B', 1, '0001001'], '劉欣慧': ['A', 2, '0001002'],
    '張大富': ['E', 1, '0001003'], '張曉雯': ['B', 2, '0001004'],
    '張曉晨': ['B', 1, '0001005'], '陳OO': ['N', 1, '0001006'], '廖OO': ['N', 2, '0001007']
  };
  function demoId(name) {
    const [letter, gender, serial] = identityProfiles[name];
    const region = 'ABCDEFGHJKLMNPQRSTUVXYWZIO'.indexOf(letter) + 10;
    const prefix = `${gender}${serial}`;
    const digits = `${region}${prefix}`;
    const weights = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    const sum = [...digits].reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
    return `${letter}${prefix}${(10 - sum % 10) % 10}`;
  }
  const person = (key, name, title, options = {}) => ({
    key, name, title, idNumber: demoId(name),
    birth: '1980/02/05', father: '未登載', mother: '未登載', adoptiveFather: '', adoptiveMother: '',
    generation: 2, caseRequired: true, fetus: 0, notes: [], welfare: [], income: 0, interest: 0, securities: 0, prizeIncome: 0, oneTimeIncome: 0, properties: [], ...options
  });
  const agencyCodes = { '國家住都中心': 'CH', '新北市政府': 'LF', '臺北市政府': 'LA', '桃園市政府': 'LH', '臺中市政府': 'LB', '臺南市政府': 'LD', '高雄市政府': 'LE', '臺東縣政府': 'LV' };
  const home = (label, members) => ({ label, members });
  // 全案共用五人家庭；寄居者保留於戶政名單，不自動列為案件成員。
  function familyCase(number, options = {}) {
    const key = number * 10;
    const agency = options.agency || '國家住都中心';
    const agencyCode = agencyCodes[agency];
    const caseYear = '115';
    const cityCode = options.cityCode;
    const sequence = String(number).padStart(8, '0');
    const separate = options.separate === true;
    const applicant = person(key + 1, '張忠政', '長子', { spouseName: '劉欣慧', adoptiveFather: '張大富', mother: '張陳梅', income: 600000, interest: 1500, notes: [marriage('劉欣慧')], welfare: ['中低收入戶', '平地原住民', '育有未成年子女'], minorChildren: ['張曉雯', '張曉晨'] });
    const spouse = person(key + 2, '劉欣慧', separate ? '戶長' : '長媳', { birth: '1989/05/07', father: '劉志成', mother: '林秀芬', fetus: 1, income: 360000, interest: 1200, notes: [marriage('張忠政')] });
    const elder = person(key + 3, '張大富', '戶長', { generation: 1, birth: '1951/09/10', father: '張勇', mother: '張鄭平', welfare: ['65歲以上老人', '身心障礙（輕度）'], notes: [note('輔助宣告', '', '經法院裁定受輔助宣告，選定張忠政為張大富之輔助人。')] });
    const daughter = person(key + 4, '張曉雯', '長孫女', { generation: 3, birth: '2012/12/23', father: '張忠政', mother: '劉欣慧' });
    const son = person(key + 5, '張曉晨', separate ? '長子' : '長孫', { generation: 3, birth: '2014/12/23', father: '張忠政', mother: '劉欣慧' });
    const lodgers = [
      person(key + 6, '陳OO', '寄居', { generation: 0, caseRequired: false, birth: '2013/11/12', father: '陳OO', mother: '莊OO' }),
      person(key + 7, '廖OO', '寄居', { generation: 0, caseRequired: false, birth: '2018/04/06', father: '廖OO', mother: '賴OO' })
    ];
    // 房屋與土地範例沿用 backend2 主案的回傳內容與欄位，不再省略面積及共有資訊。
    applicant.properties = [{ type: '房屋', location: '新北市／三重段／00123-000', household: true, share: '5 分之 2', area: '36 平方公尺', value: 1200000, common: true, landUse: '一般用地' }];
    spouse.properties = [{ type: '土地', location: '南投縣／南投段／0427-0013', household: false, share: '100 分之 5', area: '18.5 平方公尺', value: 320000, common: false, landUse: '原住民保留地' }];
    const members = [elder, applicant, daughter, ...(separate ? [] : [spouse, son]), ...lodgers];
    return {
      id: `${agencyCode}${caseYear}${cityCode}${sequence}`, agencyCode, caseYear, cityCode, sequence, applicant: applicant.key, spouse: spouse.key, marriage: '有偶',
      agency: '國家住都中心', housing: '世大運選手村D區', scenario: '', description: '',
      applicationDate: '2026-11-18', housingDistrict: ({ 1: '大同區', 2: '新店區', 3: '新店區', 4: '桃園區', 5: '北屯區', 6: '松山區', 7: '安南區', 8: '苓雅區', 9: '三重區', 10: '桃園區', 11: '新店區' })[number],
      declared: [elder.key, applicant.key, daughter.key, spouse.key, son.key],
      familyMemberKeys: [elder.key, applicant.key, daughter.key, spouse.key, son.key],
      caseMembers: [elder, applicant, daughter, spouse, son],
      relationships: { [elder.key]: '養父', [applicant.key]: '申請人本人', [spouse.key]: '配偶', [daughter.key]: '女兒', [son.key]: '兒子' },
      households: [home('申請人戶籍（三代家庭）', members), ...(separate ? [home('申請人配偶戶籍（分戶）', [spouse, son])] : [])],
      ...options
    };
  }
  const cases = [
    familyCase(1, { cityCode: 'A', scenario: '三代同戶・漏列長孫女', description: '張大富、張忠政、劉欣慧及張曉晨已填入；長孫女張曉雯尚未填列。', declared: [13, 11, 12, 15], agency: '臺北市政府', housing: '明倫社會住宅' }),
    familyCase(2, { cityCode: 'F', scenario: '配偶姓名未比對到案件成員・配偶分戶', description: '申請人有偶，配偶姓名為劉欣慧；案件成員未比對到配偶，另查配偶戶。張曉晨在配偶戶且已填列。', separate: true, declared: [23, 21, 24, 25], agency: '新北市政府', housing: '中央新村社會住宅' }),
    familyCase(3, { cityCode: 'F', scenario: '三代分戶・漏列申請人配偶', description: '申請人戶內家庭成員均已填入；分戶配偶劉欣慧仍須補入案件。', separate: true, declared: [33, 31, 34, 35], housing: '新店央北社會住宅' }),
    familyCase(4, { cityCode: 'H', scenario: '三代分戶・漏列長輩及配偶', description: '已填申請人張忠政及兩名子女；同戶長輩張大富及分戶配偶劉欣慧都尚未填列。', separate: true, declared: [41, 44, 45], agency: '桃園市政府', housing: '中路二號社會住宅' }),
    familyCase(5, { cityCode: 'B', scenario: '三代同戶・齊全且無財產', description: '五位家庭成員皆齊全，寄居者僅列於戶政名單；保留家庭社福資格，查調無財產紀錄。', agency: '臺中市政府', housing: '北屯好宅' }),
    familyCase(6, { cityCode: 'A', scenario: '三代同戶・多筆記事及超標', description: '五位家庭成員皆齊全；展示多筆結婚、離婚記事及所得、財產超標，租金級距留白。', agency: '臺北市政府', housing: '健康社會住宅' }),
    familyCase(7, { cityCode: 'D', scenario: '三代分戶・社福及財產', description: '五位家庭成員皆已填列，配偶劉欣慧分戶且有 1 名胎兒，展示社福資格及財產紀錄。', separate: true, housing: '臺南和順安居' }),
    familyCase(8, { cityCode: 'E', scenario: '三代同戶・養父及輔助宣告', description: '張大富為張忠政養父；張忠政註記有養父母，張大富受輔助宣告並由張忠政擔任輔助人。', agency: '高雄市政府', housing: '凱旋青樹社會住宅' }),
    familyCase(9, { cityCode: 'F', scenario: '三代同戶・長輩有偶', description: '五位家庭成員皆已填列；張大富有偶，其分戶配偶不延伸查調，配偶核對僅限申請人張忠政。', agency: '新北市政府', housing: '三重社會住宅' }),
    familyCase(10, { cityCode: 'H', scenario: '三代同戶・完整查調中', description: '五位家庭成員已齊全，正在等待完整資料回傳；暫不開放案件明細。', querying: true, agency: '桃園市政府', housing: '桃園示範社宅' }),
    familyCase(11, { cityCode: 'F', scenario: '案件成員不在申請人戶及配偶戶', description: '張曉雯已列案件成員，設籍於外祖父戶，不在申請人戶或配偶戶，另列於其他案件成員。配偶劉欣慧與兒子張曉晨同戶。', separate: true, housing: '新店央北社會住宅' })
  ];
  const people = record => {
    const keys = new Set();
    return [...record.households.flatMap(h => h.members), ...(record.caseMembers || [])].filter(p => {
      if (keys.has(p.key)) return false;
      keys.add(p.key);
      return true;
    });
  };
  const find = (number, key) => people(cases[number - 1]).find(p => p.key === key);
  Object.assign(find(5, 51), { income: 300000, interest: 0, properties: [] });
  Object.assign(find(5, 52), { income: 180000, interest: 0, properties: [] });
  Object.assign(find(6, 61), { income: 4320000, interest: 75000, securities: 180000, prizeIncome: 200000, oneTimeIncome: 100000, notes: [note('結婚登記', '2003900001', '民國95年5月20日與陳美玲結婚（民國95年5月20日申登）。'), divorce('陳美玲'), note('結婚登記', '2003900001', '民國100年6月18日與劉欣慧結婚（民國100年6月18日申登）。')], properties: [{ type: '房屋', location: '臺北市／○○段／01234-000（○○路 100 號）', household: true, share: '1 分之 1', area: '95.6 平方公尺', value: 7500000, common: false, landUse: '一般用地' }] });
  Object.assign(find(6, 62), { income: 480000, interest: 2400, notes: [note('結婚登記', '2003900001', '民國100年6月18日與張忠政結婚（民國100年6月18日申登）。')] });
  Object.assign(find(7, 71), { income: 120000, interest: 750, prizeIncome: 12000, oneTimeIncome: 8000, properties: [{ type: '土地', location: '臺南市／安南區○○段／0123 地號', household: false, share: '6 分之 1', area: '30 平方公尺', value: 180000, common: true, landUse: '道路用地' }] });
  Object.assign(find(7, 72), { income: 96000, interest: 900, securities: 20000, welfare: ['中低收入戶'] });
  Object.assign(find(8, 81), { father: '未登載', adoptiveFather: '張大富' });
  cases[7].relationships[83] = '養父';
  Object.assign(find(9, 93), { marriage: '有偶', spouseName: '張陳梅' });
  find(9, 93).notes.push(note('結婚登記', '2003900001', '民國65年6月18日與張陳梅結婚（民國65年6月18日申登）。'));
  const outsideCase = cases[10];
  outsideCase.households[0].members = outsideCase.households[0].members.filter(p => p.key !== 114);
  Object.assign(find(11, 114), { title: '外孫女', interest: 600 });
  // 設籍範例涵蓋同縣市同區、不同縣市、不同區、未滿一年與剛滿一年。
  cases.forEach((record, index) => {
    people(record).forEach(p => {
      p.registration = { cityCode: record.cityCode, district: record.housingDistrict, movedInDate: '2024-06-01' };
    });
    const applicant = people(record).find(p => p.key === record.applicant);
    if (index === 4) applicant.registration.district = '西屯區';
    if (index === 5) applicant.registration = { cityCode: 'F', district: '新店區', movedInDate: '2024-06-01' };
    if (index === 6) applicant.registration.movedInDate = '2026-05-01';
    if (index === 7) applicant.registration.movedInDate = '2025-11-18';
  });
  cases.forEach(record => { record.authorizations = record.declared.map(key => ({ key, consent: true })); });
  function spouseCheck(record, declared = record.declared) {
    if (record.marriage !== '有偶') return null;
    const applicant = people(record).find(p => p.key === record.applicant);
    const name = (applicant?.spouseName || '').trim();
    const person = people(record).find(p => p.name.trim() === name);
    const member = people(record).find(p => declared.includes(p.key) && p.name.trim() === name);
    const applicantHome = record.households.find(h => h.members.some(p => p.key === record.applicant));
    return { name, person, member, separate: !member || !applicantHome?.members.some(p => p.name.trim() === name) };
  }
  // 僅延伸申請人配偶，不追查其他家庭成員的分戶配偶或配偶的整戶親屬。
  const requiredKeys = record => [...new Set([
    ...record.households.filter(h => h.members.some(p => p.key === record.applicant)).flatMap(h => h.members.filter(p => p.caseRequired !== false).map(p => p.key)),
    ...(record.familyMemberKeys || []),
    ...(record.marriage === '有偶' && record.spouse ? [record.spouse] : [])
  ])];
  const missing = (record, declared = record.declared) => {
    const spouse = spouseCheck(record, declared);
    const members = people(record).filter(p => requiredKeys(record).includes(p.key) && p.key !== spouse?.person?.key && !declared.includes(p.key));
    if (spouse?.name && !spouse.member) members.push(spouse.person || { name: spouse.name });
    return members;
  };
  const ready = (record, declared = record.declared) => missing(record, declared).length === 0 && (record.marriage !== '有偶' || Boolean(spouseCheck(record, declared)?.member));
  const canView = record => !record.querying;
  const status = (record, declared = record.declared) => record.querying ? '查調中' : ready(record, declared) ? '查調完成' : '待補齊成員';
  // 與申請人關係取自案件填列資料；未列入案件時不以戶籍稱謂推定。
  const relationship = (record, key, declared = record.declared) => declared.includes(key) ? record.relationships?.[key] || '未填列' : '未填列';
  const population = (record, declared = record.declared) => {
    const keys = new Set(declared);
    const members = [...new Map(people(record).filter(p => keys.has(p.key)).map(p => [p.key, p])).values()];
    const fetusCount = members.reduce((sum, p) => sum + (Number.isInteger(p.fetus) && p.fetus > 0 ? p.fetus : 0), 0);
    return { memberCount: members.length, fetusCount, total: members.length + fetusCount };
  };
  // 未填列者只提供姓名、戶籍稱謂及填列狀態；已列案件成員可檢視完整戶政資料。
  const householdView = (record, declared = record.declared) => record.households.map(h => ({ label: h.label, members: h.members.map(p => ({ ...(declared.includes(p.key) ? p : { key: p.key, name: p.name, title: p.title }), relation: relationship(record, p.key, declared) })) }));
  const otherCaseMembers = (record, declared = record.declared) => {
    const householdKeys = new Set(record.households.flatMap(h => h.members.map(p => p.key)));
    return people(record).filter(p => declared.includes(p.key) && !householdKeys.has(p.key)).map(p => ({ ...p, relation: relationship(record, p.key, declared) }));
  };
  function movable(person) {
    if (!Number.isFinite(parameters.interestRate) || parameters.interestRate <= 0) throw new RangeError('利率參數須為大於 0 的數值');
    const deposit = Math.round(person.interest / parameters.interestRate);
    return { deposit, total: deposit + person.securities + person.prizeIncome + person.oneTimeIncome };
  }
  const totals = record => people(record).filter(p => requiredKeys(record).includes(p.key)).reduce((sum, p) => ({ income: sum.income + p.income, property: sum.property + p.properties.reduce((v, a) => v + a.value, 0), movable: sum.movable + movable(p).total }), { income: 0, property: 0, movable: 0 });
  // 沿用 backend2 參考頁門檻作為模擬，不代表正式審查標準。
  const columns = [
    { key: 'totalIncome', label: '總所得', limit: 1450000, inclusive: false },
    { key: 'monthlyIncome', label: '每人每月平均所得', limit: 62125, inclusive: true },
    { key: 'propertyValue', label: '不動產價值', limit: 7080000, inclusive: false },
    { key: 'movableValue', label: '動產價值', get limit() { return parameters.movableLimit; }, inclusive: false },
    { key: 'rentTier', label: '租金級距' }
  ];
  function assessment(record, declared = record.declared) {
    if (record.querying || !ready(record, declared)) return null;
    const sum = totals(record);
    const monthly = Math.round(sum.income / 12 / population(record, requiredKeys(record)).total);
    const lowIncome = people(record).filter(p => requiredKeys(record).includes(p.key)).some(p => p.welfare.some(w => /^(?:低收入戶|中低收入戶)$/.test(w)));
    const tier = monthly > 62125 ? null : lowIncome ? 1 : monthly <= 26624 ? 2 : 3;
    const values = { totalIncome: sum.income, monthlyIncome: monthly, propertyValue: sum.property, movableValue: sum.movable, rentTier: tier };
    return columns.map(column => ({ ...column, value: values[column.key], pass: column.key === 'rentTier' ? tier !== null : column.inclusive ? values[column.key] <= column.limit : values[column.key] < column.limit }));
  }
  function batches(record, supplemented = false) {
    const snapshots = [1, 2, 3].map(n => ({ id: `INQ-00${n}`, sentAt: `2026/11/${15 + n} 09:30:00`, completedAt: `2026/11/${15 + n} 09:35:00`, declared: [...record.declared], current: !supplemented && n === 3 }));
    if (supplemented) snapshots.push({ id: 'INQ-004', sentAt: '2026/11/18 10:00:00', completedAt: '2026/11/18 10:05:00', declared: requiredKeys(record), current: true });
    return snapshots.reverse();
  }
  function expiry(sentAt) {
    const [year, month, day, hour, minute, second] = sentAt.match(/\d+/g).map(Number);
    const maxDay = new Date(Date.UTC(year, month + 6, 0)).getUTCDate();
    return new Date(Date.UTC(year, month - 1 + 6, Math.min(day, maxDay), hour - 8, minute, second));
  }
  window.EnquiryRuleDemo = { parameters, movable, cases, people, spouseCheck, requiredKeys, missing, ready, canView, status, relationship, population, householdView, otherCaseMembers, totals, columns, assessment, batches, expiry };
})();
