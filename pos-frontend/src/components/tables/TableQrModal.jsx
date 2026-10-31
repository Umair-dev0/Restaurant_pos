import { useState, useEffect } from "react";
import { FaQrcode, FaTimes, FaPrint, FaExternalLinkAlt } from "react-icons/fa";
import { getTableQrCode } from "../../https";
import { enqueueSnackbar } from "notistack";

const TableQrModal = ({ table, onClose }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!table?.id) return;
    const fetchQr = async () => {
      try {
        setLoading(true);
        const { data } = await getTableQrCode(table.id);
        setQrData(data.data);
      } catch (err) {
        enqueueSnackbar("Failed to generate table QR code.", { variant: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchQr();
  }, [table]);

  const handlePrintQr = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#242424] text-white rounded-2xl max-w-sm w-full border border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <FaQrcode className="text-yellow-400 text-lg" />
            <h3 className="font-bold text-base">Table {table.name} QR Code</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 transition-colors"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <p className="text-xs text-zinc-400 mb-4">
            Customers can scan this QR code at Table {table.name} to view the digital menu and place their own orders!
          </p>

          <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mx-auto mb-4 border-2 border-yellow-400/40">
            {loading ? (
              <div className="w-56 h-56 flex items-center justify-center text-zinc-500 text-xs">
                Generating QR Code...
              </div>
            ) : qrData?.qrCode ? (
              <img
                src={qrData.qrCode}
                alt={`Table ${table.name} QR Code`}
                className="w-56 h-56 object-contain"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-rose-500 text-xs">
                QR generation error
              </div>
            )}
          </div>

          <div className="text-xs text-zinc-400 space-y-1 mb-5 bg-[#1a1a1a] p-3 rounded-xl border border-zinc-800 text-left">
            <p className="truncate">
              <strong className="text-zinc-300">Target URL:</strong>{" "}
              <span className="text-yellow-400">{qrData?.orderUrl || "Loading..."}</span>
            </p>
            <p>
              <strong className="text-zinc-300">Table Seats:</strong> {table.seats} Persons
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (qrData?.orderUrl) {
                  window.location.href = qrData.orderUrl;
                }
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#333] hover:bg-[#444] text-xs font-semibold rounded-xl text-white transition-colors"
            >
              <FaExternalLinkAlt size={11} /> Open Menu
            </button>
            <button
              onClick={handlePrintQr}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-yellow-400 hover:bg-yellow-500 text-xs font-bold rounded-xl text-zinc-950 transition-colors shadow-md"
            >
              <FaPrint size={12} /> Print QR Stand
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableQrModal;
