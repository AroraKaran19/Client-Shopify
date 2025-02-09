import { useEffect, useState } from "react";
import BelowIcon from "../../../assets/sidebarNav/BelowIcon";
import { SidebarLink } from "../Sidebar";
import { Link } from "react-router-dom";

const NavLink = ({
  navLink,
  underIcon = false,
  className,
}: {
  navLink: SidebarLink;
  underIcon?: boolean;
  className?: string;
}) => {

  const [showSubMenu, setShowSubMenu] = useState<boolean>(false);

  useEffect(() => {
    if (navLink.active || navLink.subMenu?.some((subLink) => subLink.active)) {
      setShowSubMenu(true);
    } else {
      setShowSubMenu(false);
    }
  }, [navLink.active, navLink.subMenu]);

  return (
    <div
      className={
        `sidebar-nav-link w-full flex flex-col justify-center text-[#4a4a4a] fill-[#4a4a4a] ${navLink.active ? "!text-black !fill-black" : ""} ` +
        (className ? ` ${className}` : "")
      }
    >
      <Link
        to={navLink.link == "" ? navLink.subMenu?.[0].link ?? "#" : navLink.link} 
        className={`flex items-center w-full px-2 py-1 sm:py-[6px] hover:bg-white/30 rounded-lg relative ${
          navLink?.active ? "!bg-[#fafafa]" : ""
        }`}
      >
        <div
          className={`sidebar-nav-link-icon size-4 mr-2 relative sm:size-5 ${
            underIcon ? `opacity-0 transition-all ease-in-out duration-100 ${navLink.active ? "opacity-50" : ""}` : ""
          }`}
        >
          {underIcon ? (
            <BelowIcon className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-[25%] size-4" />
          ) : navLink.active ? (
            navLink.activeIcon ?? navLink.icon
          ) : (
            navLink.icon
          )}
        </div>
        <span className={`text-sm sm:text-base ${underIcon ? (navLink.active ? "font-[550] sm:font-semibold" : "font-normal sm:font-[450]") : "font-[550] sm:font-semibold"}`}>
          {navLink.name}
        </span>
        {navLink.extraIcon && <div className="extra-icon ml-auto opacity-0 transition-all ease-in-out duration-100 hover:opacity-100 sm:opacity-100">
          {navLink.extraIcon}
        </div>}
      </Link>
      {navLink.subMenu && showSubMenu && (
        <div className="sidebar-sub-menu w-full flex flex-col">
          {navLink.subMenu.map((subLink, subIndex) => (
            <NavLink
              key={subIndex}
              navLink={subLink}
              underIcon={true}
              className="sidebar-sub-menu-link"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NavLink;
