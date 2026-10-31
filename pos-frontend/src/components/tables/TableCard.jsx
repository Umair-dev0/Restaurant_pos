import { useNavigate } from "react-router-dom";
import { getAvatarName, getBgColor } from "../../utils";
import { useDispatch, useSelector } from "react-redux";
import { updateTable as updateCustomerTable } from "../../redux/slices/customerSlice";
import { FaLongArrowAltRight, FaQrcode, FaRedoAlt } from "react-icons/fa";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTable } from "../../https";
import { enqueueSnackbar } from "notistack";

const TableCard = ({ id, name, status, initials, seats, guests = 1, onOpenQr }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role } = useSelector((state) => state.user);

  const resetTableMutation = useMutation({
    mutationFn: () => updateTable({ tableId: id, status: "Available" }),
    onSuccess: () => {
      enqueueSnackbar(`Table ${name} has been reset to Available.`, { variant: "info" });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
    onError: (err) => {
      enqueueSnackbar(err.response?.data?.message || "Failed to reset table.", { variant: "error" });
    }
  });

  const handleClick = () => {
    if (status === "Booked" || guests > seats) return;
    const table = { tableId: id, tableNo: name };
    dispatch(updateCustomerTable({ table }));
    navigate(`/menu`);
  };

  const isBooked = status === "Booked";

  return (
    <div
      className={`w-full text-left bg-[#262626] border border-zinc-800/80 p-5 rounded-2xl shadow-lg transition-all flex flex-col justify-between ${
        !isBooked && guests <= seats ? "hover:border-yellow-400/50 hover:bg-[#2b2b2b] cursor-pointer" : ""
      }`}
    >
      <div onClick={handleClick}>
        <div className="flex items-center justify-between">
          <h1 className="text-white text-lg font-bold flex items-center gap-1.5">
            Table <FaLongArrowAltRight className="text-zinc-500 inline text-xs" /> {name}
          </h1>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              isBooked
                ? "bg-rose-950/80 text-rose-400 border border-rose-800"
                : "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
            }`}
          >
            {status}
          </span>
        </div>

        <div className="flex items-center justify-center my-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-inner"
            style={{ backgroundColor: initials ? getBgColor() : "#1a1a1a" }}
          >
            {getAvatarName(initials) || "T" + name}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>Capacity: <strong className="text-white">{seats} Seats</strong></span>
          {initials && <span className="truncate max-w-[120px] text-zinc-300">👤 {initials}</span>}
        </div>

        {guests > seats && !isBooked && (
          <p className="mt-2 text-[11px] text-rose-400">Capacity too small for {guests} guests.</p>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenQr) onOpenQr({ id, name, seats });
          }}
          className="flex items-center gap-1.5 text-xs font-medium text-yellow-400 hover:text-yellow-300 bg-zinc-800/80 hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition-colors border border-zinc-700/60"
        >
          <FaQrcode size={12} /> QR Menu
        </button>

        {isBooked && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              resetTableMutation.mutate();
            }}
            disabled={resetTableMutation.isPending}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 px-2.5 py-1.5 rounded-lg transition-colors"
            title="Reset table to Available status"
          >
            <FaRedoAlt size={10} /> Reset
          </button>
        )}
      </div>
    </div>
  );
};

export default TableCard;
