import { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import OrderList from "./OrderList";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { getOrders } from "../../https/index";
import { Link } from "react-router-dom";

const RecentOrders = () => {
  const [search, setSearch] = useState("");
  const { data: resData, isError, error } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      return await getOrders();
    },
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (isError) enqueueSnackbar(error.response?.data?.message || "Recent orders could not be loaded.", { variant: "error" });
  }, [isError, error]);

  return (
    <div className="px-8 mt-6">
      <div className="bg-[#1a1a1a] w-full rounded-lg">
        <div className="flex justify-between items-center px-6 py-4">
          <h1 className="text-[#f5f5f5] text-lg font-semibold tracking-wide">
            Recent Orders
          </h1>
          <Link to="/orders" className="text-[#025cca] text-sm font-semibold">
            View all
          </Link>
        </div>

        <div className="flex items-center gap-4 bg-[#1f1f1f] rounded-[15px] px-6 py-4 mx-6">
          <FaSearch className="text-[#f5f5f5]" />
          <input
            type="text"
            placeholder="Search recent orders"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="bg-[#1f1f1f] outline-none text-[#f5f5f5]"
          />
        </div>

        {/* Order list */}
        <div className="mt-4 px-6 pb-4">
          {resData?.data?.data?.length > 0 ? (
            resData.data.data.filter((order) =>
              order.customerDetails?.name?.toLowerCase().includes(search.toLowerCase())
            ).length > 0 ? (
              resData.data.data
                .filter((order) =>
                  order.customerDetails?.name?.toLowerCase().includes(search.toLowerCase())
                )
                .map((order) => <OrderList key={order._id} order={order} />)
            ) : (
              <p className="text-gray-500">No matching orders.</p>
            )
          ) : (
            <p className="text-gray-500">No orders available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentOrders;
