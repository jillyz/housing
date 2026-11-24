const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ExcelJS = require('../backend/assets/vendor/exceljs/exceljs.min.js');
function setup(withExcel = false) {
  const context = { window: null, Intl, Date, setTimeout, clearTimeout, TextEncoder, TextDecoder };
  context.window = context;
  vm.createContext(context);
  if (withExcel) vm.runInContext(fs.readFileSync(path.join(__dirname, '../backend/assets/vendor/exceljs/exceljs.min.js'), 'utf8'), context);
  for (const name of ['enquiry-rules-data.js', 'enquiry-rules-export.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../backend/assets/js', name), 'utf8'), context);
  return { model: context.EnquiryRuleDemo, report: context.EnquiryRuleExport, Excel: context.ExcelJS };
}
test('年齡以申請日判斷 18 歲、65 歲週歲邊界，資料不足不推定否', () => {
  const { report } = setup();
  assert.equal(report.ageAt('2008/11/18', '2026-11-18'), 18);
  assert.equal(report.ageAt('2008/11/19', '2026-11-18'), 17);
  assert.equal(report.ageAt('1961/11/18', '2026-11-18'), 65);
  assert.equal(report.ageAt('1961/11/19', '2026-11-18'), 64);
  assert.equal(report.ageAt('2026/02/01', '2026-11-18'), 0);
  assert.equal(report.ageAt('2026/12/01', '2026-11-18'), null);
  assert.equal(report.ageAt('2008/02/30', '2026-11-18'), null);
  assert.equal(report.ageAt('', '2026-11-18'), null);
  assert.equal(report.oneYear('2025-11-18', '2026-11-18'), true);
  assert.equal(report.oneYear('2025-11-19', '2026-11-18'), false);
  assert.equal(report.oneYear('2024-02-29', '2025-02-28'), true);
});
test('十六個欄位順序、姓名斷行、原住民養父母逐人判斷與財務結果一致', () => {
  const { model, report } = setup();
  assert.equal(report.headers.length, 16);
  const row = report.row(model.cases[4]);
  assert.deepEqual(Array.from(row.slice(0, 3)), ['LB115B00000005', '北屯好宅', '張忠政']);
  assert.equal(row[3], '!\n張曉雯\n張曉晨');
  assert.equal(row[4], 'V\n張大富');
  assert.equal(row[9], 2);
  assert.match(row[10], /張大富：!\n張忠政：V/);
  assert.match(row[11], /張大富：!\n張忠政：V/);
  assert.equal(row[10].split('\n').length, 5);
  assert.equal(row[11].split('\n').length, 5);
  for (const record of model.cases) {
    const output = report.row(record), checks = model.assessment(record);
    assert.equal(output.length, 16);
    if (checks) for (const [index, key] of [[12, 'totalIncome'], [13, 'monthlyIncome'], [15, 'movableValue']]) assert.equal(output[index], checks.find(c => c.key === key).pass ? 'V' : '!');
  }
  assert.deepEqual(Array.from(report.row(model.cases[5]).slice(12)), ['!', '!', '', '!']);
});
test('設籍僅判斷申請人，區別同縣市不同區、異縣市、未滿及剛滿一年', () => {
  const { model, report } = setup();
  assert.deepEqual(Array.from(report.row(model.cases[4]).slice(5, 7)), ['V', '!']);
  assert.deepEqual(Array.from(report.row(model.cases[5]).slice(5, 7)), ['!', '!']);
  assert.deepEqual(Array.from(report.row(model.cases[6]).slice(5, 7)), ['V', '!']);
  assert.deepEqual(Array.from(report.row(model.cases[7]).slice(5, 7)), ['V', 'V']);
  model.people(model.cases[7]).find(p => p.key === model.cases[7].spouse).registration = null;
  assert.deepEqual(Array.from(report.row(model.cases[7]).slice(5, 7)), ['V', 'V']);
});
test('子女人數依父母姓名和未成年年齡比對，不依稱謂或胎兒數推定', () => {
  const { model, report } = setup();
  const record = JSON.parse(JSON.stringify(model.cases[4]));
  const children = record.households[0].members.filter(p => p.generation === 3);
  children[0].father = '其他人'; children[0].mother = '其他人';
  assert.equal(report.row(record)[9], 1);
  children[1].birth = '2008/11/18';
  assert.equal(report.row(record)[9], 0);
  record.marriage = '無偶';
  assert.deepEqual(Array.from(report.row(record).slice(7, 9)), ['!', '!']);
});
test('查調中和待補齊的未查資料留白，不輸出未填列者隱藏資料', () => {
  const { model, report } = setup();
  assert.ok(report.row(model.cases[9]).slice(3).every(value => value === ''));
  const pending = report.row(model.cases[0]);
  assert.equal(pending[10], '');
  assert.ok(pending.slice(12).every(value => value === ''));
  assert.equal(pending.join('\n').includes('張曉雯'), false);
  assert.equal(pending[9], 1);
});
test('實際 xlsx 往返讀取保留多行、欄位次序、數字型人數、凍結及篩選', async () => {
  const { model, report, Excel } = setup(true);
  const workbook = report.buildWorkbook([model.cases[4], model.cases[5]], Excel);
  const buffer = await workbook.xlsx.writeBuffer();
  assert.equal(buffer[0], 0x50); assert.equal(buffer[1], 0x4b);
  const loaded = new ExcelJS.Workbook();
  await loaded.xlsx.load(new Uint8Array(buffer));
  const sheet = loaded.getWorksheet('查調案件');
  assert.equal(sheet.rowCount, 3);
  assert.equal(sheet.columnCount, 16);
  assert.deepEqual(sheet.getRow(1).values.slice(1), Array.from(report.headers));
  assert.equal(sheet.getCell('D2').value, '!\n張曉雯\n張曉晨');
  assert.equal(sheet.getCell('J2').value, 2);
  assert.equal(sheet.getCell('D2').alignment.wrapText, true);
  assert.equal(sheet.views[0].ySplit, 1);
  assert.equal(sheet.autoFilter, 'A1:P3');
  assert.ok(sheet.getRow(2).height >= 100);
  assert.equal(sheet.getCell('M3').value, '!');
});
