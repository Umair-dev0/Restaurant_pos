import { useState, useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import OrderCard from "../components/orders/OrderCard";
import BackButton from "../components/shared/BackButton";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getOrders } from "../https/index";
import { enqueueSnackbar } from "notistack"
import { useSearchParams } from "react-router-dom";

const Orders = () => {

  const [status, setStatus] = useState("all");
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search")?.trim().toLowerCase() ?? "";

    useEffect(() => {
      document.title = "POS | Orders"
    }, [])

  const { data: resData, isError, error } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      return await getOrders();
    },
    placeholderData: keepPreviousData
  })

  useEffect(() => {
    if (isError) enqueueSnackbar(error.response?.data?.message || "Orders could not be loaded.", { variant: "error" });
  }, [isError, error]);

  const orders = resData?.data?.data ?? [];
  const filteredOrders = status === "all"
    ? orders
    : orders.filter((order) => {
        const orderStatus = order.orderStatus?.toLowerCase();
        return status === "progress"
          ? orderStatus === "in progress"
          : orderStatus === status;
      });
  const searchedOrders = filteredOrders.filter((order) =>
    [order.customerDetails?.name, order.table?.tableNo, order.orderStatus]
      .some((value) => String(value ?? "").toLowerCase().includes(search))
  );

  const { role } = useSelector((state) => state.user);

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-[#1f1f1f] pb-24">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 md:px-10 py-5 bg-[#181818] border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-white text-2xl font-black tracking-wide flex items-center gap-2">
              {role === "Cashier" ? "Billing & Active Orders" : role === "Waiter" ? "Kitchen KOT & Order Queue" : "Order Management"}
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live lifecycle: Cooking ➔ 1-Click "Mark Ready" ➔ 1-Click "Complete & Settle" (Done)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-[#242424] p-1.5 rounded-xl border border-zinc-800">
          {[
            { key: "all", label: "All Orders" },
            { key: "progress", label: "🍳 Cooking" },
            { key: "ready", label: "🔔 Ready" },
            { key: "completed", label: "✅ Done" },
            { key: "cancelled", label: "❌ Cancelled" }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatus(tab.key)}
              className={`text-xs font-bold px-3.5 py-2 rounded-lg transition-all ${
                status === tab.key
                  ? "bg-yellow-400 text-zinc-950 shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Helpful Workflow Guidance Pill */}
      <div className="mx-4 md:mx-10 mt-4 p-3 rounded-xl bg-gradient-to-r from-yellow-500/10 via-sky-500/10 to-emerald-500/10 border border-zinc-800 text-xs text-zinc-300 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className="text-yellow-400 font-bold">💡 How to change order to Done:</span>
          <span>Tap <strong>"Mark Ready"</strong> when cooked ➔ then tap <strong>"Complete Order & Release Table (Done)"</strong>.</span>
        </span>
        <span className="text-emerald-400 text-[11px] font-semibold">
          ⚡ Tables auto-release when marked Done!
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3 px-4 md:px-10 py-4">
        {searchedOrders.length > 0 ? (
          searchedOrders.map((order) => <OrderCard key={order._id} order={order} />)
        ) : (
          <p className="text-gray-500">
            {orders.length ? "No orders match your filters." : "No orders available"}
          </p>
        )}
      </div>

      <BottomNav />
    </section>
  );
};

export default Orders;
