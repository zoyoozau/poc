# 📋 วิธี Setup ปฏิทินร่วมทีม

## ขั้นตอนที่ 1 — ตั้งค่า Google Apps Script

1. เปิด Google Sheet ของคุณ
2. ไปที่ **Extensions → Apps Script**
3. **ลบ** โค้ดเดิมทั้งหมดออก
4. **วาง** โค้ดจากไฟล์ `apps-script-code.gs` ลงไป
5. กด **Save** (Ctrl+S)
6. กด **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
7. กด **Deploy** → **Authorize access** → อนุญาต
8. **Copy URL** ที่ได้มา (จะขึ้นต้นด้วย `https://script.google.com/macros/s/...`)

> ⚠️ ถ้าแก้ไขโค้ดในภายหลัง ต้อง **Deploy ใหม่** (New deployment) ทุกครั้ง

---

## ขั้นตอนที่ 2 — Deploy เว็บบน Vercel

### วิธีที่ 1: ลากไฟล์ขึ้น (ง่ายที่สุด)

1. ไปที่ [vercel.com](https://vercel.com) → Login
2. กด **"Add New... → Project"**
3. เลือก **"Browse"** หรือลาก **folder** ที่มีไฟล์ `index.html` และ `vercel.json` ขึ้นไป
4. กด **Deploy**
5. รอ 1-2 นาที → ได้ URL เว็บของคุณ!

### วิธีที่ 2: ผ่าน GitHub (แนะนำสำหรับอัปเดตในอนาคต)

```bash
# 1. สร้าง repo ใหม่บน GitHub แล้ว push ไฟล์
git init
git add index.html vercel.json
git commit -m "Team calendar"
git push origin main

# 2. ไป Vercel → Import from GitHub → เลือก repo
# 3. Deploy อัตโนมัติ!
```

---

## ขั้นตอนที่ 3 — เชื่อมต่อกับ Google Sheet

1. เปิดเว็บที่ Deploy แล้ว
2. ที่แถบสีเหลืองด้านบน **วาง Apps Script URL** ที่ได้จากขั้นตอนที่ 1
3. กด **บันทึก**
4. เว็บจะโหลดข้อมูลจาก Sheet อัตโนมัติ ✅

---

## โครงสร้าง Google Sheet (สร้างอัตโนมัติ)

Sheet ชื่อ `Events` จะถูกสร้างอัตโนมัติเมื่อเพิ่มงานครั้งแรก:

| row | person | title | date | category | note | createdAt |
|-----|--------|-------|------|----------|------|-----------|
| 2 | สมชาย | ประชุม | 2025-04-01 | ประชุม | | ... |
| 3 | สมหญิง | เดินทาง | 2025-04-02 | เดินทาง | ไปเชียงใหม่ | ... |

---

## ฟีเจอร์ที่ใช้งานได้

- 📅 **ดูปฏิทิน** แบบรายเดือน / รายสัปดาห์
- ➕ **เพิ่มงาน** — กดวันที่ในปฏิทินได้เลย
- ✏️ **แก้ไข / ลบ** — คลิกที่งานแล้วเลือก
- 👥 **กรองตามชื่อคน** — กด chip ด้านบน
- 🔍 **หาวันว่างร่วมกัน** — ระบุช่วงวันและเลือกคน
- 🔄 **ซิงก์ข้อมูล** — กดปุ่ม "ซิงก์" เพื่อดึงข้อมูลล่าสุด
