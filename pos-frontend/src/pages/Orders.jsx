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

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-[#1f1f1f] pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 md:px-10 py-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">
            Orders
          </h1>
        </div>
        <div className="flex flex-wrap items-center justify-around gap-1">
          <button onClick={() => setStatus("all")} className={`text-[#ababab] text-lg ${status === "all" && "bg-[#383838] rounded-lg px-5 py-2"}  rounded-lg px-5 py-2 font-semibold`}>
            All
          </button>
          <button onClick={() => setStatus("progress")} className={`text-[#ababab] text-lg ${status === "progress" && "bg-[#383838] rounded-lg px-5 py-2"}  rounded-lg px-5 py-2 font-semibold`}>
            In Progress
          </button>
          <button onClick={() => setStatus("ready")} className={`text-[#ababab] text-lg ${status === "ready" && "bg-[#383838] rounded-lg px-5 py-2"}  rounded-lg px-5 py-2 font-semibold`}>
            Ready
          </button>
          <button onClick={() => setStatus("completed")} className={`text-[#ababab] text-lg ${status === "completed" && "bg-[#383838] rounded-lg px-5 py-2"}  rounded-lg px-5 py-2 font-semibold`}>
            Completed
          </button>
        </div>
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
