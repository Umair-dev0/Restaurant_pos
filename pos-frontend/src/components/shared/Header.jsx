import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import { FaUserCircle } from "react-icons/fa";
import { FaBell } from "react-icons/fa";
import logo from "../../assets/images/logo.png";
import { useDispatch, useSelector } from "react-redux";
import { IoLogOut } from "react-icons/io5";
import { useMutation } from "@tanstack/react-query";
import { logout } from "../../https";
import { removeUser } from "../../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";
import { MdDashboard } from "react-icons/md";
import { enqueueSnackbar } from "notistack";

const Header = () => {
  const [search, setSearch] = useState("");
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

  return (
    <header className="flex flex-wrap justify-between items-center gap-3 py-4 px-4 md:px-8 bg-[#1a1a1a]">
      {/* LOGO */}
      <div onClick={() => navigate("/")} className="flex items-center gap-2 cursor-pointer">
        <img src={logo} className="h-8 w-8" alt="restro logo" />
        <h1 className="text-lg font-semibold text-[#f5f5f5] tracking-wide">
          Restro
        </h1>
      </div>

      {/* SEARCH */}
      <form onSubmit={handleSearch} className="flex order-3 md:order-none items-center gap-4 bg-[#1f1f1f] rounded-[15px] px-5 py-2 w-full md:w-[min(500px,40vw)]">
        <button type="submit" className="text-[#f5f5f5]" aria-label="Search orders">
          <FaSearch />
        </button>
        <input
          type="text"
          placeholder="Search orders"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="bg-[#1f1f1f] outline-none text-[#f5f5f5] w-full"
        />
      </form>

      {/* LOGGED USER DETAILS */}
      <div className="flex items-center gap-4">
        {userData.role === "Admin" && (
          <div onClick={() => navigate("/dashboard")} className="bg-[#1f1f1f] rounded-[15px] p-3 cursor-pointer">
            <MdDashboard className="text-[#f5f5f5] text-2xl" />
          </div>
        )}
        <button
          type="button"
          onClick={() => enqueueSnackbar("You have no new notifications.", { variant: "info" })}
          aria-label="Notifications"
          className="bg-[#1f1f1f] rounded-[15px] p-3 text-left"
        >
          <FaBell className="text-[#f5f5f5] text-2xl" />
        </button>
        <div className="flex items-center gap-3 cursor-pointer">
          <FaUserCircle className="text-[#f5f5f5] text-4xl" />
          <div className="flex flex-col items-start">
            <h1 className="text-md text-[#f5f5f5] font-semibold tracking-wide">
              {userData.name || "TEST USER"}
            </h1>
            <p className="text-xs text-[#ababab] font-medium">
              {userData.role || "Role"}
            </p>
          </div>
          <button type="button" onClick={handleLogout} disabled={logoutMutation.isPending} aria-label="Log out" className="ml-2 text-[#f5f5f5] disabled:opacity-50">
            <IoLogOut size={40} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
