import { useState, useEffect } from "react";
import { MdTableBar, MdCategory } from "react-icons/md";
import { BiSolidDish } from "react-icons/bi";
import Metrics from "../components/dashboard/Metrics";
import RecentOrders from "../components/dashboard/RecentOrders";
import Modal from "../components/dashboard/Modal";
import MenuEditorModal from "../components/dashboard/MenuEditorModal";
import MenuCatalog from "../components/dashboard/MenuCatalog";
import Payments from "../components/dashboard/Payments";
import InventoryManager from "../components/dashboard/InventoryManager";
import StaffManager from "../components/dashboard/StaffManager";
import { useQuery } from "@tanstack/react-query";
import { getMenu } from "../https";

const buttons = [
  { label: "Add Table", icon: <MdTableBar />, action: "table" },
  { label: "Add Category", icon: <MdCategory />, action: "category" },
  { label: "Add Dishes", icon: <BiSolidDish />, action: "dishes" },
];

const tabs = ["Metrics", "Inventory", "Staff", "Orders", "Payments", "Menu"];

const Dashboard = () => {
  useEffect(() => {
    document.title = "POS | Admin Dashboard";
  }, []);

  const [activeModal, setActiveModal] = useState("");
  const [activeTab, setActiveTab] = useState("Metrics");

  const { data: menuData } = useQuery({
    queryKey: ["menu"],
    queryFn: getMenu
  });
  const categories = menuData?.data?.data || [];

  const handleOpenModal = (action) => {
    setActiveModal(action);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#1f1f1f] pb-24">
      {/* Action and Navigation Ribbon */}
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 py-6 md:py-10 px-6 md:px-4 border-b border-zinc-800/80 mb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          {buttons.map(({ label, icon, action }) => (
            <button
              key={action}
              onClick={() => handleOpenModal(action)}
              className="bg-[#242424] hover:bg-zinc-800 border border-zinc-700/60 px-5 py-2.5 rounded-xl text-[#f5f5f5] font-semibold text-xs flex items-center gap-2 transition-all shadow-sm active:scale-95"
            >
              <span>{label}</span>
              <span className="text-yellow-400">{icon}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-[#181818] p-1.5 rounded-2xl border border-zinc-800 shadow-md">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab
                  ? "bg-yellow-400 text-zinc-950 shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "Metrics" && <Metrics />}
      {activeTab === "Inventory" && <InventoryManager />}
      {activeTab === "Staff" && <StaffManager />}
      {activeTab === "Orders" && <RecentOrders />}
      {activeTab === "Payments" && <Payments />}
      {activeTab === "Menu" && <MenuCatalog />}

      {activeModal === "table" && (
        <Modal setIsTableModalOpen={(open) => setActiveModal(open ? "table" : "")} />
      )}
      {["category", "dishes"].includes(activeModal) && (
        <MenuEditorModal
          type={activeModal === "category" ? "category" : "dish"}
          categories={categories}
          onClose={() => setActiveModal("")}
        />
      )}
    </div>
  );
};

export default Dashboard;
