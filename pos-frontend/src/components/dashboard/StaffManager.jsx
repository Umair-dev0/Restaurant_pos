import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllStaff, createStaffUser } from "../../https";
import { enqueueSnackbar } from "notistack";
import { FaUserPlus, FaUserShield, FaTimes } from "react-icons/fa";

const StaffManager = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    role: "Waiter"
  });

  const { data: staffData, isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: () => getAllStaff()
  });

  const staffList = staffData?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: (data) => createStaffUser(data),
    onSuccess: (res) => {
      enqueueSnackbar(res.data?.message || "Staff member added successfully!", { variant: "success" });
      setShowModal(false);
      setFormData({
        name: "",
        phone: "",
        email: "",
        password: "",
        role: "Waiter"
      });
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (err) => {
      enqueueSnackbar(err.response?.data?.message || "Failed to create staff account.", { variant: "error" });
    }
  });

  return (
    <div className="container mx-auto py-2 px-6 md:px-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-[#262626] p-5 rounded-2xl border border-zinc-800">
        <div>
          <h2 className="font-bold text-white text-xl flex items-center gap-2">
            <FaUserShield className="text-yellow-400" /> Authorized Staff & RBAC Management
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Security control: Only authenticated Admins can provision new staff and administrative credentials.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
        >
          <FaUserPlus size={13} /> Add Staff Account
        </button>
      </div>

      {/* Staff Table */}
      <div className="overflow-x-auto bg-[#262626] rounded-2xl border border-zinc-800 shadow-xl">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-[#1b1b1b] text-zinc-400 uppercase text-[11px] font-semibold border-b border-zinc-800">
            <tr>
              <th className="p-4">Staff Member</th>
              <th className="p-4">Email</th>
              <th className="p-4">Phone</th>
              <th className="p-4">System Role</th>
              <th className="p-4">Access Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-zinc-500">Loading staff records...</td>
              </tr>
            ) : staffList.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-zinc-500">No staff members found.</td>
              </tr>
            ) : (
              staffList.map((staff) => {
                const isAdmin = staff.role === "Admin";
                const isCashier = staff.role === "Cashier";

                return (
                  <tr key={staff._id || staff.email} className="hover:bg-[#2b2b2b]/60 transition-colors">
                    <td className="p-4 font-bold text-white flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-yellow-400 text-xs">
                        {staff.name?.[0]?.toUpperCase() || "U"}
                      </div>
                      {staff.name}
                    </td>
                    <td className="p-4 text-zinc-400">{staff.email}</td>
                    <td className="p-4 text-zinc-400">{staff.phone}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-full text-[11px] border ${
                          isAdmin
                            ? "bg-yellow-950/70 text-yellow-400 border-yellow-800"
                            : isCashier
                            ? "bg-emerald-950/70 text-emerald-400 border-emerald-800"
                            : "bg-sky-950/70 text-sky-400 border-sky-800"
                        }`}
                      >
                        {isAdmin ? "👑 Admin" : isCashier ? "💵 Cashier" : "🍽️ Waiter"}
                      </span>
                    </td>
                    <td className="p-4 text-[11px] text-zinc-400">
                      {isAdmin
                        ? "Full Control (Analytics, Staff, Menu, Cancelling)"
                        : isCashier
                        ? "Billing, Payments, Checkout, Orders"
                        : "Order Taking, Floor Tables, Kitchen Status"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#242424] text-white rounded-2xl max-w-md w-full border border-zinc-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <FaUserPlus className="text-yellow-400" />
                <h3 className="font-bold text-base">Provision New Staff Account</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-white p-1 transition-colors"
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
                <label className="block text-zinc-300 font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Rohit Sharma"
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
                  <label className="block text-zinc-300 font-medium mb-1">Role Permission *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-[#181818] border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-yellow-400 font-semibold"
                  >
                    <option value="Waiter">🍽️ Waiter</option>
                    <option value="Cashier">💵 Cashier</option>
                    <option value="Admin">👑 Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="staff@restro.com"
                  className="w-full bg-[#181818] border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Initial Password * (min 8 characters)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Create secure password"
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
                  {createMutation.isPending ? "Creating..." : "Save Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManager;
