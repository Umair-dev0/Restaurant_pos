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
import { FaQrcode, FaCreditCard, FaMobileAlt, FaTimes, FaCheckCircle } from "react-icons/fa";

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
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoOrderData, setDemoOrderData] = useState(null);

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
      setShowDemoModal(false);
      setPaymentMethod("");
      dispatch(removeCustomer());
      dispatch(removeAllItems());
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["orderStats"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      enqueueSnackbar("Order placed successfully!", { variant: "success" });
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

    // Online Payment Flow (Razorpay or Demo UPI Simulator)
    setIsPaymentInProgress(true);
    try {
      const { data } = await createOrderRazorpay({
        items: orderItems,
        tableId: customerData.table.tableId,
        guests: customerData.guests
      });

      // If in Demo mode or window.Razorpay not loaded, use the built-in Demo UPI / Card Simulator
      if (data.isDemo || !window.Razorpay || !data.keyId || data.keyId.startsWith("demo_")) {
        setDemoOrderData(data);
        setShowDemoModal(true);
        setIsPaymentInProgress(false);
        return;
      }

      const checkout = new window.Razorpay({
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "RESTRO FINE DINING",
        description: "Payment for order",
        order_id: data.order.id,
        prefill: {
          name: customerData.customerName,
          contact: customerData.customerPhone
        },
        theme: { color: "#f6b100" },
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

  const handleConfirmDemoPayment = async () => {
    if (!demoOrderData) return;
    setIsPaymentInProgress(true);
    try {
      const demoPaymentResponse = {
        razorpay_order_id: demoOrderData.order.id,
        razorpay_payment_id: `pay_demo_${Date.now()}`,
        razorpay_signature: "demo_signature_valid"
      };
      await verifyPaymentRazorpay(demoPaymentResponse);
      submitOrder(demoPaymentResponse);
    } catch (err) {
      setIsPaymentInProgress(false);
      enqueueSnackbar(getErrorMessage(err), { variant: "error" });
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
        <p className="text-[#f5f5f5] text-md font-bold text-yellow-400">₹{totalWithTax.toFixed(2)}</p>
      </div>
      {quoteQuery.isFetching && cartData.length > 0 && (
        <p className="px-5 mt-2 text-xs text-[#ababab]">Updating order total…</p>
      )}

      {/* Payment Method Selector */}
      <div className="flex items-center gap-3 px-5 mt-4">
        {[
          { key: "Cash", label: "💵 Cash" },
          { key: "Online", label: "📲 Online / UPI" }
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setPaymentMethod(key)}
            disabled={isSubmitting}
            className={`border px-4 py-2.5 w-full rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${
              paymentMethod === key
                ? "bg-yellow-400 text-zinc-950 border-yellow-400 shadow-md"
                : "bg-[#1f1f1f] text-zinc-300 border-zinc-800 hover:border-zinc-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="px-5 mt-4">
        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={isSubmitting || !cartData.length || quoteQuery.isLoading || quoteQuery.isError}
          className="bg-yellow-400 hover:bg-yellow-500 px-4 py-3 w-full rounded-xl text-zinc-950 font-black text-base shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Processing Order..." : `Place Order (₹${totalWithTax.toFixed(2)})`}
        </button>
      </div>

      {/* Demo Online Payment Simulator Modal */}
      {showDemoModal && demoOrderData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#242424] text-white rounded-2xl max-w-sm w-full border border-zinc-800 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 text-lg">📲</span>
                <h3 className="font-bold text-sm">Demo Online Payment Gateway</h3>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <FaTimes size={16} />
              </button>
            </div>

            <div className="p-5 text-center space-y-4">
              <div className="bg-[#1a1a1a] p-3 rounded-xl border border-zinc-800">
                <p className="text-[11px] text-zinc-400">Payable Amount</p>
                <p className="text-2xl font-black text-yellow-400">₹{totalWithTax.toFixed(2)}</p>
                <p className="text-[10px] text-zinc-500">Order ID: {demoOrderData.order.id}</p>
              </div>

              {/* Supported payment simulator options */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-[#1e1e1e] border border-zinc-700/60 p-2.5 rounded-xl text-center">
                  <FaMobileAlt className="text-emerald-400 mx-auto mb-1 text-base" />
                  <span className="text-[10px] block font-semibold text-zinc-300">GPay / UPI</span>
                </div>
                <div className="bg-[#1e1e1e] border border-zinc-700/60 p-2.5 rounded-xl text-center">
                  <FaQrcode className="text-sky-400 mx-auto mb-1 text-base" />
                  <span className="text-[10px] block font-semibold text-zinc-300">Paytm / QR</span>
                </div>
                <div className="bg-[#1e1e1e] border border-zinc-700/60 p-2.5 rounded-xl text-center">
                  <FaCreditCard className="text-purple-400 mx-auto mb-1 text-base" />
                  <span className="text-[10px] block font-semibold text-zinc-300">Debit Card</span>
                </div>
              </div>

              <p className="text-xs text-zinc-400">
                💡 <strong className="text-white">College Demo Mode:</strong> No live Razorpay credentials required. Click below to simulate an instant successful online UPI payment.
              </p>

              <button
                type="button"
                onClick={handleConfirmDemoPayment}
                disabled={isPaymentInProgress}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                <FaCheckCircle /> {isPaymentInProgress ? "Verifying..." : `Simulate Successful Payment (₹${totalWithTax.toFixed(2)})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {showInvoice && orderInfo && (
        <Invoice orderInfo={orderInfo} setShowInvoice={setShowInvoice} />
      )}
    </>
  );
};

export default Bill;
