import { ReactNode, createContext, useEffect, useState } from "react";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import { DurationOption } from "./components/Calendar/CalendarWrapper";

interface LayoutProps {
  notifications: object[];
  setNotifications: (notifications: object[]) => void;
  sidebarState?: boolean;
  setSidebarState?: (state: boolean) => void;
  search?: string;
  setSearch?: (value: string) => void;
  addFilter?: string;
  setAddFilter?: (value: string) => void;
  durationOptions: DurationOption[];
  setDurationOptions: (value: DurationOption[]) => void;
  datesRangeValue: { range1?: Date; range2?: Date };
  setDatesRangeValue: (value: { range1?: Date; range2?: Date }) => void;
  selectedValues: { range1?: Date; range2?: Date };
  setSelectedValues: (value: { range1?: Date; range2?: Date }) => void;
}

export const LayoutContext = createContext<LayoutProps>({} as LayoutProps);

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
  const [selectedValues, setSelectedValues] = useState<{ range1?: Date; range2?: Date }>({ range1: new Date(), range2: new Date() });
  const [durationOptions, setDurationOptions] = useState<DurationOption[]>([
    {
      name: "Today",
      value: "today",
      active: true,
      range: { range1: new Date(), range2: new Date() },
    },
    {
      name: "Yesterday",
      value: "yesterday",
      range: { 
        range1: new Date(new Date().setDate(new Date().getDate() - 1)),
        range2: new Date(new Date().setDate(new Date().getDate() - 1)),
      }
    },
    {
      name: "Last 7 days",
      value: "last_7_days",
      range: {
        range1: new Date(new Date().setDate(new Date().getDate() - 7)),
        range2: new Date(),
      },
    },
    {
      name: "Last 30 days",
      value: "last_30_days",
      range: {
        range1: new Date(new Date().setDate(new Date().getDate() - 30)),
        range2: new Date(),
      },
    },
    {
      name: "Last 90 days",
      value: "last_90_days",
      range: {
        range1: new Date(new Date().setDate(new Date().getDate() - 90)),
        range2: new Date(),
      },
    },
    {
      name: "Last 365 days",
      value: "last_365_days",
      range: {
        range1: new Date(new Date().setDate(new Date().getDate() - 365)),
        range2: new Date(),
      },
    },
    {
      name: "Last month",
      value: "last_month",
      range: {
        range1: new Date(new Date(
          new Date().setMonth(new Date().getMonth() - 1)
        ).getFullYear(), new Date(
          new Date().setMonth(new Date().getMonth() - 1)
        ).getMonth(), 1),
        range2: new Date(
          new Date(
            new Date().setMonth(new Date().getMonth() - 1)
          ).getFullYear(),
          new Date(
            new Date().setMonth(new Date().getMonth() - 1)
          ).getMonth() + 1,
          0
        ),
      },
    },
    {
      name: "Last 12 months",
      value: "last_12_months",
      range: {
        range1: new Date(new Date(
          new Date().setFullYear(new Date().getFullYear() - 1)
        ).getFullYear(), new Date(
          new Date().setFullYear(new Date().getFullYear() - 1)
        ).getMonth(), 1),
        range2: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
      },
    },
    {
      name: "Last year",
      value: "last_year",
      range: {
        range1: new Date(new Date(
          new Date().setFullYear(new Date().getFullYear() - 1)).getFullYear(), 0, 1),
        range2: new Date(new Date(
          new Date().setFullYear(new Date().getFullYear() - 1)).getFullYear(), 11, 31),
      },
    },
  ]);
  const [datesRangeValue, setDatesRangeValue] = useState<{
    range1?: Date;
    range2?: Date;
  }>({} as { range1: Date; range2: Date });

  useEffect(() => {
    const selectedOption = durationOptions.filter((option) => option.active)[0]
      .range;
    const selectedText = document.querySelector(".result-selection-text");
    if (selectedText) {
      if (
        selectedValues.range1 &&
        selectedValues.range2 &&
        selectedOption.range1.toLocaleDateString() != selectedValues.range1.toLocaleDateString() &&
        selectedOption.range2.toLocaleDateString() != selectedValues.range2.toLocaleDateString()
      ) {
        selectedText.textContent = selectedValues.range1.toLocaleDateString() == selectedValues.range2.toLocaleDateString() ? selectedValues.range1.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : selectedValues.range1.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) + " - " + selectedValues.range2.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      } else {
        selectedText.textContent = durationOptions.filter(
          (option) => option.active
        )[0].name;
      }
    }
  }, [durationOptions, selectedValues]);

  useEffect(() => {
    const main_content = document.querySelector("main");
    const sidebar_open_wrapper = document.querySelector(
      ".sidebar_open_wrapper"
    );
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
        durationOptions,
        setDurationOptions,
        datesRangeValue,
        setDatesRangeValue,
        selectedValues,
        setSelectedValues,
      }}
    >
      <Navbar />
      <div className="w-full flex h-[calc(100vh-56px)] max-h-[calc(100vh-56px)] rounded-t-xl overflow-hidden">
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
