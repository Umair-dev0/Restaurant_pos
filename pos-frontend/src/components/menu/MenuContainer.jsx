import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { GrRadialSelected } from "react-icons/gr";
import { FaShoppingCart } from "react-icons/fa";
import { getMenu } from "../../https";
import { useDispatch, useSelector } from "react-redux";
import { addItems, decrementItem } from "../../redux/slices/cartSlice";

const MenuContainer = () => {
  const [selectedMenuId, setSelectedMenuId] = useState("");
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart);
  const { data: response, isLoading, isError } = useQuery({
    queryKey: ["menu"],
    queryFn: getMenu
  });
  const menus = response?.data?.data ?? [];
  const selected = menus.find((menu) => menu._id === selectedMenuId) ?? menus[0];

  const increment = (itemId) => {
    const item = selected?.items.find((menuItem) => menuItem._id === itemId);
    if (!item) return;

    dispatch(addItems({
      id: item._id,
      menuItemId: item._id,
      name: item.name,
      pricePerQuantity: Number(item.price),
      quantity: 1,
      price: Number(item.price)
    }));
  };
  const decrement = (itemId) => {
    dispatch(decrementItem(itemId));
  };

  const handleAddToCart = (item) => {
    dispatch(addItems({
      id: item._id,
      menuItemId: item._id,
      name: item.name,
      pricePerQuantity: Number(item.price),
      quantity: 1,
      price: Number(item.price)
    }));
    enqueueSnackbar(`${item.name} added to cart.`, { variant: "success" });
  };

  if (isLoading) return <p className="px-10 py-6 text-[#ababab]">Loading menu…</p>;
  if (isError) return <p className="px-10 py-6 text-red-400">Could not load the menu. Check the server connection and try again.</p>;
  if (!menus.length) return <p className="px-10 py-6 text-[#ababab]">No menu categories yet. An administrator can add them from the dashboard.</p>;

  return (
    <>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 px-4 md:px-10 py-4 w-full">
        {menus.map((menu) => (
          <button
            type="button"
            key={menu._id}
            className="flex flex-col items-start justify-between p-4 rounded-lg min-h-[100px] text-left"
            style={{ backgroundColor: menu.bgColor }}
            onClick={() => setSelectedMenuId(menu._id)}
          >
            <span className="flex items-center justify-between w-full text-[#f5f5f5] text-lg font-semibold">
              <span>{menu.icon} {menu.name}</span>
              {selected?._id === menu._id && <GrRadialSelected size={20} />}
            </span>
            <span className="text-[#e0e0e0] text-sm font-semibold">
              {menu.items.length} Items
            </span>
          </button>
        ))}
      </div>

      <hr className="border-[#2a2a2a] border-t-2 mt-4" />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 px-4 md:px-10 py-4 w-full">
        {selected?.items.map((item) => {
          const isOutOfStock = item.stockQuantity !== undefined && item.stockQuantity <= 0;
          const isLowStock = item.stockQuantity !== undefined && item.stockQuantity > 0 && item.stockQuantity <= 10;

          return (
            <div
              key={item._id}
              className={`flex flex-col items-start justify-between p-4 rounded-xl min-h-[160px] bg-[#1a1a1a] border border-zinc-800/80 transition-all ${
                isOutOfStock ? "opacity-60" : "hover:border-zinc-700"
              }`}
            >
              <div className="flex items-start justify-between w-full gap-3">
                <div>
                  <h2 className="text-[#f5f5f5] text-base font-bold leading-tight">{item.name}</h2>
                  <div className="mt-1">
                    {isOutOfStock ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-800">
                        Out of Stock
                      </span>
                    ) : isLowStock ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800 animate-pulse">
                        Low Stock: {item.stockQuantity} left
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-500 font-medium">
                        {item.category || "Available"}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => handleAddToCart(item)}
                  className={`p-2 rounded-xl transition-all ${
                    isOutOfStock
                      ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                      : "bg-[#2e4a40] hover:bg-[#395e52] text-[#02ca3a] active:scale-95 shadow-sm"
                  }`}
                  aria-label={`Add one ${item.name} to cart`}
                >
                  <FaShoppingCart size={17} />
                </button>
              </div>

              <div className="flex items-center justify-between w-full gap-3 mt-4">
                <p className="text-[#f5f5f5] text-lg font-black">₹{Number(item.price).toFixed(2)}</p>
                <div className="flex items-center justify-between bg-[#1f1f1f] px-3 py-1.5 rounded-xl gap-3 border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => decrement(item._id)}
                    aria-label={`Remove one ${item.name}`}
                    className="text-yellow-500 hover:text-yellow-400 text-xl font-black px-1"
                  >
                    −
                  </button>
                  <span className="text-white font-bold text-sm min-w-[16px] text-center">
                    {cartItems.find((cartItem) => cartItem.menuItemId === item._id)?.quantity ?? 0}
                  </span>
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => increment(item._id)}
                    aria-label={`Add one ${item.name}`}
                    className="text-yellow-500 hover:text-yellow-400 text-xl font-black px-1 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {!selected?.items.length && <p className="text-[#ababab]">No dishes in this category yet.</p>}
      </div>
    </>
  );
};

export default MenuContainer;
