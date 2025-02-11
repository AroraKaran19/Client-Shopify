import { ReactNode, createContext, useEffect, useState } from "react";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";

interface LayoutProps {
  notifications: object[];
  setNotifications: (notifications: object[]) => void;
  sidebarState?: boolean;
  setSidebarState?: (state: boolean) => void;
  search?: string;
  setSearch?: (value: string) => void;
  addFilter?: string;
  setAddFilter?: (value: string) => void;
}

export const LayoutContext = createContext<LayoutProps>({
  notifications: [],
  setNotifications: () => {},
  search: "",
  setSearch: () => {},
  addFilter: "",
  setAddFilter: () => {},
}); // Handle state of sidebar

const Layout = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<object[]>([
    {
      id: 1,
      title: "New Order",
      description: "You have received a new order.",
    },
  ]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [addFilter, setAddFilter] = useState<string>("");
  const [width, setWidth] = useState<number>(window.innerWidth);

  useEffect(() => {
    const main_content = document.querySelector("main");
    const sidebar_open_wrapper = document.querySelector(".sidebar_open_wrapper");
    if (sidebar_open_wrapper) {
      sidebar_open_wrapper.addEventListener("click", () => {
        if (sidebarOpen) {
          setSidebarOpen(false);
        }
      });
    }
    if (sidebarOpen && main_content && width <= 768) {
      main_content.style.overflow = "hidden";
    } else if (!sidebarOpen && main_content) {
      main_content.style.overflow = "auto";
    }
  }, [sidebarOpen]);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (width > 768) {
      setSidebarOpen(true);
    } else {
      setSidebarOpen(false);
    }
  }, [width]);

  return (
    <LayoutContext.Provider
      value={{
        notifications,
        setNotifications,
        sidebarState: sidebarOpen,
        setSidebarState: setSidebarOpen,
        search,
        setSearch,
        addFilter,
        setAddFilter,
      }}
    >
      <Navbar />
      <div className="w-full flex h-[calc(100vh-56px)] rounded-t-xl overflow-hidden">
        {sidebarOpen && (
          <div className="sidebar_open_wrapper bg-black/30 backdrop-blur-sm absolute top-0 h-screen w-full opacity-100 z-20 transition-all ease-in-out duration-500 left-0 sm:flex hidden"></div>
        )}
        <div
          className={`sidebar sm:absolute sm:top-[56px] sm:h-[calc(100vh-56px)] sm:py-[20px] sm:!w-[60vw] sm:!min-w-[240px] sm:!max-w-[60vw] ${
            sidebarOpen ? "left-0" : "-left-full"
          } z-30 transition-all ease-in-out duration-[350ms] w-[240px] max-w-[240px] max-h-full rounded-tl-xl overflow-y-auto bg-[#ebebeb] flex-shrink-0 flex flex-col px-[12px] py-[12px] gap-[8px] leading-none`}
        >
          <Sidebar />
        </div>
        <main className="w-full max-h-full overflow-y-auto rounded-tr-xl bg-[#f1f1f1] flex-shrink">
          {children}
        </main>
      </div>
    </LayoutContext.Provider>
  );
};

export default Layout;
