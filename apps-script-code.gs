// ============================================================
//  TEAM CALENDAR — Google Apps Script (Code.gs)
//  วางโค้ดนี้ใน Apps Script แล้ว Deploy เป็น Web App
//  Execute as: Me  |  Who has access: Anyone
// ============================================================

const SHEET_NAME = 'Events';
const SS = SpreadsheetApp.getActiveSpreadsheet();

// ─── หัว Column ───────────────────────────────────────────
// A: row  B: person  C: title  D: date  E: category  F: note
// G: timeStart  H: timeEnd  I: createdAt

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

// ─── HELPER: Get or Create Sheet (migrate header ถ้าจำเป็น) ─
function getSheet() {
  let sheet = SS.getSheetByName(SHEET_NAME);
  if (!sheet) {
    // สร้างใหม่
    sheet = SS.insertSheet(SHEET_NAME);
    sheet.appendRow(['row','person','title','date','category','note','timeStart','timeEnd','createdAt']);
    sheet.getRange(1,1,1,9).setFontWeight('bold').setBackground('#f3f4f6');
    return sheet;
  }

  // Migrate: ถ้า header row มีแค่ 7 col (schema เก่า) → เพิ่ม timeStart, timeEnd
  const lastCol = sheet.getLastColumn();
  if (lastCol < 9) {
    const headers = sheet.getRange(1,1,1,lastCol).getValues()[0];
    const hasTimeStart = headers.some(h => String(h).toLowerCase() === 'timestart');
    if (!hasTimeStart) {
      // แทรก timeStart (col G) และ timeEnd (col H) ก่อน createdAt
      // ขยับ createdAt ไปขวา
      sheet.insertColumnAfter(6);  // เพิ่ม col H
      sheet.insertColumnAfter(6);  // เพิ่ม col G
      sheet.getRange(1,7).setValue('timeStart');
      sheet.getRange(1,8).setValue('timeEnd');
      // Style
      sheet.getRange(1,1,1,9).setFontWeight('bold').setBackground('#f3f4f6');
    }
  }
  return sheet;
}

// ─── HELPER: แปลงค่าเวลาจาก Sheets → "HH:MM" ─────────────
// Sheets อาจเก็บ "09:00" เป็น Date object หรือ string
// ถ้าเป็น ISO datetime (createdAt เก่า) ให้คืน ""
function formatTime(val) {
  if (!val && val !== 0) return '';
  if (val instanceof Date) {
    // Sheets เก็บ time เป็น Date (epoch = Dec 30 1899)
    return String(val.getHours()).padStart(2,'0') + ':' + String(val.getMinutes()).padStart(2,'0');
  }
  const s = String(val).trim();
  if (!s) return '';
  // ถ้าเป็น ISO datetime เก่า (createdAt) ให้ข้าม
  if (s.includes('T') && (s.includes('Z') || s.includes('+'))) return '';
  return s;
}

// ─── GET ALL EVENTS ───────────────────────────────────────
function getAllEvents() {
  const sheet = getSheet();
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return { status: 'ok', events: [] };

  // อ่าน header เพื่อรู้ว่า schema เป็นแบบใหม่ (9 col) หรือเก่า (7 col)
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const hasTime = headers.includes('timestart');

  const events = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[1] && !row[2]) continue;

    let dateStr = '';
    if (row[3]) {
      const d = new Date(row[3]);
      dateStr = isNaN(d) ? String(row[3])
        : d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    }

    // ถ้า schema เก่า (7 col) → timeStart/timeEnd ไม่มี
    const timeStart = hasTime ? formatTime(row[6]) : '';
    const timeEnd   = hasTime ? formatTime(row[7]) : '';

    events.push({
      row:       row[0] || (i + 1),
      person:    String(row[1] || ''),
      title:     String(row[2] || ''),
      date:      dateStr,
      category:  String(row[4] || 'งาน'),
      note:      String(row[5] || ''),
      timeStart: timeStart,
      timeEnd:   timeEnd
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
    body.person    || '',
    body.title     || '',
    body.date      || '',
    body.category  || 'งาน',
    body.note      || '',
    body.timeStart || '',
    body.timeEnd   || '',
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
      sheet.getRange(i+1, 2).setValue(body.person    || '');
      sheet.getRange(i+1, 3).setValue(body.title     || '');
      sheet.getRange(i+1, 4).setValue(body.date      || '');
      sheet.getRange(i+1, 5).setValue(body.category  || 'งาน');
      sheet.getRange(i+1, 6).setValue(body.note      || '');
      sheet.getRange(i+1, 7).setValue(body.timeStart || '');
      sheet.getRange(i+1, 8).setValue(body.timeEnd   || '');
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
  return { status: 'error', message: 'ไม่พบ row ' + rowNum };
}
