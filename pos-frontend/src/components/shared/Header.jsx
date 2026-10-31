import { useState } from "react";
import { FaSearch, FaUserCircle, FaBell, FaExchangeAlt, FaShieldAlt, FaCashRegister, FaUtensils } from "react-icons/fa";
import logo from "../../assets/images/logo.png";
import { useDispatch, useSelector } from "react-redux";
import { IoLogOut } from "react-icons/io5";
import { useMutation } from "@tanstack/react-query";
import { logout } from "../../https";
import { removeUser, setUser } from "../../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";
import { MdDashboard } from "react-icons/md";
import { enqueueSnackbar } from "notistack";

const Header = () => {
  const [search, setSearch] = useState("");
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const userData = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      dispatch(removeUser());
      navigate("/auth");
    },
    onError: (error) => {
      enqueueSnackbar(error.response?.data?.message || "Could not log out. Please try again.", { variant: "error" });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleSearch = (event) => {
    event.preventDefault();
    navigate(`/orders?search=${encodeURIComponent(search.trim())}`);
  };

  const handleSwitchRole = (newRole) => {
    dispatch(
      setUser({
        ...userData,
        role: newRole,
        name:
          newRole === "Admin"
            ? "Admin Manager"
            : newRole === "Cashier"
            ? "Sam Cashier"
            : "Alex Waiter"
      })
    );
    setShowRoleSwitcher(false);
    enqueueSnackbar(`Switched view to: ${newRole} Mode`, { variant: "info" });
    if (newRole !== "Admin" && window.location.pathname === "/dashboard") {
      navigate("/");
    }
  };

  const role = userData.role || "Admin";

  return (
    <>
      <header className="flex flex-wrap justify-between items-center gap-3 py-3 px-4 md:px-8 bg-[#181818] border-b border-zinc-800/80 sticky top-0 z-40">
        {/* LOGO & BRAND */}
        <div onClick={() => navigate("/")} className="flex items-center gap-3 cursor-pointer">
          <img src={logo} className="h-9 w-9 rounded-full border border-yellow-400/40 p-0.5" alt="restro logo" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white tracking-wide">RESTRO</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-400 text-black uppercase tracking-wider">
                POS
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              {role === "Admin"
                ? "👑 Admin Central Console"
                : role === "Cashier"
                ? "💵 Cashier Billing Terminal"
                : "🍽️ Waiter Floor & KOT Mode"}
            </p>
          </div>
        </div>

        {/* SEARCH BAR */}
        <form onSubmit={handleSearch} className="flex order-3 md:order-none items-center gap-3 bg-[#242424] rounded-xl px-4 py-2 w-full md:w-[min(420px,35vw)] border border-zinc-700/60 focus-within:border-yellow-400 transition-colors">
          <FaSearch className="text-zinc-400 text-xs" />
          <input
            type="text"
            placeholder="Search orders by customer or table #..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="bg-transparent outline-none text-white text-xs w-full placeholder-zinc-500"
          />
        </form>

        {/* ROLE BADGE & USER CONTROLS */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Demo Role Switcher Button */}
          <button
            type="button"
            onClick={() => setShowRoleSwitcher(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-sm ${
              role === "Admin"
                ? "bg-yellow-950/80 text-yellow-400 border-yellow-700/80 hover:bg-yellow-900/60"
                : role === "Cashier"
                ? "bg-emerald-950/80 text-emerald-400 border-emerald-700/80 hover:bg-emerald-900/60"
                : "bg-sky-950/80 text-sky-400 border-sky-700/80 hover:bg-sky-900/60"
            }`}
            title="Click to switch between Admin, Cashier, and Waiter mode"
          >
            <FaExchangeAlt size={10} />
            <span>{role} Mode</span>
          </button>

          {/* Admin Dashboard Icon (Only visible to Admin) */}
          {role === "Admin" && (
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-[#242424] hover:bg-zinc-800 text-yellow-400 border border-zinc-700/60 rounded-xl p-2.5 transition-colors shadow-sm"
              title="Admin Analytics & Settings"
            >
              <MdDashboard size={20} />
            </button>
          )}

          {/* User profile dropdown / info */}
          <div className="flex items-center gap-2.5 bg-[#242424] border border-zinc-800 px-3 py-1.5 rounded-xl">
            <FaUserCircle className="text-zinc-400 text-2xl" />
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-white leading-tight">{userData.name || "Staff Member"}</span>
              <span className="text-[10px] text-zinc-400 capitalize">{role}</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              aria-label="Log out"
              className="text-zinc-400 hover:text-rose-400 transition-colors p-1"
              title="Sign out"
            >
              <IoLogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Role-Specific Work Context Sub-Banner */}
      <div className={`px-4 md:px-8 py-1.5 text-[11px] font-semibold flex items-center justify-between border-b ${
        role === "Admin"
          ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
          : role === "Cashier"
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          : "bg-sky-500/10 text-sky-400 border-sky-500/20"
      }`}>
        <div className="flex items-center gap-2">
          {role === "Admin" && <><FaShieldAlt size={11} /> <span>Admin Master Access • Revenue, Menu, Staff & Floor Controls</span></>}
          {role === "Cashier" && <><FaCashRegister size={11} /> <span>Cashier Desk • Fast Checkout, Bill Settlement & GST Invoices</span></>}
          {role === "Waiter" && <><FaUtensils size={11} /> <span>Floor Captain Mode • Table Taking, KOT Kitchen Updates & Seating</span></>}
        </div>
        <button
          onClick={() => setShowRoleSwitcher(true)}
          className="underline hover:text-white text-[10px] uppercase tracking-wider"
        >
          Change Role ▾
        </button>
      </div>

      {/* Role Switcher Modal (For College Presentation & Examiners) */}
      {showRoleSwitcher && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#242424] text-white rounded-2xl max-w-sm w-full border border-zinc-800 shadow-2xl p-6">
            <h3 className="font-bold text-base mb-1 text-white flex items-center gap-2">
              <FaExchangeAlt className="text-yellow-400" /> Switch Role Perspective
            </h3>
            <p className="text-xs text-zinc-400 mb-5">
              Demonstrate how the POS features and navigation adapt automatically based on role permissions:
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleSwitchRole("Admin")}
                className={`w-full p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  role === "Admin"
                    ? "bg-yellow-950/60 border-yellow-500 text-white"
                    : "bg-[#1c1c1c] border-zinc-800 hover:border-zinc-700 text-zinc-300"
                }`}
              >
                <span className="text-2xl">👑</span>
                <div>
                  <h4 className="font-bold text-sm text-yellow-400">Administrator</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Full master access: Financial metrics, charts, staff management, menu editor, and cancel rights.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchRole("Cashier")}
                className={`w-full p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  role === "Cashier"
                    ? "bg-emerald-950/60 border-emerald-500 text-white"
                    : "bg-[#1c1c1c] border-zinc-800 hover:border-zinc-700 text-zinc-300"
                }`}
              >
                <span className="text-2xl">💵</span>
                <div>
                  <h4 className="font-bold text-sm text-emerald-400">Cashier (Billing Desk)</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Billing terminal: Receive cash / online payments, complete orders, and print GST tax invoices.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchRole("Waiter")}
                className={`w-full p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  role === "Waiter"
                    ? "bg-sky-950/60 border-sky-500 text-white"
                    : "bg-[#1c1c1c] border-zinc-800 hover:border-zinc-700 text-zinc-300"
                }`}
              >
                <span className="text-2xl">🍽️</span>
                <div>
                  <h4 className="font-bold text-sm text-sky-400">Waiter (Floor Captain)</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Floor order taking: Seat customers, view kitchen status, and advance orders to 'Ready to Serve'.</p>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowRoleSwitcher(false)}
              className="w-full mt-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold rounded-xl text-zinc-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
