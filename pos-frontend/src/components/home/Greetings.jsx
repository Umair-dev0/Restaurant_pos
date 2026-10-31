import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

const Greetings = () => {
  const userData = useSelector(state => state.user);
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}, ${date.getFullYear()}`;
  };

  const formatTime = (date) =>
    `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;

  const getGreeting = () => {
    const hour = dateTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="flex justify-between items-center px-8 mt-5">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wide">
            {getGreeting()}, {userData.name || "Staff Member"}
          </h1>
          <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-yellow-400 text-zinc-950 uppercase">
            {userData.role || "Staff"}
          </span>
        </div>
        <p className="text-zinc-400 text-xs mt-1">
          {userData.role === "Admin"
            ? "👑 Master Management Console • Oversee orders, revenue, tables & kitchen stock."
            : userData.role === "Cashier"
            ? "💵 Cashier Billing Terminal • Settle bills, receive payments and generate tax invoices."
            : "🍽️ Floor Service Mode • Manage dining tables, take customer orders, and update kitchen tickets."}
        </p>
      </div>
      <div>
        <h1 className="text-[#f5f5f5] text-3xl font-bold tracking-wide w-[130px]">{formatTime(dateTime)}</h1>
        <p className="text-[#ababab] text-sm">{formatDate(dateTime)}</p>
      </div>
    </div>
  );
};

export default Greetings;
