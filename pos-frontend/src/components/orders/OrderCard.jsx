import { useState } from "react";
import { FaCheckDouble, FaLongArrowAltRight, FaCircle, FaPrint, FaBan, FaUtensils, FaBell, FaCheckCircle } from "react-icons/fa";
import { formatDateAndTime, getAvatarName } from "../../utils/index";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateOrderStatus, cancelOrder } from "../../https";
import { enqueueSnackbar } from "notistack";
import { useSelector } from "react-redux";
import Invoice from "../invoice/Invoice";

const OrderCard = ({ order }) => {
  const queryClient = useQueryClient();
  const { role } = useSelector((state) => state.user);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, orderStatus }) => updateOrderStatus({ orderId, orderStatus }),
    onSuccess: (res, variables) => {
      enqueueSnackbar(
        variables.orderStatus === "Completed"
          ? "✅ Order Completed! Table released back to Available."
          : `Order status updated to "${variables.orderStatus}".`,
        { variant: "success" }
      );
      if (variables.orderStatus === "Completed") {
        setShowInvoice(true);
      }
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["orderStats"] });
    },
    onError: (err) => {
      enqueueSnackbar(err.response?.data?.message || "Failed to update order status.", { variant: "error" });
    }
  });

  const cancelOrderMutation = useMutation({
    mutationFn: ({ orderId, reason }) => cancelOrder(orderId, reason),
    onSuccess: (res) => {
      enqueueSnackbar(res.data?.message || "Order cancelled and table released.", { variant: "info" });
      setShowCancelModal(false);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["orderStats"] });
    },
    onError: (err) => {
      enqueueSnackbar(err.response?.data?.message || "Failed to cancel order.", { variant: "error" });
    }
  });

  const isCompleted = order.orderStatus === "Completed";
  const isCancelled = order.orderStatus === "Cancelled";
  const isReady = order.orderStatus === "Ready";
  const isInProgress = order.orderStatus === "In Progress";

  return (
    <>
      <div className="w-full bg-[#262626] border border-zinc-800/80 p-5 rounded-2xl mb-4 shadow-xl hover:border-zinc-700 transition-all flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-start gap-4">
            <span className="bg-yellow-400 text-zinc-900 w-12 h-12 flex items-center justify-center text-lg font-black rounded-xl shrink-0 shadow-md">
              {getAvatarName(order.customerDetails?.name || "Guest")}
            </span>
            <div className="flex items-start justify-between w-full">
              <div>
                <h1 className="text-white text-base font-bold tracking-wide">
                  {order.customerDetails?.name || "Walk-in Guest"}
                </h1>
                <p className="text-zinc-400 text-xs mt-0.5">
                  📞 {order.customerDetails?.phone || "N/A"} • {order.customerDetails?.guests || 1} Guests
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-[#1b1b1b] text-yellow-400 font-bold text-xs px-2.5 py-1 rounded-md border border-zinc-700">
                    Table {order.table?.tableNo ?? order.table ?? "—"}
                  </span>
                  <span className="bg-[#1b1b1b] text-zinc-300 text-xs px-2.5 py-1 rounded-md border border-zinc-800">
                    {order.paymentMethod === "Cash" ? "💵 Cash" : "📲 Online / UPI"}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="text-right">
                {isCompleted ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700 shadow-sm">
                    <FaCheckDouble size={11} /> Done (Completed)
                  </span>
                ) : isCancelled ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-rose-950 text-rose-400 border border-rose-800">
                    <FaBan size={11} /> Cancelled
                  </span>
                ) : isReady ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-sky-950 text-sky-400 border border-sky-700 animate-pulse shadow-sm">
                    <FaBell size={11} /> Ready to Serve
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-700">
                    <FaUtensils size={10} /> In Kitchen (Cooking)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* VISUAL ORDER PROGRESSION STEPPER (In Progress -> Ready -> Done) */}
          <div className="mt-4 bg-[#1a1a1a] p-3 rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className={`flex items-center gap-1 ${isInProgress ? "text-amber-400 font-extrabold" : "text-zinc-500"}`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${isInProgress ? "bg-amber-400 text-black" : "bg-zinc-800 text-zinc-400"}`}>1</span>
                Cooking
              </span>
              <span className="text-zinc-600 font-normal">➔</span>
              <span className={`flex items-center gap-1 ${isReady ? "text-sky-400 font-extrabold" : "text-zinc-500"}`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${isReady ? "bg-sky-400 text-black" : "bg-zinc-800 text-zinc-400"}`}>2</span>
                Ready
              </span>
              <span className="text-zinc-600 font-normal">➔</span>
              <span className={`flex items-center gap-1 ${isCompleted ? "text-emerald-400 font-extrabold" : "text-zinc-500"}`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${isCompleted ? "bg-emerald-400 text-black" : "bg-zinc-800 text-zinc-400"}`}>3</span>
                Paid & Done
              </span>
            </div>
            {/* Progress line */}
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isCompleted
                    ? "w-full bg-emerald-500"
                    : isReady
                    ? "w-2/3 bg-sky-500"
                    : isCancelled
                    ? "w-full bg-rose-600"
                    : "w-1/3 bg-amber-400"
                }`}
              />
            </div>
          </div>

          {/* Items Preview */}
          <div className="mt-3 bg-[#1e1e1e] rounded-xl p-3 border border-zinc-800 text-xs space-y-1.5">
            <div className="flex justify-between text-zinc-400 font-medium pb-1 border-b border-zinc-800">
              <span>Ordered Items ({order.items?.length || 0})</span>
              <span>Portions</span>
            </div>
            {(order.items || []).map((itm, i) => (
              <div key={i} className="flex justify-between items-center text-zinc-300">
                <span className="truncate pr-2 font-medium">{itm.name}</span>
                <span className="font-bold text-yellow-400">x{itm.quantity}</span>
              </div>
            ))}
          </div>

          {order.cancelReason && (
            <p className="mt-2 text-xs text-rose-400 bg-rose-950/30 p-2 rounded-lg border border-rose-900/50">
              Reason: {order.cancelReason}
            </p>
          )}

          <div className="flex justify-between items-center mt-3 text-xs text-zinc-400">
            <span>{formatDateAndTime(order.orderDate)}</span>
            <div className="text-right">
              <span className="text-zinc-500 text-[10px] block font-medium">Grand Total</span>
              <span className="text-white text-base font-black">
                ₹{Number(order.bills?.totalWithTax ?? 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* PRIMARY STEPPER WORKFLOW BUTTONS */}
        <div className="mt-4 pt-3 border-t border-zinc-800 space-y-2">
          {/* Step 1 -> Step 2 Button */}
          {isInProgress && (
            <button
              onClick={() => updateStatusMutation.mutate({ orderId: order._id, orderStatus: "Ready" })}
              disabled={updateStatusMutation.isPending}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-zinc-950 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <FaBell /> Step 2: Mark Plated & Ready to Serve
            </button>
          )}

          {/* Step 2 -> Step 3 Button (Done & Paid) */}
          {isReady && (
            <button
              onClick={() => updateStatusMutation.mutate({ orderId: order._id, orderStatus: "Completed" })}
              disabled={updateStatusMutation.isPending}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <FaCheckCircle /> Step 3: Complete Order & Release Table (Done)
            </button>
          )}

          {/* Secondary Action Row: Bill & Cancel */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={() => setShowInvoice(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors border border-zinc-700/60"
            >
              <FaPrint size={12} className="text-yellow-400" /> Print Tax Bill
            </button>

            {!isCancelled && (!isCompleted || role === "Admin") && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-950/40 border border-rose-900/60 transition-colors"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bill Receipt Modal */}
      {showInvoice && <Invoice orderInfo={order} setShowInvoice={setShowInvoice} />}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#242424] text-white p-6 rounded-2xl max-w-sm w-full border border-zinc-800 shadow-2xl">
            <h3 className="text-lg font-bold text-rose-400 flex items-center gap-2 mb-2">
              <FaBan /> Cancel Order?
            </h3>
            <p className="text-xs text-zinc-300 mb-4">
              Cancelling this order will immediately release Table {order.table?.tableNo ?? order.table ?? "—"} back to Available status.
            </p>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Cancellation Reason (Optional):
            </label>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g., Customer changed mind, incorrect item"
              className="w-full bg-[#181818] border border-zinc-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-rose-500 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Back
              </button>
              <button
                onClick={() => cancelOrderMutation.mutate({ orderId: order._id, reason: cancelReason })}
                disabled={cancelOrderMutation.isPending}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-md"
              >
                {cancelOrderMutation.isPending ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderCard;
