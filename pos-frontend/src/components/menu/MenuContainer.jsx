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
        {selected?.items.map((item) => (
          <div
            key={item._id}
            className="flex flex-col items-start justify-between p-4 rounded-lg min-h-[150px] bg-[#1a1a1a]"
          >
            <div className="flex items-start justify-between w-full gap-3">
              <h2 className="text-[#f5f5f5] text-lg font-semibold">{item.name}</h2>
              <button
                type="button"
                onClick={() => handleAddToCart(item)}
                className="bg-[#2e4a40] text-[#02ca3a] p-2 rounded-lg"
                aria-label={`Add one ${item.name} to cart`}
              >
                <FaShoppingCart size={20} />
              </button>
            </div>
            <div className="flex items-center justify-between w-full gap-3">
              <p className="text-[#f5f5f5] text-xl font-bold">₹{Number(item.price).toFixed(2)}</p>
              <div className="flex items-center justify-between bg-[#1f1f1f] px-3 py-2 rounded-lg gap-4">
                <button type="button" onClick={() => decrement(item._id)} aria-label={`Remove one ${item.name}`} className="text-yellow-500 text-2xl">−</button>
                <span className="text-white">
                  {cartItems.find((cartItem) => cartItem.menuItemId === item._id)?.quantity ?? 0}
                </span>
                <button type="button" onClick={() => increment(item._id)} aria-label={`Add one ${item.name}`} className="text-yellow-500 text-2xl">+</button>
              </div>
            </div>
          </div>
        ))}
        {!selected?.items.length && <p className="text-[#ababab]">No dishes in this category yet.</p>}
      </div>
    </>
  );
};

export default MenuContainer;
