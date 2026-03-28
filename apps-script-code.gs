// ============================================================
//  ว่างไหม? — Google Apps Script (Code.gs)
//  วางโค้ดนี้ใน Apps Script แล้ว Deploy เป็น Web App
//  Execute as: Me  |  Who has access: Anyone
// ============================================================

const SHEET_NAME = 'Events';
const SS = SpreadsheetApp.getActiveSpreadsheet();

// ─── หัว Column ───────────────────────────────────────────
// A: row  B: person  C: date  D: slots  E: createdAt

// ─── GET ──────────────────────────────────────────────────
function doGet(e) {
  const action = (e.parameter && e.parameter.action) || 'getAll';
  let result;
  try {
    result = action === 'getAll' ? getAllEvents()
           : { status: 'error', message: 'Unknown action: ' + action };
  } catch (err) {
    result = { status: 'error', message: err.message };
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── POST ─────────────────────────────────────────────────
function doPost(e) {
  let body, result;
  try {
    body = JSON.parse(e.postData.contents);
    const action = body.action || '';
    if      (action === 'add')    result = addEvent(body);
    else if (action === 'update') result = updateEvent(body);
    else if (action === 'delete') result = deleteEvent(body.row);
    else result = { status: 'error', message: 'Unknown action: ' + action };
  } catch (err) {
    result = { status: 'error', message: err.message };
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── HELPER: Get or Create Sheet ─────────────────────────
function getSheet() {
  let sheet = SS.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = SS.insertSheet(SHEET_NAME);
    sheet.appendRow(['row', 'person', 'date', 'slots', 'createdAt']);
    sheet.getRange(1,1,1,5).setFontWeight('bold').setBackground('#f3f4f6');
  }
  return sheet;
}

// ─── GET ALL EVENTS ───────────────────────────────────────
function getAllEvents() {
  const sheet = getSheet();
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return { status: 'ok', events: [] };

  const events = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[1] && !row[2]) continue;

    let dateStr = '';
    if (row[2]) {
      const d = new Date(row[2]);
      dateStr = isNaN(d) ? String(row[2])
        : d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    }

    events.push({
      row:    row[0] || (i + 1),
      person: String(row[1] || ''),
      date:   dateStr,
      slots:  String(row[3] || ''),
    });
  }
  return { status: 'ok', events };
}

// ─── ADD EVENT ────────────────────────────────────────────
function addEvent(body) {
  const sheet  = getSheet();
  const rowNum = sheet.getLastRow() + 1;
  sheet.appendRow([
    rowNum,
    body.person || '',
    body.date   || '',
    body.slots  || '',
    new Date().toISOString()
  ]);
  return { status: 'ok', row: rowNum };
}

// ─── UPDATE EVENT ─────────────────────────────────────────
function updateEvent(body) {
  const sheet = getSheet();
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.row)) {
      sheet.getRange(i+1, 2).setValue(body.person || '');
      sheet.getRange(i+1, 3).setValue(body.date   || '');
      sheet.getRange(i+1, 4).setValue(body.slots  || '');
      return { status: 'ok' };
    }
  }
  return { status: 'error', message: 'ไม่พบ row ' + body.row };
}

// ─── DELETE EVENT ─────────────────────────────────────────
function deleteEvent(rowNum) {
  const sheet = getSheet();
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(rowNum)) {
      sheet.deleteRow(i + 1);
      return { status: 'ok' };
    }
  }
  return { status: 'error', message: 'ไม่พบ row ' + rowNum }
}
