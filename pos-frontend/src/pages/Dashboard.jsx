import { useState, useEffect } from "react";
import { MdTableBar, MdCategory } from "react-icons/md";
import { BiSolidDish } from "react-icons/bi";
import Metrics from "../components/dashboard/Metrics";
import RecentOrders from "../components/dashboard/RecentOrders";
import Modal from "../components/dashboard/Modal";
import MenuEditorModal from "../components/dashboard/MenuEditorModal";
import MenuCatalog from "../components/dashboard/MenuCatalog";
import Payments from "../components/dashboard/Payments";

const buttons = [
  { label: "Add Table", icon: <MdTableBar />, action: "table" },
  { label: "Add Category", icon: <MdCategory />, action: "category" },
  { label: "Add Dishes", icon: <BiSolidDish />, action: "dishes" },
];

const tabs = ["Metrics", "Orders", "Payments", "Menu"];

const Dashboard = () => {

  useEffect(() => {
    document.title = "POS | Admin Dashboard"
  }, [])

  const [activeModal, setActiveModal] = useState("");
  const [activeTab, setActiveTab] = useState("Metrics");

  const handleOpenModal = (action) => {
    setActiveModal(action);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#1f1f1f] pb-20">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 py-8 md:py-14 px-6 md:px-4">
        <div className="flex flex-wrap items-center gap-3">
          {buttons.map(({ label, icon, action }) => {
            return (
              <button
                key={action}
                onClick={() => handleOpenModal(action)}
                className="bg-[#1a1a1a] hover:bg-[#262626] px-8 py-3 rounded-lg text-[#f5f5f5] font-semibold text-md flex items-center gap-2"
              >
                {label} {icon}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {tabs.map((tab) => {
            return (
              <button
                key={tab}
                className={`
                px-8 py-3 rounded-lg text-[#f5f5f5] font-semibold text-md flex items-center gap-2 ${
                  activeTab === tab
                    ? "bg-[#262626]"
                    : "bg-[#1a1a1a] hover:bg-[#262626]"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "Metrics" && <Metrics />}
      {activeTab === "Orders" && <RecentOrders />}
      {activeTab === "Payments" && <Payments />}
      {activeTab === "Menu" && <MenuCatalog />}

      {activeModal === "table" && <Modal setIsTableModalOpen={(open) => setActiveModal(open ? "table" : "")} />}
      {["category", "dishes"].includes(activeModal) && (
        <MenuEditorModal
          type={activeModal === "category" ? "category" : "dish"}
          categories={[]}
          onClose={() => setActiveModal("")}
        />
      )}
    </div>
  );
};

export default Dashboard;
