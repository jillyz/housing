/* 獨立情境：原案件未列配偶；戶政查出配偶，授權尚未取得。 */
window.EnquiryCases = JSON.parse(JSON.stringify(window.EnquiryCases));
const spouseDemoCase = window.EnquiryCases.find(r => r.caseId === 'CH-115-00000001');
if (spouseDemoCase) {
  spouseDemoCase.caseMemberIds = spouseDemoCase.caseMemberIds.filter(id => id !== 'A287654329');
  spouseDemoCase.authorizations = spouseDemoCase.authorizations.filter(a => a.personId !== 'A287654329');
  spouseDemoCase.result.people.forEach(p => { if (p.id === 'A287654329') delete p.fetus; });
  spouseDemoCase.households.forEach(h => h.members.forEach(p => { if (p.id === 'A287654329') delete p.fetus; }));
  delete spouseDemoCase.enquiryHistory;
}
