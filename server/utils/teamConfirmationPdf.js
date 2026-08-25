const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const BLACK = '#000000';
const WHITE = '#FFFFFF';
const EVENT_NAME = 'SDG Focused Project Expo';

const PAGE_BORDER = 14;
const MARGIN = 28;
const BOTTOM_MARGIN = 44;
const BORDER_TOP = 48;
const TABLE_HEADER_HEIGHT = 22;
const ROW_HEIGHT = 20;

const LOGO_DIR = path.join(__dirname, '..', 'assets');
const LOGOS = {
  wie: path.join(LOGO_DIR, 'logo-wie-kare.jpg'),
  kare: path.join(LOGO_DIR, 'logo-kare.png'),
};

const COLUMNS = [
  { key: 'sno', label: 'S.no', weight: 0.4 },
  { key: 'name', label: 'Name', weight: 1.1 },
  { key: 'registerNumber', label: 'Reg.no', weight: 0.95 },
  { key: 'department', label: 'Dept', weight: 0.8 },
  { key: 'section', label: 'Sec', weight: 0.4 },
  { key: 'email', label: 'Email', weight: 1.35 },
  { key: 'phone', label: 'Ph.no', weight: 0.85 },
  { key: 'studentType', label: 'Hostel/DS', weight: 0.75 },
  { key: 'hostelName', label: 'Hostel Name', weight: 0.85 },
  { key: 'roomNumber', label: 'Room No', weight: 0.65 },
];

function displayValue(value) {
  if (value == null || value === '') {
    return '-';
  }
  return String(value);
}

function formatUtcNow(date = new Date()) {
  return date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');
}

function studentTypeLabel(value) {
  if (value === 'HOSTEL') {
    return 'Hostel';
  }
  if (value === 'DAY_SCHOLAR') {
    return 'Day Scholar';
  }
  return displayValue(value);
}

function scaleColumns(contentWidth) {
  const totalWeight = COLUMNS.reduce((sum, column) => sum + column.weight, 0);
  return COLUMNS.map((column) => ({
    ...column,
    width: (column.weight / totalWeight) * contentWidth,
  }));
}

function drawImageIfPresent(doc, filePath, x, y, options) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  doc.image(filePath, x, y, options);
}

function drawPageBorder(doc) {
  const x = PAGE_BORDER;
  const y = PAGE_BORDER;
  const width = doc.page.width - PAGE_BORDER * 2;
  const height = doc.page.height - PAGE_BORDER * 2;
  doc.roundedRect(x, y, width, height, 6).strokeColor(BLACK).lineWidth(1.4).stroke();
}

function drawLogos(doc) {
  const leftX = MARGIN;
  const kareX = doc.page.width - MARGIN - 52;

  doc.save();
  doc.rect(leftX - 2, PAGE_BORDER + 4, 168, 40).fill(WHITE);
  doc.rect(kareX - 6, PAGE_BORDER + 2, 64, 44).fill(WHITE);
  doc.restore();

  drawImageIfPresent(doc, LOGOS.wie, leftX, PAGE_BORDER + 6, { fit: [164, 36] });
  drawImageIfPresent(doc, LOGOS.kare, kareX, PAGE_BORDER + 4, { fit: [50, 44] });
}

function drawFooter(doc, contentWidth, generatedAt) {
  const stampY = doc.page.height - PAGE_BORDER - 28;
  const labelY = doc.page.height - PAGE_BORDER - 14;

  doc.font('Helvetica').fontSize(8).fillColor(BLACK);
  doc.text(generatedAt, MARGIN, stampY, {
    width: contentWidth,
    align: 'center',
    lineBreak: false,
    height: 10,
  });
  doc.font('Helvetica').fontSize(9).fillColor(BLACK);
  doc.text('ELECTRONICALLY GENERATED', MARGIN, labelY, {
    width: contentWidth,
    align: 'center',
    lineBreak: false,
    height: 11,
  });
}

function writeCell(doc, text, x, y, width, options = {}) {
  doc.text(displayValue(text), x + 3, y + (options.padY || 5), {
    width: width - 6,
    height: options.height || 12,
    lineBreak: false,
    ellipsis: true,
    align: options.align || 'left',
  });
}

function strokeGridRow(doc, x, y, width, height, columns) {
  doc.rect(x, y, width, height).strokeColor(BLACK).lineWidth(0.8).stroke();
  let cursor = x;
  columns.forEach((column, index) => {
    if (index > 0) {
      doc.moveTo(cursor, y).lineTo(cursor, y + height).strokeColor(BLACK).lineWidth(0.7).stroke();
    }
    cursor += column.width;
  });
}

function drawTableHeader(doc, x, y, columns) {
  const width = columns.reduce((sum, column) => sum + column.width, 0);
  strokeGridRow(doc, x, y, width, TABLE_HEADER_HEIGHT, columns);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(BLACK);
  let cursor = x;
  columns.forEach((column) => {
    writeCell(doc, column.label, cursor, y, column.width, { padY: 6, height: 10 });
    cursor += column.width;
  });
  return y + TABLE_HEADER_HEIGHT;
}

function drawTableRow(doc, x, y, columns, values) {
  const width = columns.reduce((sum, column) => sum + column.width, 0);
  strokeGridRow(doc, x, y, width, ROW_HEIGHT, columns);
  doc.font('Helvetica').fontSize(7.5).fillColor(BLACK);
  let cursor = x;
  columns.forEach((column) => {
    writeCell(doc, values[column.key], cursor, y, column.width, { padY: 5, height: 10 });
    cursor += column.width;
  });
  return y + ROW_HEIGHT;
}

function writeTeamConfirmationPdf(registration, outputStream) {
  const generatedAt = formatUtcNow(new Date());

  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margins: { top: MARGIN, left: MARGIN, right: MARGIN, bottom: BOTTOM_MARGIN },
    autoFirstPage: true,
    compress: true,
    info: {
      Title: `${EVENT_NAME} — Team Confirmation`,
      Author: 'Hackathon Registration System',
      Creator: 'Hackathon Registration System',
    },
  });

  const finished = new Promise((resolve, reject) => {
    doc.on('end', resolve);
    doc.on('error', reject);
  });

  doc.pipe(outputStream);

  const contentWidth = doc.page.width - MARGIN * 2;
  const columns = scaleColumns(contentWidth);
  const tableX = MARGIN;
  const pageBottom = () => doc.page.height - PAGE_BORDER - 36;

  function drawChrome() {
    drawPageBorder(doc);
    drawLogos(doc);
    drawFooter(doc, contentWidth, generatedAt);

    doc.font('Helvetica-Bold').fontSize(15).fillColor(BLACK);
    doc.text(EVENT_NAME, MARGIN, BORDER_TOP + 8, {
      width: contentWidth,
      align: 'center',
      lineBreak: false,
      height: 18,
    });

    doc.font('Helvetica-Bold').fontSize(12).fillColor(BLACK);
    doc.text('Team Confirmation', MARGIN, BORDER_TOP + 28, {
      width: contentWidth,
      align: 'center',
      lineBreak: false,
      height: 16,
    });
  }

  drawChrome();

  let y = BORDER_TOP + 52;

  const upiReference =
    registration.payment?.paymentTransactionId || registration.paymentReference || '';

  const leftColWidth = contentWidth * 0.52;
  const rightColX = MARGIN + leftColWidth + 8;
  const rightColWidth = contentWidth - leftColWidth - 8;

  const teamLabel = 'Team Name: ';
  const refLabel = 'UPI Reference ID: ';

  doc.font('Helvetica-Bold').fontSize(11).fillColor(BLACK);
  const teamLabelWidth = doc.widthOfString(teamLabel);
  const refLabelWidth = doc.widthOfString(refLabel);

  doc.text(teamLabel, MARGIN, y, { lineBreak: false, height: 14 });
  doc.font('Helvetica').fontSize(11).fillColor(BLACK);
  doc.text(displayValue(registration.teamName), MARGIN + teamLabelWidth, y, {
    width: Math.max(40, leftColWidth - teamLabelWidth),
    lineBreak: false,
    height: 14,
    ellipsis: true,
  });

  doc.font('Helvetica-Bold').fontSize(11).fillColor(BLACK);
  doc.text(refLabel, rightColX, y, { lineBreak: false, height: 14 });
  doc.font('Helvetica').fontSize(11).fillColor(BLACK);
  doc.text(displayValue(upiReference), rightColX + refLabelWidth, y, {
    width: Math.max(40, rightColWidth - refLabelWidth),
    lineBreak: false,
    height: 14,
    ellipsis: true,
  });

  y += 22;
  y = drawTableHeader(doc, tableX, y, columns);

  const members = Array.isArray(registration.members) ? registration.members : [];

  members.forEach((member, index) => {
    if (y + ROW_HEIGHT > pageBottom()) {
      doc.addPage();
      drawChrome();
      y = BORDER_TOP + 52;
      y = drawTableHeader(doc, tableX, y, columns);
    }

    y = drawTableRow(doc, tableX, y, columns, {
      sno: index + 1,
      name: member.name,
      registerNumber: member.registerNumber,
      department: member.department,
      section: member.section,
      email: member.email,
      phone: member.phone,
      studentType: studentTypeLabel(member.studentType),
      hostelName: member.studentType === 'HOSTEL' ? member.hostelName : '-',
      roomNumber: member.studentType === 'HOSTEL' ? member.roomNumber : '-',
    });
  });

  if (members.length === 0) {
    doc.font('Helvetica').fontSize(10).fillColor(BLACK);
    doc.text('No participants found for this team.', MARGIN, y + 8, {
      width: contentWidth,
      height: 14,
    });
  }

  doc.end();
  return finished;
}

function sanitizeFilenamePart(value) {
  return (
    String(value || 'team')
      .trim()
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'team'
  );
}

module.exports = {
  writeTeamConfirmationPdf,
  sanitizeFilenamePart,
  formatUtcNow,
  EVENT_NAME,
};
