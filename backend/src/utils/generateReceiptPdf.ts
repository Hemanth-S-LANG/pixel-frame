import PDFDocument from "pdfkit";

const STUDIO_NAME = "Sapthagiri Studio";

interface ReceiptData {
  bookingId:        string;
  customerName:     string;
  customerEmail:    string;
  customerPhone:    string;
  programName:      string;
  programPrice:     number;
  currency:         string;
  bookingDate:      Date | string;
  startTime:        string;
  endTime:          string;
  razorpayPaymentId: string;
  paymentStatus:    string;
  bookingStatus:    string;
}

/** Formats paise → "₹1,100" */
function formatAmount(paise: number, currency: string): string {
  const symbol = currency === "INR" ? "₹" : "$";
  return `${symbol}${(paise / 100).toLocaleString("en-IN")}`;
}

/**
 * Builds a payment confirmation PDF in memory.
 * Returns a Buffer — nothing is written to disk.
 */
export function generateReceiptPdf(data: ReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data",  (chunk: Buffer) => chunks.push(chunk));
    doc.on("end",   () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const generatedOn = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "long",
      timeStyle: "short",
    });

    const bookedDate = new Date(data.bookingDate).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "long",
    });

    // ── Header ────────────────────────────────────────────────────────────────
    doc
      .fontSize(22)
      .font("Helvetica-Bold")
      .text(STUDIO_NAME, { align: "center" });

    doc
      .fontSize(11)
      .font("Helvetica")
      .text("Payment Confirmation Receipt", { align: "center" });

    doc.moveDown(0.5);
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor("#C9A84C")
      .lineWidth(1.5)
      .stroke();

    doc.moveDown(1);

    // ── Helper: two-column row ────────────────────────────────────────────────
    const row = (label: string, value: string) => {
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(label, 50, doc.y, { continued: true, width: 180 });
      doc
        .font("Helvetica")
        .text(value, { align: "left" });
      doc.moveDown(0.3);
    };

    // ── Booking details ───────────────────────────────────────────────────────
    doc.fontSize(12).font("Helvetica-Bold").text("Booking Details").moveDown(0.4);

    row("Booking ID:",       data.bookingId);
    row("Booking Status:",   data.bookingStatus.toUpperCase());
    row("Service:",          data.programName);
    row("Date:",             bookedDate);
    row("Time Slot:",        `${data.startTime} — ${data.endTime}`);

    doc.moveDown(0.8);

    // ── Customer details ──────────────────────────────────────────────────────
    doc.fontSize(12).font("Helvetica-Bold").text("Customer Details").moveDown(0.4);

    row("Name:",             data.customerName);
    row("Email:",            data.customerEmail);
    row("Phone:",            data.customerPhone);

    doc.moveDown(0.8);

    // ── Payment details ───────────────────────────────────────────────────────
    doc.fontSize(12).font("Helvetica-Bold").text("Payment Details").moveDown(0.4);

    row("Payment ID:",       data.razorpayPaymentId || "N/A");
    row("Payment Status:",   data.paymentStatus.toUpperCase());
    row("Amount Paid:",      formatAmount(data.programPrice, data.currency));

    doc.moveDown(1.2);

    // ── Footer ────────────────────────────────────────────────────────────────
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor("#cccccc")
      .lineWidth(0.5)
      .stroke();

    doc.moveDown(0.5);
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#888888")
      .text(`Receipt generated on ${generatedOn} (IST)`, { align: "center" });
    doc
      .text("Sapthagiri Studio · Harohalli - 562112 · sapthagiristudio@gmail.com · 9035661669", { align: "center" });

    doc.end();
  });
}
