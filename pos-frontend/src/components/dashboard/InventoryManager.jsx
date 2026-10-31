import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getInventory, updateStock } from "../../https";
import { enqueueSnackbar } from "notistack";
import { FaBoxes, FaExclamationTriangle, FaCheck, FaSearch } from "react-icons/fa";

const InventoryManager = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // 'all' | 'low' | 'out'

  const { data: invData, isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => getInventory()
  });

  const items = invData?.data?.data || [];
  const summary = invData?.data?.summary || { totalItems: 0, lowStockCount: 0, outOfStockCount: 0 };

  const restockMutation = useMutation({
    mutationFn: ({ id, delta, quantity }) => updateStock(id, { delta, quantity }),
    onSuccess: (res) => {
      enqueueSnackbar(res.data?.message || "Inventory updated!", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    },
    onError: (err) => {
      enqueueSnackbar(err.response?.data?.message || "Stock update failed.", { variant: "error" });
    }
  });

  const filteredItems = items
    .filter((itm) => {
      if (filter === "low") return itm.isLowStock;
      if (filter === "out") return itm.isOutOfStock;
      return true;
    })
    .filter((itm) =>
      itm.name.toLowerCase().includes(search.toLowerCase()) ||
      itm.categoryName.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="container mx-auto py-2 px-6 md:px-4 space-y-6">
      {/* Top Banner & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#262626] p-5 rounded-2xl border border-zinc-800">
        <div>
          <h2 className="font-bold text-white text-xl flex items-center gap-2">
            <FaBoxes className="text-yellow-400" /> Kitchen Inventory & Stock Control
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Portion tracking for dishes. Automatically decreases as customer orders are placed.
          </p>
        </div>

        {/* Quick KPI stats */}
        <div className="flex items-center gap-3">
          <div className="bg-[#1b1b1b] px-3.5 py-2 rounded-xl border border-zinc-800 text-center">
            <span className="block text-[10px] uppercase text-zinc-400 font-bold">Total Dishes</span>
            <span className="text-sm font-black text-white">{summary.totalItems}</span>
          </div>
          <div className="bg-[#1b1b1b] px-3.5 py-2 rounded-xl border border-amber-900/40 text-center">
            <span className="block text-[10px] uppercase text-amber-400 font-bold">Low Stock (&lt;10)</span>
            <span className="text-sm font-black text-amber-400">{summary.lowStockCount}</span>
          </div>
          <div className="bg-[#1b1b1b] px-3.5 py-2 rounded-xl border border-rose-900/40 text-center">
            <span className="block text-[10px] uppercase text-rose-400 font-bold">Out of Stock</span>
            <span className="text-sm font-black text-rose-400">{summary.outOfStockCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#262626] p-4 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-2">
          {[
            { key: "all", label: `All Items (${items.length})` },
            { key: "low", label: `Low Stock (${items.filter((i) => i.isLowStock).length})` },
            { key: "out", label: `Out of Stock (${items.filter((i) => i.isOutOfStock).length})` }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                filter === tab.key
                  ? "bg-yellow-400 text-zinc-950 font-bold shadow"
                  : "bg-zinc-800/80 text-zinc-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-[#1b1b1b] px-3 py-2 rounded-xl border border-zinc-700/80 w-full sm:w-64">
          <FaSearch className="text-zinc-500 text-xs" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu dish..."
            className="bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none w-full"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="overflow-x-auto bg-[#262626] rounded-2xl border border-zinc-800 shadow-xl">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-[#1b1b1b] text-zinc-400 uppercase text-[11px] font-semibold border-b border-zinc-800">
            <tr>
              <th className="p-4">Dish Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Price</th>
              <th className="p-4">Current Stock</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Quick Restock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-zinc-500">Loading inventory...</td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-zinc-500">No dishes match your filter.</td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item._id} className="hover:bg-[#2b2b2b]/60 transition-colors">
                  <td className="p-4 font-bold text-white text-sm">{item.name}</td>
                  <td className="p-4 text-zinc-400">{item.categoryName}</td>
                  <td className="p-4 text-zinc-300 font-semibold">₹{Number(item.price).toFixed(2)}</td>
                  <td className="p-4">
                    <span className="text-base font-black text-white">{item.stockQuantity}</span>{" "}
                    <span className="text-zinc-500 text-[11px]">units</span>
                  </td>
                  <td className="p-4">
                    {item.isOutOfStock ? (
                      <span className="inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-1 rounded-full bg-rose-950/80 text-rose-400 border border-rose-800">
                        <FaExclamationTriangle size={10} /> Out of Stock
                      </span>
                    ) : item.isLowStock ? (
                      <span className="inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-400 border border-amber-800">
                        <FaExclamationTriangle size={10} /> Low Stock (&lt;10)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                        <FaCheck size={9} /> Sufficient
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => restockMutation.mutate({ id: item._id, delta: 10 })}
                      disabled={restockMutation.isPending}
                      className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-lg text-xs transition-colors"
                    >
                      +10
                    </button>
                    <button
                      onClick={() => restockMutation.mutate({ id: item._id, delta: 25 })}
                      disabled={restockMutation.isPending}
                      className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-zinc-950 font-bold rounded-lg text-xs transition-colors shadow-sm active:scale-95"
                    >
                      +25 Units
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryManager;
