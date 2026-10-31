import { useRef } from "react";
import { motion } from "framer-motion";
import { FaCheck, FaPrint, FaDownload, FaTimes } from "react-icons/fa";

const Invoice = ({ orderInfo, setShowInvoice }) => {
  const invoiceRef = useRef(null);

  const handlePrint = () => {
    // Iframe-safe print using browser window.print() with print-only CSS
    window.print();
  };

  const handleDownloadText = () => {
    if (!orderInfo) return;
    const dateStr = new Date(orderInfo.orderDate || Date.now()).toLocaleString();
    const itemsText = (orderInfo.items || [])
      .map(
        (i) =>
          `  ${i.name.padEnd(24)} x${String(i.quantity).padStart(2)}  ₹${(i.price || 0).toFixed(2)}`
      )
      .join("\n");

    const content = `
=========================================
          RESTRO FINE DINING POS         
        Tax Invoice & Order Receipt       
=========================================
Date/Time   : ${dateStr}
Order ID    : #${Math.floor(new Date(orderInfo.orderDate || Date.now()).getTime())}
Table No    : Table ${orderInfo.table?.tableNo ?? orderInfo.table ?? "Dine-In"}
Customer    : ${orderInfo.customerDetails?.name || "Guest"} (${orderInfo.customerDetails?.phone || "N/A"})
Guests      : ${orderInfo.customerDetails?.guests || 1}
Status      : ${orderInfo.orderStatus}
Payment     : ${orderInfo.paymentMethod}
-----------------------------------------
ITEMS:
${itemsText}
-----------------------------------------
Subtotal    : ₹${Number(orderInfo.bills?.total || 0).toFixed(2)}
Tax (5.25%) : ₹${Number(orderInfo.bills?.tax || 0).toFixed(2)}
GRAND TOTAL : ₹${Number(orderInfo.bills?.totalWithTax || 0).toFixed(2)}
=========================================
      Thank You! Please Visit Again!     
=========================================
    `;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Invoice_Order_${Math.floor(new Date(orderInfo.orderDate || Date.now()).getTime())}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!orderInfo) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-y-auto">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            color: black !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white text-zinc-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative border border-zinc-200">
        {/* Modal Header */}
        <div className="bg-zinc-900 text-white px-6 py-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 text-lg">🧾</span>
            <h2 className="font-bold text-base tracking-wide">Restaurant Tax Invoice</h2>
          </div>
          <button
            onClick={() => setShowInvoice(false)}
            className="text-zinc-400 hover:text-white transition-colors p-1"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Receipt Body */}
        <div id="printable-receipt" ref={invoiceRef} className="p-6 bg-white font-mono text-xs text-zinc-800">
          <div className="text-center pb-4 border-b border-dashed border-zinc-300">
            <div className="flex justify-center mb-2 no-print">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md"
              >
                <FaCheck />
              </motion.div>
            </div>
            <h1 className="text-lg font-black tracking-wider text-black font-sans uppercase">RESTRO FINE DINING</h1>
            <p className="text-[11px] text-zinc-600 font-sans">123 Culinary Boulevard, Food District</p>
            <p className="text-[11px] text-zinc-500 font-sans">GSTIN: 07AAAAA0000A1Z5 | FSSAI: 10019011000123</p>
            <p className="mt-1 font-bold text-zinc-700 font-sans">*** TAX INVOICE ***</p>
          </div>

          <div className="py-3 border-b border-dashed border-zinc-300 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-600">Invoice No:</span>
              <span className="font-bold">#INV-{Math.floor(new Date(orderInfo.orderDate || Date.now()).getTime()).toString().slice(-6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Date & Time:</span>
              <span>{new Date(orderInfo.orderDate || Date.now()).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Table:</span>
              <span className="font-bold text-black">Table {orderInfo.table?.tableNo ?? orderInfo.table ?? "1"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Customer:</span>
              <span>{orderInfo.customerDetails?.name || "Walk-in Guest"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Guests / Phone:</span>
              <span>{orderInfo.customerDetails?.guests || 1} Guests | {orderInfo.customerDetails?.phone || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Order Status:</span>
              <span className="font-bold text-emerald-600 uppercase">{orderInfo.orderStatus}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-3 border-b border-dashed border-zinc-300">
            <div className="flex justify-between font-bold text-zinc-900 border-b border-zinc-200 pb-1 mb-2">
              <span className="w-1/2">Item Description</span>
              <span className="w-1/6 text-center">Qty</span>
              <span className="w-1/3 text-right">Amount (₹)</span>
            </div>
            <div className="space-y-1.5">
              {(orderInfo.items || []).map((item, index) => (
                <div key={index} className="flex justify-between items-center text-[11px]">
                  <span className="w-1/2 font-medium truncate text-zinc-900">{item.name}</span>
                  <span className="w-1/6 text-center text-zinc-600">{item.quantity}</span>
                  <span className="w-1/3 text-right font-medium">₹{(Number(item.price || (item.pricePerQuantity * item.quantity) || 0)).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bill Totals */}
          <div className="py-3 border-b border-dashed border-zinc-300 space-y-1 text-right">
            <div className="flex justify-between text-zinc-600">
              <span>Item Subtotal:</span>
              <span>₹{Number(orderInfo.bills?.total || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>CGST (2.5%):</span>
              <span>₹{(Number(orderInfo.bills?.tax || 0) / 2).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>SGST (2.5%):</span>
              <span>₹{(Number(orderInfo.bills?.tax || 0) / 2).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-black pt-2 border-t border-zinc-200">
              <span>GRAND TOTAL:</span>
              <span>₹{Number(orderInfo.bills?.totalWithTax || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Payment & Footer */}
          <div className="pt-3 text-center space-y-1 text-[11px] text-zinc-500">
            <p className="font-semibold text-zinc-700">Payment Mode: {orderInfo.paymentMethod} {orderInfo.paymentMethod === "Online" ? "(Verified)" : "(Cash Received)"}</p>
            <p className="italic text-[10px] pt-1">Thank you for dining with us! Have a delicious day!</p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="bg-zinc-100 px-6 py-4 border-t border-zinc-200 flex items-center justify-between gap-3 no-print">
          <button
            onClick={handleDownloadText}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-all shadow-sm"
          >
            <FaDownload /> Download .txt
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInvoice(false)}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-zinc-900 bg-yellow-400 hover:bg-yellow-500 rounded-lg transition-all shadow-md active:scale-95"
            >
              <FaPrint /> Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
