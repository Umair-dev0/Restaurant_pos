import { useQuery } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { useEffect } from "react";
import { getOrders } from "../../https";
import { formatDateAndTime } from "../../utils";

const Payments = () => {
  const { data: response, isLoading, isError, error } = useQuery({
    queryKey: ["orders"],
    queryFn: getOrders
  });
  const orders = response?.data?.data ?? [];

  useEffect(() => {
    if (isError) {
      enqueueSnackbar(error.response?.data?.message || "Payment history could not be loaded.", { variant: "error" });
    }
  }, [isError, error]);

  if (isLoading) return <p className="p-6 text-[#ababab]">Loading payment history...</p>;

  return (
    <div className="container mx-auto overflow-x-auto rounded-lg bg-[#262626] p-4">
      <h2 className="mb-4 text-xl font-semibold text-white">Payment history</h2>
      <table className="w-full text-left text-white">
        <thead className="bg-[#333] text-[#ababab]">
          <tr>
            <th className="p-3">Date</th>
            <th className="p-3">Customer</th>
            <th className="p-3">Method</th>
            <th className="p-3">Order status</th>
            <th className="p-3">Amount</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order._id} className="border-t border-gray-600">
              <td className="p-3">{formatDateAndTime(order.orderDate)}</td>
              <td className="p-3">{order.customerDetails?.name}</td>
              <td className="p-3">{order.paymentMethod}</td>
              <td className="p-3">{order.orderStatus}</td>
              <td className="p-3">₹{Number(order.bills?.totalWithTax ?? 0).toFixed(2)}</td>
            </tr>
          ))}
          {!orders.length && <tr><td className="p-3 text-[#ababab]" colSpan="5">No payment records yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
};

export default Payments;
