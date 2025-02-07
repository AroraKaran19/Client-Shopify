import { ReactNode, createContext, useState } from "react";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";

interface LayoutProps {
  notifications: object[];
	setNotifications: (notifications: object[]) => void;
}

export const LayoutContext = createContext<LayoutProps>({
	notifications: [],
	setNotifications: () => {},
}); // Handle state of sidebar

const Layout = ({ children }: { children: ReactNode }) => {

  const [notifications, setNotifications] = useState<object[]>([
    {
      id: 1,
      title: "New Order",
      description: "You have received a new order.",
    },
  ]);

  return (
    <LayoutContext.Provider value={{ notifications, setNotifications }}>
      <Navbar />
      <div className="w-full flex h-[calc(100vh-56px)] rounded-t-xl overflow-hidden">
        <div className="sidebar w-[15%] max-h-full rounded-tl-xl overflow-y-scroll bg-[#ebebeb]">
          <Sidebar />
        </div>
        <main className="w-[85%] max-h-full overflow-y-scroll rounded-tr-xl bg-[#f1f1f1]">
          {children}
        </main>
      </div>
    </LayoutContext.Provider>
  );
};

export default Layout;
