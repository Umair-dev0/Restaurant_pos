import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { getMenu, getOrderStats, getTables } from "../../https";

const periods = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 }
];

const Metrics = () => {
  const [period, setPeriod] = useState(30);
  const statsQuery = useQuery({
    queryKey: ["orderStats", period],
    queryFn: () => getOrderStats(period)
  });
  const tablesQuery = useQuery({ queryKey: ["tables"], queryFn: getTables });
  const menuQuery = useQuery({ queryKey: ["menu"], queryFn: getMenu });
  const stats = statsQuery.data?.data?.data;
  const tables = tablesQuery.data?.data?.data ?? [];
  const menus = menuQuery.data?.data?.data ?? [];
  const dishCount = menus.reduce((count, category) => count + category.items.length, 0);

  const isError = statsQuery.isError || tablesQuery.isError || menuQuery.isError;
  useEffect(() => {
    if (isError) {
    enqueueSnackbar("Dashboard data could not be loaded. Check your connection.", { variant: "error" });
    }
  }, [isError]);

  const cards = [
    { title: "Revenue", value: stats ? `₹${stats.revenue.toFixed(2)}` : "—", color: "#025cca" },
    { title: "Orders", value: stats?.orderCount ?? "—", color: "#02ca3a" },
    { title: "Active Orders", value: stats?.inProgress ?? "—", color: "#f6b100" },
    { title: "Tables", value: tablesQuery.isSuccess ? tables.length : "—", color: "#7f167f" },
    { title: "Categories", value: menuQuery.isSuccess ? menus.length : "—", color: "#5b45b0" },
    { title: "Dishes", value: menuQuery.isSuccess ? dishCount : "—", color: "#285430" }
  ];

  return (
    <div className="container mx-auto py-2 px-6 md:px-4">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="font-semibold text-[#f5f5f5] text-xl">Restaurant performance</h2>
          <p className="text-sm text-[#ababab]">Live totals from your saved orders, tables, and menu.</p>
        </div>
        <label className="flex items-center gap-2 text-[#f5f5f5]">
          <span className="sr-only">Reporting period</span>
          <select
            value={period}
            onChange={(event) => setPeriod(Number(event.target.value))}
            className="px-4 py-2 rounded-md bg-[#1a1a1a]"
          >
            {periods.map(({ label, days }) => <option key={days} value={days}>{label}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.title} className="shadow-sm rounded-lg p-4" style={{ backgroundColor: card.color }}>
            <p className="font-medium text-sm text-[#f5f5f5]">{card.title}</p>
            <p className="mt-2 font-semibold text-2xl text-[#f5f5f5]">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Metrics;
