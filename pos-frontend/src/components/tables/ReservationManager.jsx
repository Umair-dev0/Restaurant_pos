import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getReservations, createReservation, updateReservationStatus } from "../../https";
import { enqueueSnackbar } from "notistack";
import { FaCalendarAlt, FaClock, FaUsers, FaPlus, FaCheck, FaTimes, FaPhone, FaChair } from "react-icons/fa";

const ReservationManager = ({ tables = [] }) => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    email: "",
    guests: 2,
    reservationDate: new Date().toISOString().split("T")[0],
    timeSlot: "19:30",
    tableNo: 1,
    notes: ""
  });

  const { data: resData, isLoading } = useQuery({
    queryKey: ["reservations"],
    queryFn: () => getReservations()
  });

  const reservations = resData?.data?.data || [];
  const filteredReservations = filterStatus === "all"
    ? reservations
    : reservations.filter((r) => r.status.toLowerCase() === filterStatus.toLowerCase());

  const createMutation = useMutation({
    mutationFn: (data) => createReservation(data),
    onSuccess: (res) => {
      enqueueSnackbar(res.data?.message || "Reservation booked successfully!", { variant: "success" });
      setShowModal(false);
      setFormData({
        customerName: "",
        phone: "",
        email: "",
        guests: 2,
        reservationDate: new Date().toISOString().split("T")[0],
        timeSlot: "19:30",
        tableNo: 1,
        notes: ""
      });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: (err) => {
      enqueueSnackbar(err.response?.data?.message || "Booking failed.", { variant: "error" });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => updateReservationStatus(id, status),
    onSuccess: (res) => {
      enqueueSnackbar(res.data?.message || "Reservation updated.", { variant: "info" });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
    onError: (err) => {
      enqueueSnackbar(err.response?.data?.message || "Update failed.", { variant: "error" });
    }
  });

  return (
    <div className="w-full">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-[#262626] p-4 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-2">
          {["all", "confirmed", "seated", "cancelled"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`capitalize text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                filterStatus === st
                  ? "bg-yellow-400 text-zinc-950 font-bold shadow"
                  : "bg-zinc-800/80 text-zinc-400 hover:text-white"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
        >
          <FaPlus size={12} /> New Reservation
        </button>
      </div>

      {/* Reservation Cards List */}
      {isLoading ? (
        <p className="text-zinc-500 p-8 text-center text-sm">Loading table reservations...</p>
      ) : filteredReservations.length === 0 ? (
        <div className="text-center py-12 bg-[#242424] rounded-2xl border border-zinc-800 p-8">
          <p className="text-zinc-400 text-base font-semibold">No reservations found.</p>
          <p className="text-zinc-500 text-xs mt-1">Book a new reservation for guests in advance.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReservations.map((res) => {
            const isConfirmed = res.status === "Confirmed";
            const isSeated = res.status === "Seated";
            const isCancelled = res.status === "Cancelled";

            return (
              <div
                key={res._id}
                className="bg-[#262626] border border-zinc-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-zinc-700 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-white font-bold text-base tracking-wide">
                        {res.customerName}
                      </h3>
                      <p className="text-zinc-400 text-xs flex items-center gap-1.5 mt-0.5">
                        <FaPhone size={10} className="text-yellow-400" /> {res.phone}
                      </p>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                        isConfirmed
                          ? "bg-amber-950/70 text-amber-400 border-amber-800"
                          : isSeated
                          ? "bg-emerald-950/70 text-emerald-400 border-emerald-800"
                          : "bg-rose-950/70 text-rose-400 border-rose-800"
                      }`}
                    >
                      {res.status}
                    </span>
                  </div>

                  {/* Details pills */}
                  <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                    <div className="bg-[#1e1e1e] p-2.5 rounded-xl border border-zinc-800 flex items-center gap-2 text-zinc-300">
                      <FaCalendarAlt className="text-yellow-400 shrink-0" />
                      <span className="truncate">{res.reservationDate}</span>
                    </div>
                    <div className="bg-[#1e1e1e] p-2.5 rounded-xl border border-zinc-800 flex items-center gap-2 text-zinc-300">
                      <FaClock className="text-yellow-400 shrink-0" />
                      <span>{res.timeSlot}</span>
                    </div>
                    <div className="bg-[#1e1e1e] p-2.5 rounded-xl border border-zinc-800 flex items-center gap-2 text-zinc-300">
                      <FaChair className="text-yellow-400 shrink-0" />
                      <span>Table {res.tableNo}</span>
                    </div>
                    <div className="bg-[#1e1e1e] p-2.5 rounded-xl border border-zinc-800 flex items-center gap-2 text-zinc-300">
                      <FaUsers className="text-yellow-400 shrink-0" />
                      <span>{res.guests} Guests</span>
                    </div>
                  </div>

                  {res.notes && (
                    <p className="text-xs text-zinc-400 italic bg-[#1f1f1f] p-2 rounded-lg border border-zinc-800/80 mb-2">
                      &quot;{res.notes}&quot;
                    </p>
                  )}
                </div>

                {/* Actions */}
                {isConfirmed && (
                  <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() =>
                        updateStatusMutation.mutate({ id: res._id, status: "Cancelled" })
                      }
                      className="px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40 border border-rose-900/50 rounded-lg transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() =>
                        updateStatusMutation.mutate({ id: res._id, status: "Seated" })
                      }
                      className="px-3 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <FaCheck size={10} /> Seat Guest
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#242424] text-white rounded-2xl max-w-md w-full border border-zinc-800 shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 text-lg">📅</span>
                <h3 className="font-bold text-base">Book Table Reservation</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-white transition-colors p-1"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(formData);
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="e.g., Rajesh Khanna"
                  className="w-full bg-[#181818] border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full bg-[#181818] border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Guests *</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={formData.guests}
                    onChange={(e) => setFormData({ ...formData, guests: Number(e.target.value) })}
                    className="w-full bg-[#181818] border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-yellow-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.reservationDate}
                    onChange={(e) => setFormData({ ...formData, reservationDate: e.target.value })}
                    className="w-full bg-[#181818] border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Time Slot *</label>
                  <select
                    value={formData.timeSlot}
                    onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                    className="w-full bg-[#181818] border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-yellow-400"
                  >
                    {["12:00", "12:30", "13:00", "13:30", "14:00", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Select Table *</label>
                <select
                  value={formData.tableNo}
                  onChange={(e) => setFormData({ ...formData, tableNo: Number(e.target.value) })}
                  className="w-full bg-[#181818] border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-yellow-400"
                >
                  {tables.map((t) => (
                    <option key={t._id} value={t.tableNo}>
                      Table {t.tableNo} ({t.seats} Seats) - {t.status}
                    </option>
                  ))}
                  {tables.length === 0 && (
                    Array.from({ length: 15 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>Table {i + 1} (4 Seats)</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Special Notes / Occasion</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g., Birthday celebration, corner table requested"
                  className="w-full bg-[#181818] border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-zinc-400 hover:text-white font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-zinc-950 font-bold rounded-xl transition-all shadow-md active:scale-95"
                >
                  {createMutation.isPending ? "Confirming..." : "Confirm Reservation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationManager;
