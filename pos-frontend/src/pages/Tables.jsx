import { useState, useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import BackButton from "../components/shared/BackButton";
import TableCard from "../components/tables/TableCard";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getTables } from "../https";
import { enqueueSnackbar } from "notistack";
import { useSelector } from "react-redux";

const Tables = () => {
  const [status, setStatus] = useState("all");
  const guests = useSelector((state) => state.customer.guests);

    useEffect(() => {
      document.title = "POS | Tables"
    }, [])

  const { data: resData, isError, error } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => {
      return await getTables();
    },
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (isError) enqueueSnackbar(error.response?.data?.message || "Tables could not be loaded.", { variant: "error" });
  }, [isError, error]);

  const tables = resData?.data?.data ?? [];
  const filteredTables = status === "booked"
    ? tables.filter((table) => table.status === "Booked")
    : tables;

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-[#1f1f1f] pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 md:px-10 py-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">
            Tables
          </h1>
        </div>
        <div className="flex items-center justify-around gap-4">
          <button
            onClick={() => setStatus("all")}
            className={`text-[#ababab] text-lg ${
              status === "all" && "bg-[#383838] rounded-lg px-5 py-2"
            }  rounded-lg px-5 py-2 font-semibold`}
          >
            All
          </button>
          <button
            onClick={() => setStatus("booked")}
            className={`text-[#ababab] text-lg ${
              status === "booked" && "bg-[#383838] rounded-lg px-5 py-2"
            }  rounded-lg px-5 py-2 font-semibold`}
          >
            Booked
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-3 px-4 md:px-10 py-4">
        {filteredTables.map((table) => {
          return (
            <TableCard
              key={table._id}
              id={table._id}
              name={table.tableNo}
              status={table.status}
              initials={table?.currentOrder?.customerDetails?.name}
              seats={table.seats}
              guests={guests || 1}
            />
          );
        })}
        {filteredTables.length === 0 && (
          <p className="text-gray-500">No tables match this status.</p>
        )}
      </div>

      <BottomNav />
    </section>
  );
};

export default Tables;
