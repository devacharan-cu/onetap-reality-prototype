// Test History Lifecycle logic
const fs = require('fs');

console.log('=== TESTING SCAN HISTORY LIFECYCLE ===');

// Mock localStorage
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = v; },
  removeItem: (k) => { delete storage[k]; }
};

function saveScan(newAnalysis, thumb) {
  const current = JSON.parse(localStorage.getItem("onetap_scan_history") || "[]");
  if (current.length > 0 && current[0].title === newAnalysis.title && current[0].summary === newAnalysis.summary) {
    return;
  }
  const newItem = {
    id: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    context: newAnalysis.context,
    title: newAnalysis.title,
    summary: newAnalysis.summary,
    thumbnail: thumb,
    analysis: newAnalysis,
  };
  const updated = [newItem, ...current.slice(0, 19)];
  localStorage.setItem("onetap_scan_history", JSON.stringify(updated));
  return newItem.id;
}

function deleteScan(id) {
  const current = JSON.parse(localStorage.getItem("onetap_scan_history") || "[]");
  const updated = current.filter(item => item.id !== id);
  localStorage.setItem("onetap_scan_history", JSON.stringify(updated));
}

function clearAll() {
  localStorage.removeItem("onetap_scan_history");
}

function getHistory() {
  return JSON.parse(localStorage.getItem("onetap_scan_history") || "[]");
}

// 1. Add Scan 1
const id1 = saveScan({ context: 'event_poster', title: 'Borcelle College Art Fair', summary: 'Art Fair 10th-18th Oct' });
console.log('1. Added Scan 1, ID:', id1);

// 2. Add Scan 2
const id2 = saveScan({ context: 'transit_sign', title: 'Route 42 Express', summary: 'Next bus at 10:45 AM' });
console.log('2. Added Scan 2, ID:', id2);

let list = getHistory();
console.log('3. History count:', list.length, 'Titles:', list.map(i => i.title));
if (list.length !== 2) throw new Error('Expected 2 items');

// 4. Delete ONLY Scan 1
deleteScan(id1);
console.log('4. Deleted Scan 1 (ID:', id1, ')');

list = getHistory();
console.log('5. History count after single delete:', list.length, 'Titles:', list.map(i => i.title));
if (list.length !== 1 || list[0].id !== id2) throw new Error('Scan 2 should remain');

// 6. Test Clear All
clearAll();
console.log('6. Executed Clear All');
list = getHistory();
console.log('7. History count after Clear All:', list.length);
if (list.length !== 0) throw new Error('Expected empty history');

// 8. Add Scan 3 after Clear All
const id3 = saveScan({ context: 'business_card', title: 'Design Studio Card', summary: 'Contact details' });
console.log('8. Added Scan 3 after Clear All, ID:', id3);
list = getHistory();
console.log('9. History count:', list.length, 'Titles:', list.map(i => i.title));
if (list.length !== 1 || list[0].id !== id3) throw new Error('Expected Scan 3 in history');

console.log('=== ALL HISTORY TESTS PASSED SUCCESSFULLY! ===');
