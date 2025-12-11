// server.js
const express = require('express');
const path = require('path');
const PDFDocument = require('pdfkit'); // NEW

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---- Mock "database" of appointments ----
const appointments = [
  {
    nationalId: '1234567890',
    fullName: 'سارة عبد الله السعد',
    service: 'الأحوال المدنية - تجديد بطاقة الهوية الوطنية',
    location: 'مكتب الأحوال المدنية بالرياض - فرع العليا',
    date: '2025-12-05',
    time: '10:30 ص',
    ticketNumber: 'أ-102',
    notes:
      'يُرجى التوجه إلى الطابق الأول عبر المصعد الرئيسي أو الدرج المجاور للاستقبال. تقع النافذة رقم 5 في القسم الأيمن من الصالة، بجانب لوحة الإرشادات الإلكترونية. سيتم عرض رقم تذكرتكم أ-102 على الشاشة الإلكترونية عند حلول دوركم.'
  },
  {
    nationalId: '1111222233',
    fullName: 'محمد صالح القحطاني',
    service: 'مكتب الجوازات - إصدار جواز سفر',
    location: 'مكتب الجوازات بالرياض - طريق الملك فهد',
    date: '2025-12-06',
    time: '01:15 م',
    ticketNumber: 'ب-057',
    notes:
      'تقع النافذة رقم 12 في الصالة الرئيسية بالطابق الأرضي، على بُعد عشرة أمتار تقريباً من المدخل الرئيسي جهة اليسار. يُمكن الوصول إليها مباشرة بعد تجاوز بوابة الأمن. راقب شاشات العرض الإلكترونية التي ستُظهر رقم تذكرتكم ب-057 عند استدعائكم.'
  },
  {
    nationalId: '9876543210',
    fullName: 'هند عبد الله',
    service: 'إدارة المرور - تجديد الرخصة',
    location: 'مكتب المرور بالرياض - ملز',
    date: '2025-12-07',
    time: '09:00 ص',
    ticketNumber: 'ج-021',
    notes:
      'يُرجى التوجه إلى قسم تجديد الرخص في الجناح الأيمن من المبنى. تقع النافذة رقم 8 في نهاية الممر الأول، بالقرب من منطقة الانتظار المخصصة. تابع الشاشة الإلكترونية لظهور رقم تذكرتكم ج-021 عند حلول دوركم.'
  }
];

// ---- Routes ----

// Check if national ID exists
app.post('/api/check-id', (req, res) => {
  const { nationalId } = req.body;

  if (!nationalId) {
    return res.status(400).json({ ok: false, message: 'National ID is required.' });
  }

  const appointment = appointments.find(a => a.nationalId === nationalId);

  if (!appointment) {
    return res.status(404).json({ ok: false, message: 'No appointment found for this ID.' });
  }

  // Don't send details yet (only after verification)
  res.json({ ok: true, message: 'ID found. Choose verification method.' });
});

// Simulated selfie verification
app.post('/api/verify-selfie', (req, res) => {
  const { nationalId } = req.body;

  const appointment = appointments.find(a => a.nationalId === nationalId);
  if (!appointment) {
    return res.status(404).json({ ok: false, message: 'Appointment not found.' });
  }

  // For now, we just simulate success.
  res.json({
    ok: true,
    message: 'Selfie verified successfully.',
    appointment
  });
});

// Simulated fingerprint verification
app.post('/api/verify-fingerprint', (req, res) => {
  const { nationalId } = req.body;

  const appointment = appointments.find(a => a.nationalId === nationalId);
  if (!appointment) {
    return res.status(404).json({ ok: false, message: 'Appointment not found.' });
  }

  // For now, we just simulate success.
  res.json({
    ok: true,
    message: 'Fingerprint verified successfully.',
    appointment
  });
});

// NEW: Generate appointment PDF for a given national ID
app.get('/api/appointment-pdf/:nationalId', (req, res) => {
  const { nationalId } = req.params;

  const appointment = appointments.find(a => a.nationalId === nationalId);
  if (!appointment) {
    return res.status(404).send('Appointment not found.');
  }

  // Set headers so browser opens it as PDF
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="appointment-${nationalId}.pdf"`
  );

  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  // Pipe the PDF into the response
  doc.pipe(res);

  // NOTE: PDFKit by default لا يدعم تشكيل العربية بشكل كامل،
  // لكن للعرض التجريبي نكتب النص كما هو. في مشروع حقيقي
  // ممكن تستخدمين خط خاص أو مكتبة تدعم العربية بالكامل.
  doc.fontSize(18).text('تأكيد حجز الموعد', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12).text(`رقم الهوية: ${appointment.nationalId}`, { align: 'right' });
  doc.moveDown(0.5);

  doc.text(`الاسم الكامل: ${appointment.fullName}`, { align: 'right' });
  doc.moveDown(0.5);

  doc.text(`الخدمة: ${appointment.service}`, { align: 'right' });
  doc.moveDown(0.5);

  doc.text(`الموقع: ${appointment.location}`, { align: 'right' });
  doc.moveDown(0.5);

  doc.text(`التاريخ: ${appointment.date}`, { align: 'right' });
  doc.moveDown(0.5);

  doc.text(`الوقت: ${appointment.time}`, { align: 'right' });
  doc.moveDown(0.5);

  doc.text(`رقم التذكرة: ${appointment.ticketNumber}`, { align: 'right' });
  doc.moveDown();

  doc.text('ملاحظات:', { align: 'right' });
  doc.moveDown(0.3);
  doc.text(appointment.notes, {
    align: 'right',
    width: 480
  });

  doc.moveDown(2);
  doc.fontSize(10).text(
    'هذا المستند ناتج عن نظام محاكاة تجريبي ولا يمثل أي جهة حكومية رسمية.',
    { align: 'center' }
  );

  // Finalize the PDF and end the stream
  doc.end();
});

// Start server
app.listen(PORT, () => {
  console.log(`Gov entrance server running at http://localhost:${PORT}`);
});
