import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { getMenu, getOrderStats, getTables, getInventory, updateStock } from "../../https";
import { FaArrowUp, FaExclamationTriangle, FaBoxes, FaChartBar, FaCalendarAlt } from "react-icons/fa";

const periods = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 14 days", days: 14 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 }
];

const Metrics = () => {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState(30);

  const statsQuery = useQuery({
    queryKey: ["orderStats", period],
    queryFn: () => getOrderStats(period)
  });
  const tablesQuery = useQuery({ queryKey: ["tables"], queryFn: getTables });
  const menuQuery = useQuery({ queryKey: ["menu"], queryFn: getMenu });
  const inventoryQuery = useQuery({ queryKey: ["inventory"], queryFn: getInventory });

  const stats = statsQuery.data?.data?.data;
  const tables = tablesQuery.data?.data?.data ?? [];
  const menus = menuQuery.data?.data?.data ?? [];
  const inventoryItems = inventoryQuery.data?.data?.data ?? [];
  const lowStockItems = inventoryItems.filter((i) => i.isLowStock || i.isOutOfStock);

  const restockMutation = useMutation({
    mutationFn: ({ id, delta }) => updateStock(id, { delta }),
    onSuccess: (res) => {
      enqueueSnackbar(res.data?.message || "Restocked successfully!", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    },
    onError: (err) => {
      enqueueSnackbar(err.response?.data?.message || "Failed to update stock.", { variant: "error" });
    }
  });

  const dishCount = menus.reduce((count, category) => count + (category.items?.length || 0), 0);

  const isError = statsQuery.isError || tablesQuery.isError || menuQuery.isError;
  useEffect(() => {
    if (isError) {
      enqueueSnackbar("Dashboard data could not be loaded. Check your connection.", { variant: "error" });
    }
  }, [isError]);

  const cards = [
    {
      title: "Total Revenue",
      value: stats ? `₹${Number(stats.revenue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—",
      subtext: `From ${stats?.orderCount || 0} orders`,
      color: "from-blue-600/30 to-blue-900/30",
      borderColor: "border-blue-500/40",
      textColor: "text-blue-400",
      icon: "💰"
    },
    {
      title: "Total Orders",
      value: stats?.orderCount ?? "—",
      subtext: `${stats?.completed || 0} completed`,
      color: "from-emerald-600/30 to-emerald-900/30",
      borderColor: "border-emerald-500/40",
      textColor: "text-emerald-400",
      icon: "📦"
    },
    {
      title: "In Kitchen / Active",
      value: stats?.inProgress ?? "—",
      subtext: "Currently cooking / ready",
      color: "from-amber-600/30 to-amber-900/30",
      borderColor: "border-amber-500/40",
      textColor: "text-amber-400",
      icon: "🔥"
    },
    {
      title: "Floor Tables",
      value: tables.length ? `${tables.filter((t) => t.status === "Available").length} / ${tables.length}` : "—",
      subtext: "Available tables right now",
      color: "from-purple-600/30 to-purple-900/30",
      borderColor: "border-purple-500/40",
      textColor: "text-purple-400",
      icon: "🍽️"
    },
    {
      title: "Menu Items",
      value: dishCount || "—",
      subtext: `In ${menus.length} categories`,
      color: "from-indigo-600/30 to-indigo-900/30",
      borderColor: "border-indigo-500/40",
      textColor: "text-indigo-400",
      icon: "📋"
    },
    {
      title: "Low Stock Items",
      value: lowStockItems.length,
      subtext: lowStockItems.length > 0 ? "Requires restock" : "All items in stock",
      color: lowStockItems.length > 0 ? "from-rose-600/30 to-rose-900/30" : "from-teal-600/30 to-teal-900/30",
      borderColor: lowStockItems.length > 0 ? "border-rose-500/40" : "border-teal-500/40",
      textColor: lowStockItems.length > 0 ? "text-rose-400" : "text-teal-400",
      icon: "⚠️"
    }
  ];

  // Daily sales chart calculation
  const dailySales = stats?.dailySales || [];
  const maxRevenue = Math.max(...dailySales.map((d) => d.revenue), 100);

  return (
    <div className="container mx-auto py-2 px-6 md:px-4 space-y-8">
      {/* Top Filter Bar */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-[#262626] p-5 rounded-2xl border border-zinc-800">
        <div>
          <h2 className="font-bold text-white text-xl flex items-center gap-2">
            <FaChartBar className="text-yellow-400" /> Restaurant Analytics & Performance
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time financial metrics, sales trends, inventory alerts, and popular dishes.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#1b1b1b] px-3 py-1.5 rounded-xl border border-zinc-700">
          <FaCalendarAlt className="text-yellow-400 text-xs" />
          <span className="text-xs text-zinc-400 font-medium">Period:</span>
          <select
            value={period}
            onChange={(event) => setPeriod(Number(event.target.value))}
            className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer"
          >
            {periods.map(({ label, days }) => (
              <option key={days} value={days} className="bg-[#1b1b1b] text-white">
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`bg-gradient-to-br ${card.color} border ${card.borderColor} rounded-2xl p-4 shadow-lg flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">{card.title}</span>
              <span className="text-lg">{card.icon}</span>
            </div>
            <div className="my-2">
              <p className={`text-2xl font-black ${card.textColor}`}>{card.value}</p>
            </div>
            <p className="text-[11px] text-zinc-400">{card.subtext}</p>
          </div>
        ))}
      </div>

      {/* Daily Sales Chart & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Sales Bar Chart */}
        <div className="lg:col-span-2 bg-[#262626] border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Daily Sales Trend</h3>
              <p className="text-xs text-zinc-400">Revenue per day across {period} days</p>
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800 flex items-center gap-1">
              <FaArrowUp size={10} /> Live Data
            </span>
          </div>

          {dailySales.length === 0 ? (
            <p className="text-xs text-zinc-500 py-12 text-center">No sales recorded in this period.</p>
          ) : (
            <div className="pt-4">
              {/* Bars container */}
              <div className="flex items-end justify-between gap-2 h-48 border-b border-zinc-700/80 pb-2">
                {dailySales.map((day, idx) => {
                  const heightPercent = Math.max(8, Math.round((day.revenue / maxRevenue) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-12 bg-zinc-900 border border-zinc-700 text-white text-[10px] rounded-lg p-1.5 px-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-10">
                        <strong className="text-yellow-400">{day.label}</strong>
                        <div>₹{day.revenue.toFixed(2)} ({day.orders} orders)</div>
                      </div>

                      {/* Bar */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[28px] bg-gradient-to-t from-yellow-500 to-amber-300 rounded-t-md transition-all group-hover:from-yellow-400 group-hover:to-amber-200 shadow-sm"
                      />
                    </div>
                  );
                })}
              </div>

              {/* X Axis Labels */}
              <div className="flex items-center justify-between pt-2 text-[10px] text-zinc-400">
                {dailySales.map((day, idx) => (
                  <span key={idx} className="truncate text-center flex-1">
                    {day.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Category Revenue Breakdown */}
        <div className="bg-[#262626] border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">Category Sales Share</h3>
            <p className="text-xs text-zinc-400 mb-4">Revenue breakdown by menu section</p>

            <div className="space-y-4">
              {(stats?.categorySales || []).map((cat, idx) => {
                const totalRev = stats?.revenue || 1;
                const percent = Math.min(100, Math.round((cat.revenue / totalRev) * 100));
                const colors = ["bg-yellow-400", "bg-emerald-400", "bg-sky-400", "bg-purple-400", "bg-rose-400"];
                const color = colors[idx % colors.length];

                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                        <span>{cat.icon || "🍽️"}</span> {cat.category}
                      </span>
                      <span className="text-zinc-400">
                        ₹{cat.revenue.toFixed(2)} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#1b1b1b] h-2 rounded-full overflow-hidden">
                      <div style={{ width: `${percent}%` }} className={`h-full ${color} rounded-full`} />
                    </div>
                  </div>
                );
              })}
              {(!stats?.categorySales || stats.categorySales.length === 0) && (
                <p className="text-xs text-zinc-500 py-6 text-center">Place orders to view category distribution.</p>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800 text-[11px] text-zinc-400 flex justify-between">
            <span>GST Rate: <strong>5.25%</strong></span>
            <span>Tax Collected: <strong>₹{((stats?.revenue || 0) * 0.05).toFixed(2)}</strong></span>
          </div>
        </div>
      </div>

      {/* Popular Dishes & Low Stock Indicator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Dishes */}
        <div className="bg-[#262626] border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-base font-bold text-white tracking-wide mb-1">🔥 Top Selling Dishes</h3>
          <p className="text-xs text-zinc-400 mb-4">Most ordered menu items in this period</p>

          <div className="space-y-2.5">
            {(stats?.popularItems || []).slice(0, 5).map((dish, idx) => (
              <div
                key={dish._id || idx}
                className="flex items-center justify-between p-3 bg-[#1e1e1e] rounded-xl border border-zinc-800"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-yellow-400/20 text-yellow-400 font-black text-xs flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 className="text-white text-xs font-bold">{dish.name}</h4>
                    <p className="text-zinc-400 text-[11px]">{dish.quantity} portions served</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-yellow-400">
                  ₹{Number(dish.revenue || 0).toFixed(2)}
                </span>
              </div>
            ))}
            {(!stats?.popularItems || stats.popularItems.length === 0) && (
              <p className="text-xs text-zinc-500 py-6 text-center">No dishes sold yet in this period.</p>
            )}
          </div>
        </div>

        {/* Low-Stock & Out-of-Stock Alert Widget */}
        <div className="bg-[#262626] border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              <FaBoxes className="text-yellow-400" /> Inventory & Stock Alerts
            </h3>
            {lowStockItems.length > 0 && (
              <span className="text-[11px] font-bold bg-rose-950 text-rose-400 border border-rose-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <FaExclamationTriangle size={10} /> {lowStockItems.length} Low
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mb-4">Live inventory tracking with 1-click restock</p>

          <div className="space-y-2.5">
            {lowStockItems.slice(0, 4).map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between p-3 bg-[#1e1e1e] rounded-xl border border-zinc-800"
              >
                <div>
                  <h4 className="text-white text-xs font-bold flex items-center gap-1.5">
                    {item.name}
                    {item.isOutOfStock ? (
                      <span className="text-[9px] bg-rose-900/80 text-rose-300 font-bold px-1.5 py-0.5 rounded">
                        OUT OF STOCK
                      </span>
                    ) : (
                      <span className="text-[9px] bg-amber-900/80 text-amber-300 font-bold px-1.5 py-0.5 rounded">
                        LOW STOCK
                      </span>
                    )}
                  </h4>
                  <p className="text-zinc-400 text-[11px]">
                    Remaining: <strong className="text-white">{item.stockQuantity} units</strong> (Threshold: {item.lowStockThreshold})
                  </p>
                </div>
                <button
                  onClick={() => restockMutation.mutate({ id: item._id, delta: 25 })}
                  disabled={restockMutation.isPending}
                  className="px-3 py-1.5 text-xs font-bold bg-yellow-400 hover:bg-yellow-500 text-zinc-950 rounded-lg transition-all shadow-sm active:scale-95"
                >
                  +25 Restock
                </button>
              </div>
            ))}

            {lowStockItems.length === 0 && (
              <div className="p-6 text-center bg-[#1e1e1e] rounded-xl border border-zinc-800">
                <p className="text-xs text-emerald-400 font-bold">✅ All dishes are well stocked!</p>
                <p className="text-[11px] text-zinc-500 mt-1">Stock levels automatically decrement when orders are placed.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Metrics;
