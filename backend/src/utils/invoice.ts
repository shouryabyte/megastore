import PDFDocument from "pdfkit";

export async function generateInvoicePdf(input: { order: any; items: any[]; vendors: any[]; inventory: any[] }) {
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(c));

  const vendorsById = new Map(input.vendors.map((v) => [v._id.toString(), v]));

  doc.fontSize(20).text("NexChakra Invoice", { align: "left" });
  doc.moveDown(0.25);
  doc.fontSize(10).fillColor("#444").text(`Order: ${input.order.orderNumber}`);
  doc.text(`Date: ${new Date(input.order.createdAt ?? input.order.placedAt ?? Date.now()).toLocaleString()}`);
  doc.moveDown(0.75);

  doc.fillColor("#000").fontSize(12).text("Ship To", { underline: true });
  const a = input.order.shippingAddress;
  doc.fontSize(10).text(`${a.fullName}`);
  doc.text(`${a.phone}`);
  doc.text(`${a.line1}${a.line2 ? ", " + a.line2 : ""}`);
  doc.text(`${a.city}, ${a.state} ${a.pincode}`);
  doc.text(`${a.country}`);
  doc.moveDown(1);

  doc.fontSize(12).text("Items", { underline: true });
  doc.moveDown(0.4);

  const startX = doc.x;
  const col = { title: startX, qty: startX + 290, price: startX + 340, total: startX + 420 };
  doc.fontSize(9).fillColor("#666");
  doc.text("Product", col.title, doc.y, { width: 280 });
  doc.text("Qty", col.qty, doc.y, { width: 40, align: "right" });
  doc.text("Price", col.price, doc.y, { width: 70, align: "right" });
  doc.text("Total", col.total, doc.y, { width: 80, align: "right" });
  doc.moveDown(0.3);
  doc.strokeColor("#e5e7eb").lineWidth(1).moveTo(startX, doc.y).lineTo(startX + 500, doc.y).stroke();
  doc.moveDown(0.3);

  doc.fillColor("#111827").fontSize(10);
  for (const it of input.items) {
    const vendor = vendorsById.get(it.vendorId.toString());
    const title = `${it.titleSnapshot}${vendor ? `  •  Sold by ${vendor.displayName}` : ""}`;
    const y = doc.y;
    doc.text(title, col.title, y, { width: 280 });
    doc.text(String(it.quantity), col.qty, y, { width: 40, align: "right" });
    doc.text(money(it.unitPrice), col.price, y, { width: 70, align: "right" });
    doc.text(money(it.totalPrice), col.total, y, { width: 80, align: "right" });
    doc.moveDown(0.6);
  }

  doc.moveDown(0.5);
  doc.strokeColor("#e5e7eb").lineWidth(1).moveTo(startX, doc.y).lineTo(startX + 500, doc.y).stroke();
  doc.moveDown(0.6);

  const rightX = startX + 330;
  doc.fontSize(10).fillColor("#111827");
  doc.text("Subtotal", rightX, doc.y, { width: 100 });
  doc.text(money(input.order.itemsSubtotal), rightX + 140, doc.y, { width: 80, align: "right" });
  doc.moveDown(0.25);
  doc.text("Shipping", rightX, doc.y, { width: 100 });
  doc.text(money(input.order.shippingFee), rightX + 140, doc.y, { width: 80, align: "right" });
  doc.moveDown(0.25);
  doc.text("Tax", rightX, doc.y, { width: 100 });
  doc.text(money(input.order.tax), rightX + 140, doc.y, { width: 80, align: "right" });
  doc.moveDown(0.4);
  doc.fontSize(12).text("Total", rightX, doc.y, { width: 100 });
  doc.text(money(input.order.total), rightX + 140, doc.y, { width: 80, align: "right" });

  doc.moveDown(1);
  doc.fontSize(9).fillColor("#6b7280").text("Thank you for shopping with NexChakra.");

  doc.end();
  await new Promise<void>((resolve) => doc.on("end", () => resolve()));
  return Buffer.concat(chunks);
}

function money(n: number) {
  return `₹${(n ?? 0).toFixed(2)}`;
}

