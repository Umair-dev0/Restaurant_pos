import { useState } from "react";
import { FaHome } from "react-icons/fa";
import { MdOutlineReorder, MdTableBar } from "react-icons/md";
import { CiCircleMore } from "react-icons/ci";
import { BiSolidDish } from "react-icons/bi";
import { useNavigate, useLocation } from "react-router-dom";
import Modal from "./Modal";
import { useDispatch, useSelector } from "react-redux";
import { setCustomer } from "../../redux/slices/customerSlice";
import { enqueueSnackbar } from "notistack";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [guestCount, setGuestCount] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const increment = () => {
    setGuestCount((prev) => prev + 1);
  }
  const decrement = () => {
    if(guestCount <= 1) return;
    setGuestCount((prev) => prev - 1);
  }

  const isActive = (path) => location.pathname === path;

  const handleCreateOrder = () => {
    if (!name.trim() || !phone.trim()) {
      enqueueSnackbar("Enter the customer name and phone number.", { variant: "warning" });
      return;
    }

    // send the data to store
    dispatch(setCustomer({ name: name.trim(), phone: phone.trim(), guests: guestCount }));
    closeModal();
    navigate("/tables");
  }

  const { role } = useSelector((state) => state.user);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#1c1c1c] border-t border-zinc-800 p-2 h-16 flex justify-around items-center">
      <button
        onClick={() => navigate("/")}
        className={`flex items-center justify-center font-bold text-xs ${
          isActive("/") ? "text-yellow-400 bg-[#282828]" : "text-[#ababab]"
        } flex-1 py-2 rounded-xl transition-all`}
      >
        <FaHome className="inline mr-1.5" size={17} /> <span>Home</span>
      </button>

      <button
        onClick={() => navigate("/orders")}
        className={`flex items-center justify-center font-bold text-xs ${
          isActive("/orders") ? "text-yellow-400 bg-[#282828]" : "text-[#ababab]"
        } flex-1 py-2 rounded-xl transition-all`}
      >
        <MdOutlineReorder className="inline mr-1.5" size={17} />{" "}
        <span>{role === "Cashier" ? "Billing" : role === "Waiter" ? "KOT Orders" : "Orders"}</span>
      </button>

      <button
        onClick={() => navigate("/tables")}
        className={`flex items-center justify-center font-bold text-xs ${
          isActive("/tables") ? "text-yellow-400 bg-[#282828]" : "text-[#ababab]"
        } flex-1 py-2 rounded-xl transition-all`}
      >
        <MdTableBar className="inline mr-1.5" size={17} /> <span>Tables</span>
      </button>

      {role === "Admin" ? (
        <button
          onClick={() => navigate("/dashboard")}
          className={`flex items-center justify-center font-bold text-xs ${
            isActive("/dashboard") ? "text-yellow-400 bg-[#282828]" : "text-[#ababab]"
          } flex-1 py-2 rounded-xl transition-all`}
        >
          <BiSolidDish className="inline mr-1.5" size={17} /> <span>Admin</span>
        </button>
      ) : (
        <button
          onClick={() => navigate("/menu")}
          className={`flex items-center justify-center font-bold text-xs ${
            isActive("/menu") ? "text-yellow-400 bg-[#282828]" : "text-[#ababab]"
          } flex-1 py-2 rounded-xl transition-all`}
        >
          <BiSolidDish className="inline mr-1.5" size={17} /> <span>Menu</span>
        </button>
      )}

      <button
        disabled={isActive("/tables") || isActive("/menu")}
        onClick={openModal}
        className="absolute left-1/2 -translate-x-1/2 -top-7 bg-[#F6B100] text-[#f5f5f5] rounded-full p-4 items-center"
      >
        <BiSolidDish size={40} />
      </button>

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Create Order">
        <div>
          <label className="block text-[#ababab] mb-2 text-sm font-medium">Customer Name</label>
          <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
            <input value={name} onChange={(e) => setName(e.target.value)} type="text" name="customerName" autoComplete="name" placeholder="Enter customer name" id="customer-name" className="bg-transparent flex-1 text-white focus:outline-none"  />
          </div>
        </div>
        <div>
          <label className="block text-[#ababab] mb-2 mt-3 text-sm font-medium">Customer Phone</label>
          <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" name="customerPhone" autoComplete="tel" placeholder="+91-9999999999" id="customer-phone" className="bg-transparent flex-1 text-white focus:outline-none"  />
          </div>
        </div>
        <div>
          <label className="block mb-2 mt-3 text-sm font-medium text-[#ababab]">Guest</label>
          <div className="flex items-center justify-between bg-[#1f1f1f] px-4 py-3 rounded-lg">
            <button type="button" onClick={decrement} className="text-yellow-500 text-2xl" aria-label="Remove one guest">&minus;</button>
            <span className="text-white">{guestCount} Person</span>
            <button type="button" onClick={increment} className="text-yellow-500 text-2xl" aria-label="Add one guest">&#43;</button>
          </div>
        </div>
        <button type="button" onClick={handleCreateOrder} className="w-full bg-[#F6B100] text-[#f5f5f5] rounded-lg py-3 mt-8 hover:bg-yellow-700">
          Create Order
        </button>
      </Modal>
    </div>
  );
};

export default BottomNav;
