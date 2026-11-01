/* 獨立展示情境，不改寫原始案例檔或儲存授權變更。 */
window.EnquiryCases = JSON.parse(JSON.stringify(window.EnquiryCases));
const consentDemoCase = window.EnquiryCases.find(r => r.caseId === 'CH-115-00000001');
if (consentDemoCase) {
  consentDemoCase.authorizations.forEach(a => { if (a.personId === 'A287654329') a.authorized = false; });
  delete consentDemoCase.enquiryHistory;
}
