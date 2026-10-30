import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTotalPrice, removeAllItems } from "../../redux/slices/cartSlice";
import { removeCustomer } from "../../redux/slices/customerSlice";
import {
  addOrder,
  createOrderRazorpay,
  getMenu,
  getOrderQuote,
  verifyPaymentRazorpay
} from "../../https";
import { enqueueSnackbar } from "notistack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Invoice from "../invoice/Invoice";

const getErrorMessage = (error) =>
  error.response?.data?.message || error.message || "The order could not be completed.";

const Bill = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const customerData = useSelector((state) => state.customer);
  const cartData = useSelector((state) => state.cart);
  const localSubtotal = useSelector(getTotalPrice);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isPaymentInProgress, setIsPaymentInProgress] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [orderInfo, setOrderInfo] = useState(null);
  const orderItems = useMemo(
    () => cartData.map(({ menuItemId, quantity }) => ({ menuItemId, quantity })),
    [cartData]
  );
  const menuQuery = useQuery({ queryKey: ["menu"], queryFn: getMenu });
  const quoteQuery = useQuery({
    queryKey: ["orderQuote", orderItems],
    queryFn: () => getOrderQuote({ items: orderItems }),
    enabled: orderItems.length > 0
  });
  const quote = quoteQuery.data?.data?.data;
  const subtotal = quote?.bills?.total ?? localSubtotal;
  const tax = quote?.bills?.tax ?? 0;
  const totalWithTax = quote?.bills?.totalWithTax ?? subtotal;
  const taxRate = quoteQuery.data?.data?.taxRate ?? menuQuery.data?.data?.taxRate ?? 0;

  useEffect(() => {
    if (quoteQuery.isError) {
      enqueueSnackbar(getErrorMessage(quoteQuery.error), { variant: "error" });
    }
  }, [quoteQuery.isError, quoteQuery.error]);

  const orderMutation = useMutation({
    mutationFn: addOrder,
    onSuccess: (response) => {
      const order = response.data.data;
      setOrderInfo(order);
      setShowInvoice(true);
      setIsPaymentInProgress(false);
      setPaymentMethod("");
      dispatch(removeCustomer());
      dispatch(removeAllItems());
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["orderStats"] });
      enqueueSnackbar("Order placed successfully.", { variant: "success" });
    },
    onError: (error) => {
      setIsPaymentInProgress(false);
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    }
  });

  const submitOrder = (paymentData) => orderMutation.mutate({
    customerDetails: {
      name: customerData.customerName,
      phone: customerData.customerPhone,
      guests: customerData.guests
    },
    items: orderItems,
    table: customerData.table?.tableId,
    paymentMethod,
    ...(paymentData ? { paymentData } : {})
  });

  const handlePlaceOrder = async () => {
    if (!customerData.customerName || !customerData.table?.tableId) {
      enqueueSnackbar("Start an order and select a table before placing it.", { variant: "warning" });
      return;
    }
    if (!cartData.length) {
      enqueueSnackbar("Add at least one dish to the cart.", { variant: "warning" });
      return;
    }
    if (!paymentMethod) {
      enqueueSnackbar("Select a payment method.", { variant: "warning" });
      return;
    }
    if (quoteQuery.isLoading || quoteQuery.isError || !quote) {
      enqueueSnackbar("The current order total is not ready yet. Please try again.", { variant: "warning" });
      return;
    }

    if (paymentMethod === "Cash") {
      submitOrder();
      return;
    }

    setIsPaymentInProgress(true);
    try {
      const { data } = await createOrderRazorpay({
        items: orderItems,
        tableId: customerData.table.tableId,
        guests: customerData.guests
      });
      if (!window.Razorpay || !data.keyId) {
        throw new Error("Online payments are unavailable. Check Razorpay configuration.");
      }

      const checkout = new window.Razorpay({
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "RESTRO",
        description: "Secure payment for your meal",
        order_id: data.order.id,
        prefill: {
          name: customerData.customerName,
          contact: customerData.customerPhone
        },
        theme: { color: "#025cca" },
        modal: {
          ondismiss: () => setIsPaymentInProgress(false)
        },
        handler: async (paymentResponse) => {
          try {
            await verifyPaymentRazorpay(paymentResponse);
            submitOrder(paymentResponse);
          } catch (error) {
            setIsPaymentInProgress(false);
            enqueueSnackbar(getErrorMessage(error), { variant: "error" });
          }
        }
      });

      checkout.on("payment.failed", (event) => {
        setIsPaymentInProgress(false);
        enqueueSnackbar(event.error?.description || "Payment failed. Please try again.", { variant: "error" });
      });
      checkout.open();
    } catch (error) {
      setIsPaymentInProgress(false);
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    }
  };

  const isSubmitting = orderMutation.isPending || isPaymentInProgress;

  return (
    <>
      <div className="flex items-center justify-between px-5 mt-2">
        <p className="text-xs text-[#ababab] font-medium mt-2">Items ({cartData.length})</p>
        <p className="text-[#f5f5f5] text-md font-bold">₹{subtotal.toFixed(2)}</p>
      </div>
      <div className="flex items-center justify-between px-5 mt-2">
        <p className="text-xs text-[#ababab] font-medium mt-2">Tax ({taxRate}%)</p>
        <p className="text-[#f5f5f5] text-md font-bold">₹{tax.toFixed(2)}</p>
      </div>
      <div className="flex items-center justify-between px-5 mt-2">
        <p className="text-xs text-[#ababab] font-medium mt-2">Total with tax</p>
        <p className="text-[#f5f5f5] text-md font-bold">₹{totalWithTax.toFixed(2)}</p>
      </div>
      {quoteQuery.isFetching && cartData.length > 0 && (
        <p className="px-5 mt-2 text-xs text-[#ababab]">Updating order total…</p>
      )}
      <div className="flex items-center gap-3 px-5 mt-4">
        {["Cash", "Online"].map((method) => (
          <button
            key={method}
            type="button"
            onClick={() => setPaymentMethod(method)}
            disabled={isSubmitting}
            className={`bg-[#1f1f1f] px-4 py-3 w-full rounded-lg text-[#ababab] font-semibold disabled:opacity-50 ${
              paymentMethod === method ? "bg-[#383737]" : ""
            }`}
          >
            {method}
          </button>
        ))}
      </div>
      <div className="px-5 mt-4">
        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={isSubmitting || !cartData.length || quoteQuery.isLoading || quoteQuery.isError}
          className="bg-[#f6b100] px-4 py-3 w-full rounded-lg text-[#1f1f1f] font-semibold text-lg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Processing..." : "Place Order"}
        </button>
      </div>
      {showInvoice && orderInfo && (
        <Invoice orderInfo={orderInfo} setShowInvoice={setShowInvoice} />
      )}
    </>
  );
};

export default Bill;
