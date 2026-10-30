import { useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import Greetings from "../components/home/Greetings";
import { BsCashCoin } from "react-icons/bs";
import { GrInProgress } from "react-icons/gr";
import MiniCard from "../components/home/MiniCard";
import RecentOrders from "../components/home/RecentOrders";
import PopularDishes from "../components/home/PopularDishes";
import { getOrderStats } from "../https";
import { useQuery } from "@tanstack/react-query";

const Home = () => {
  const { data: statsResponse } = useQuery({
    queryKey: ["orderStats", 30],
    queryFn: () => getOrderStats(30)
  });
  const stats = statsResponse?.data?.data;

    useEffect(() => {
      document.title = "POS | Home"
    }, [])

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-[#1f1f1f] flex flex-col xl:flex-row gap-3 pb-20">
      {/* Left Div */}
      <div className="min-w-0 flex-[3]">
        <Greetings />
        <div className="flex items-center w-full gap-3 px-8 mt-8">
          <MiniCard
            title="Revenue"
            icon={<BsCashCoin />}
            value={stats ? `₹${stats.revenue.toFixed(2)}` : "—"}
            description="From orders in the last 30 days"
          />
          <MiniCard
            title="In Progress"
            icon={<GrInProgress />}
            value={stats?.inProgress ?? "—"}
            description="Orders being prepared"
          />
        </div>
        <RecentOrders />
      </div>
      {/* Right Div */}
      <div className="min-w-0 flex-[2]">
        <PopularDishes />
      </div>
      <BottomNav />
    </section>
  );
};

export default Home;
