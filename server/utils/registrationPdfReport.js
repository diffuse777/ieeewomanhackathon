const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const BLACK = '#000000';
const WHITE = '#FFFFFF';
const EVENT_NAME = 'SDG Focused Project Expo';
const REPORT_TITLE = 'Registration List';

const PAGE_BORDER = 12;
const MARGIN = 22;
const BOTTOM_MARGIN = 40;
const BORDER_TOP = 46;
const TABLE_HEADER_HEIGHT = 20;
const ROW_HEIGHT = 16;

const LOGO_DIR = path.join(__dirname, '..', 'assets');
const LOGOS = {
  wie: path.join(LOGO_DIR, 'logo-wie-kare.jpg'),
  kare: path.join(LOGO_DIR, 'logo-kare.png'),
};

const PARTICIPANT_COLUMNS = [
  { key: 'sno', label: 'Sno', weight: 0.35 },
  { key: 'teamName', label: 'Team Name', weight: 0.95 },
  { key: 'name', label: 'Name', weight: 0.95 },
  { key: 'registerNumber', label: 'Reg.no', weight: 0.85 },
  { key: 'department', label: 'Dept', weight: 0.7 },
  { key: 'section', label: 'Sec', weight: 0.35 },
  { key: 'email', label: 'Email', weight: 1.2 },
  { key: 'phone', label: 'Ph.no', weight: 0.75 },
  { key: 'studentType', label: 'DS/H', weight: 0.5 },
  { key: 'hostelName', label: 'Hostel Name', weight: 0.8 },
  { key: 'wardenName', label: 'Warden Name', weight: 0.8 },
  { key: 'roomNumber', label: 'Room no', weight: 0.55 },
  { key: 'upiReference', label: 'UPI Ref id', weight: 0.95 },
];

function formatGeneratedDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');
}

function displayValue(value) {
  if (value == null || value === '') {
    return '-';
  }
  return String(value);
}

function studentTypeLabel(value) {
  if (value === 'HOSTEL') {
    return 'H';
  }
  if (value === 'DAY_SCHOLAR') {
    return 'DS';
  }
  return displayValue(value);
}

function scaleColumns(contentWidth) {
  const totalWeight = PARTICIPANT_COLUMNS.reduce((sum, column) => sum + column.weight, 0);
  return PARTICIPANT_COLUMNS.map((column) => ({
    ...column,
    width: (column.weight / totalWeight) * contentWidth,
  }));
}

class RegistrationPdfReport {
  constructor(outputStream, options = {}) {
    this.generatedAt = formatGeneratedDate(options.generatedAt || new Date());

    this.doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: MARGIN, left: MARGIN, right: MARGIN, bottom: BOTTOM_MARGIN },
      bufferPages: false,
      autoFirstPage: true,
      compress: true,
      info: {
        Title: `${EVENT_NAME} — ${REPORT_TITLE}`,
        Author: 'Hackathon Registration System',
        Creator: 'Hackathon Registration System',
      },
    });

    this.pageNumber = 1;
    this.serial = 0;
    this.tableHeader = null;
    this.inPageAdded = false;
    this.contentWidth = this.doc.page.width - MARGIN * 2;
    this.columns = scaleColumns(this.contentWidth);
    this.finished = new Promise((resolve, reject) => {
      this.doc.on('end', resolve);
      this.doc.on('error', reject);
    });

    this.doc.on('pageAdded', () => this.onPageAdded());
    this.doc.pipe(outputStream);

    this.drawPageChrome();
    this.drawFooter();
    this.drawTableHeader();
    this.tableHeader = () => this.drawTableHeader();
  }

  pageBottom() {
    return this.doc.page.height - PAGE_BORDER - 32;
  }

  withYPreserved(draw) {
    const { x, y } = this.doc;
    draw();
    this.doc.x = x;
    this.doc.y = y;
  }

  writeLine(text, x, y, options = {}) {
    this.doc.text(text, x, y, {
      lineBreak: false,
      height: options.height || 12,
      ellipsis: true,
      ...options,
    });
  }

  drawImageIfPresent(filePath, x, y, options) {
    if (!fs.existsSync(filePath)) {
      return;
    }
    this.doc.image(filePath, x, y, options);
  }

  headerBottom() {
    return BORDER_TOP + 36;
  }

  drawPageBorder() {
    const { doc } = this;
    const x = PAGE_BORDER;
    const y = PAGE_BORDER;
    const width = doc.page.width - PAGE_BORDER * 2;
    const height = doc.page.height - PAGE_BORDER * 2;
    doc.roundedRect(x, y, width, height, 6).strokeColor(BLACK).lineWidth(1.35).stroke();
  }

  drawLogosOnTopBorder() {
    const { doc } = this;
    const leftX = MARGIN;
    const kareX = doc.page.width - MARGIN - 50;

    doc.save();
    doc.rect(leftX - 2, PAGE_BORDER + 3, 156, 36).fill(WHITE);
    doc.rect(kareX - 6, PAGE_BORDER + 2, 60, 40).fill(WHITE);
    doc.restore();

    this.drawImageIfPresent(LOGOS.wie, leftX, PAGE_BORDER + 5, { fit: [152, 32] });
    this.drawImageIfPresent(LOGOS.kare, kareX, PAGE_BORDER + 3, { fit: [48, 40] });
  }

  drawPageChrome() {
    const { doc } = this;
    this.withYPreserved(() => {
      this.drawPageBorder();
      this.drawLogosOnTopBorder();

      doc.font('Helvetica-Bold').fontSize(14).fillColor(BLACK);
      this.writeLine(EVENT_NAME, MARGIN, BORDER_TOP + 4, {
        width: this.contentWidth,
        align: 'center',
        height: 16,
      });

      doc.font('Helvetica-Bold').fontSize(11).fillColor(BLACK);
      this.writeLine(REPORT_TITLE, MARGIN, BORDER_TOP + 22, {
        width: this.contentWidth,
        align: 'center',
        height: 14,
      });
    });
    doc.y = this.headerBottom();
  }

  onPageAdded() {
    if (this.inPageAdded) {
      return;
    }

    this.inPageAdded = true;
    try {
      this.pageNumber += 1;
      this.drawPageChrome();
      this.drawFooter();
      if (this.tableHeader) {
        this.tableHeader();
      }
    } finally {
      this.inPageAdded = false;
    }
  }

  ensureSpace(needed) {
    if (this.inPageAdded) {
      return;
    }
    if (this.doc.y + needed > this.pageBottom()) {
      this.doc.addPage();
    }
  }

  drawFooter() {
    this.withYPreserved(() => {
      const stampY = this.doc.page.height - PAGE_BORDER - 26;
      const labelY = this.doc.page.height - PAGE_BORDER - 12;
      this.doc.font('Helvetica').fontSize(7.5).fillColor(BLACK);
      this.writeLine(this.generatedAt, MARGIN, stampY, {
        width: this.contentWidth,
        align: 'center',
        height: 10,
      });
      this.doc.font('Helvetica').fontSize(8.5).fillColor(BLACK);
      this.writeLine('ELECTRONICALLY GENERATED', MARGIN, labelY, {
        width: this.contentWidth,
        align: 'center',
        height: 11,
      });
    });
  }

  strokeGridRow(y, height) {
    const { doc } = this;
    doc.rect(MARGIN, y, this.contentWidth, height).strokeColor(BLACK).lineWidth(0.65).stroke();
    let x = MARGIN;
    this.columns.forEach((column, index) => {
      if (index > 0) {
        doc.moveTo(x, y).lineTo(x, y + height).strokeColor(BLACK).lineWidth(0.6).stroke();
      }
      x += column.width;
    });
  }

  drawTableHeader() {
    const { doc } = this;
    const y = doc.y;
    this.strokeGridRow(y, TABLE_HEADER_HEIGHT);
    doc.font('Helvetica-Bold').fontSize(7).fillColor(BLACK);

    let x = MARGIN;
    this.columns.forEach((column) => {
      this.writeLine(column.label, x + 2, y + 6, {
        width: column.width - 4,
        height: 9,
      });
      x += column.width;
    });
    doc.y = y + TABLE_HEADER_HEIGHT;
  }

  drawRow(values) {
    const { doc } = this;
    this.ensureSpace(ROW_HEIGHT);
    const y = doc.y;
    this.strokeGridRow(y, ROW_HEIGHT);
    doc.font('Helvetica').fontSize(6.5).fillColor(BLACK);

    let x = MARGIN;
    this.columns.forEach((column) => {
      this.writeLine(displayValue(values[column.key]), x + 2, y + 4, {
        width: column.width - 4,
        height: 9,
      });
      x += column.width;
    });
    doc.y = y + ROW_HEIGHT;
  }

  writeTeam(team) {
    const upiReference = team.paymentTransactionId || team.upiReference || '';

    (team.members || []).forEach((member) => {
      this.serial += 1;
      const isHostel = member.studentType === 'HOSTEL';
      this.drawRow({
        sno: this.serial,
        teamName: team.teamName,
        name: member.name,
        registerNumber: member.registerNumber,
        department: member.department,
        section: member.section,
        email: member.email,
        phone: member.phone,
        studentType: studentTypeLabel(member.studentType),
        hostelName: isHostel ? member.hostelName : '-',
        wardenName: isHostel ? member.wardenName : '-',
        roomNumber: isHostel ? member.roomNumber : '-',
        upiReference,
      });
    });
  }

  writeEmpty() {
    this.ensureSpace(24);
    this.doc.font('Helvetica').fontSize(11).fillColor(BLACK);
    this.writeLine('No registrations match the selected filters.', MARGIN, this.doc.y, {
      width: this.contentWidth,
      height: 14,
    });
  }

  end() {
    this.tableHeader = null;
    this.doc.end();
    return this.finished;
  }

  destroy() {
    this.tableHeader = null;
    try {
      this.doc.end();
    } catch {
      // already closed
    }
  }
}

function createRegistrationPdfReport(outputStream, options = {}) {
  return new RegistrationPdfReport(outputStream, options);
}

module.exports = {
  createRegistrationPdfReport,
  RegistrationPdfReport,
  PARTICIPANT_COLUMNS,
  EVENT_NAME,
  REPORT_TITLE,
  formatGeneratedDate,
};
