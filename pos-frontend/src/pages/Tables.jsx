import { useState, useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import BackButton from "../components/shared/BackButton";
import TableCard from "../components/tables/TableCard";
import TableQrModal from "../components/tables/TableQrModal";
import ReservationManager from "../components/tables/ReservationManager";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getTables } from "../https";
import { enqueueSnackbar } from "notistack";
import { useSelector } from "react-redux";
import { FaChair, FaCalendarAlt } from "react-icons/fa";

const Tables = () => {
  const [activeTab, setActiveTab] = useState("tables"); // 'tables' | 'reservations'
  const [status, setStatus] = useState("all");
  const [selectedQrTable, setSelectedQrTable] = useState(null);
  const guests = useSelector((state) => state.customer.guests);

  useEffect(() => {
    document.title = "POS | Tables & Reservations";
  }, []);

  const { data: resData, isError, error } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => {
      return await getTables();
    },
    placeholderData: keepPreviousData,
    refetchInterval: 5000 // Real-time simulated table sync
  });

  useEffect(() => {
    if (isError) {
      enqueueSnackbar(error.response?.data?.message || "Tables could not be loaded.", { variant: "error" });
    }
  }, [isError, error]);

  const tables = resData?.data?.data ?? [];
  const filteredTables = status === "booked"
    ? tables.filter((table) => table.status === "Booked")
    : status === "available"
    ? tables.filter((table) => table.status === "Available")
    : tables;

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-[#1f1f1f] pb-24">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 md:px-10 py-5 border-b border-zinc-800/80 bg-[#1a1a1a]">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-white text-2xl font-black tracking-wide">
              {activeTab === "tables" ? "Restaurant Floor Tables" : "Table Reservations"}
            </h1>
            <p className="text-zinc-400 text-xs mt-0.5">
              {activeTab === "tables"
                ? `${tables.filter((t) => t.status === "Available").length} Available • ${tables.filter((t) => t.status === "Booked").length} Occupied`
                : "Manage advance guest reservations and seating"}
            </p>
          </div>
        </div>

        {/* View Switcher: Tables vs Reservations */}
        <div className="flex items-center gap-2 bg-[#262626] p-1.5 rounded-2xl border border-zinc-800 shadow-md">
          <button
            onClick={() => setActiveTab("tables")}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl transition-all ${
              activeTab === "tables"
                ? "bg-yellow-400 text-zinc-950 shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <FaChair size={13} /> Floor Tables
          </button>
          <button
            onClick={() => setActiveTab("reservations")}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl transition-all ${
              activeTab === "reservations"
                ? "bg-yellow-400 text-zinc-950 shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <FaCalendarAlt size={13} /> Reservations
          </button>
        </div>
      </div>

      <div className="px-4 md:px-10 py-6">
        {activeTab === "tables" ? (
          <>
            {/* Status Filter Sub-Bar */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2 bg-[#262626] p-1.5 rounded-xl border border-zinc-800">
                <button
                  onClick={() => setStatus("all")}
                  className={`text-xs font-semibold px-4 py-1.5 rounded-lg transition-all ${
                    status === "all" ? "bg-zinc-800 text-yellow-400 font-bold" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  All ({tables.length})
                </button>
                <button
                  onClick={() => setStatus("available")}
                  className={`text-xs font-semibold px-4 py-1.5 rounded-lg transition-all ${
                    status === "available" ? "bg-zinc-800 text-emerald-400 font-bold" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Available ({tables.filter((t) => t.status === "Available").length})
                </button>
                <button
                  onClick={() => setStatus("booked")}
                  className={`text-xs font-semibold px-4 py-1.5 rounded-lg transition-all ${
                    status === "booked" ? "bg-zinc-800 text-rose-400 font-bold" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Booked ({tables.filter((t) => t.status === "Booked").length})
                </button>
              </div>

              <p className="hidden md:block text-xs text-zinc-400">
                💡 Click any available table to start taking an order.
              </p>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {filteredTables.map((table) => (
                <TableCard
                  key={table._id}
                  id={table._id}
                  name={table.tableNo}
                  status={table.status}
                  initials={table?.currentOrder?.customerDetails?.name}
                  seats={table.seats}
                  guests={guests || 1}
                  onOpenQr={(t) => setSelectedQrTable(t)}
                />
              ))}
              {filteredTables.length === 0 && (
                <div className="col-span-full py-12 text-center text-zinc-500 text-sm">
                  No tables match this filter.
                </div>
              )}
            </div>
          </>
        ) : (
          <ReservationManager tables={tables} />
        )}
      </div>

      {/* QR Code Modal */}
      {selectedQrTable && (
        <TableQrModal table={selectedQrTable} onClose={() => setSelectedQrTable(null)} />
      )}

      <BottomNav />
    </section>
  );
};

export default Tables;
