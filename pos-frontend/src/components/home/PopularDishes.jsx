import { useQuery } from "@tanstack/react-query";
import { getOrderStats } from "../../https";
import { Link } from "react-router-dom";
import { getAvatarName } from "../../utils";

const PopularDishes = () => {
  const { data: response, isLoading } = useQuery({
    queryKey: ["orderStats", 30],
    queryFn: () => getOrderStats(30)
  });
  const popularDishes = response?.data?.data?.popularItems ?? [];

  return (
    <div className="mt-6 pr-6">
      <div className="bg-[#1a1a1a] w-full rounded-lg">
        <div className="flex justify-between items-center px-6 py-4">
          <h1 className="text-[#f5f5f5] text-lg font-semibold tracking-wide">
            Popular Dishes
          </h1>
          <Link to="/menu" className="text-[#025cca] text-sm font-semibold">
            View all
          </Link>
        </div>

        <div className="pb-4">
          {isLoading ? (
            <p className="px-6 pb-5 text-[#ababab]">Loading popular dishes…</p>
          ) : popularDishes.length ? popularDishes.map((dish, index) => (
              <div
                key={dish._id || dish.name}
                className="flex items-center gap-4 bg-[#1f1f1f] rounded-[15px] px-6 py-4 mt-4 mx-6"
              >
                <span className="text-[#f5f5f5] font-bold text-xl mr-4">{String(index + 1).padStart(2, "0")}</span>
                <span className="w-[50px] h-[50px] rounded-full bg-[#383838] text-white flex items-center justify-center font-bold">
                  {getAvatarName(dish.name)}
                </span>
                <div>
                  <h1 className="text-[#f5f5f5] font-semibold tracking-wide">{dish.name}</h1>
                  <p className="text-[#f5f5f5] text-sm font-semibold mt-1">
                    <span className="text-[#ababab]">Sold: </span>
                    {dish.quantity}
                  </p>
                </div>
              </div>
          )) : <p className="px-6 pb-5 text-[#ababab]">No order data available yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default PopularDishes;
