import { useContext, useEffect, useState } from "react";
import NotificationIcon from "../../assets/svg/NotificationIcon";
import SideKickIcon from "../../assets/svg/SideKickIcon";
import "./components/navbar.css";
import Searchbar from "./components/Searchbar";
import { LayoutContext } from "../../layout";
import HamburgerIcon from "../../assets/svg/HamburgerIcon";

const Navbar = () => {
  const { notifications, sidebarState, setSidebarState } = useContext(LayoutContext);
  const [notificationCount, setNotificationCount] = useState(
    notifications.length
  );

  useEffect(() => {
    setNotificationCount(notifications.length);
  }, [notifications]);

  return (
    <div className="navbar w-full flex gap-2 items-center h-[56px] bg-[#1a1a1a] py-2 sticky top-0 z-[500]">
      {/* Hamburger Menu */}
      <button
        className={`hamburger-btn flex-none p-1 ml-3 active:shadow-[inset_0_-2px_4px_rgba(255,255,255,0.2)] hover:shadow-sm hover:shadow-white/60 active:bg-[rgb(26,26,26)] ${sidebarState ? "bg-[rgb(26,26,26)] shadow-[inset_0_-2px_4px_rgba(255,255,255,0.2)]" : ''} text-white active:text-white/70 rounded-lg sm:flex hidden`}
        onClick={() => setSidebarState && setSidebarState(!sidebarState)}
      >
        <HamburgerIcon className="size-6" />
      </button>
      {/* Logo */}
      <div className="logo flex items-center ml-5 w-1/3 gap-0.5 max-h-[34px] sm:hidden sm:ml-4">
        <img
          src="https://cdn.shopify.com/shopifycloud/web/assets/v1/vite/client/en/assets/shopify-glyph-white-DZNyE9BvHIk-.svg"
          alt="Shopify logo"
          className="h-[24px] aspect-square"
        />
        <img
          src="https://cdn.shopify.com/shopifycloud/web/assets/v1/vite/client/en/assets/shopify-wordmark-monochrome-CpVsfBAAmxEP.svg"
          alt="Shopify"
          className="h-[20px] mt-1"
        />
      </div>
      {/* Search Bar */}
      <Searchbar />
      {/* User */}
      <div className="user-mgnt w-1/3 flex gap-2 justify-end pr-2 sm:flex-none sm:w-fit">
        <button className="sidekick-btn p-2.5 active:shadow-[inset_0_-2px_4px_rgba(255,255,255,0.2)] hover:shadow-sm hover:shadow-white/60 active:bg-[rgb(26,26,26)] fill-white active:fill-white/70 rounded-lg sm:hidden">
          <SideKickIcon className="size-4" />
        </button>
        <button className="notification-btn p-2.5 active:shadow-[inset_0_-2px_4px_rgba(255,255,255,0.2)] hover:shadow-sm hover:shadow-white/60 active:bg-[rgb(26,26,26)] fill-white active:fill-white/70 rounded-lg relative">
          <NotificationIcon className="size-4" count={notificationCount} />
        </button>
        <button className="user-btn flex items-center p-1 gap-1 active:shadow-[inset_0_-2px_4px_rgba(255,255,255,0.2)] hover:shadow-sm hover:shadow-white/60 active:bg-[rgb(26,26,26)] text-white/90 active:text-white/60 rounded-lg">
          <div className="user-image-container size-7 rounded-lg bg-[#25e82b] text-black flex items-center justify-center">
            <p className="text-xs">MS</p>
          </div>
          <p className="text-xs font-semibold sm:hidden">My Store</p>
        </button>
      </div>
    </div>
  );
};

export default Navbar;
