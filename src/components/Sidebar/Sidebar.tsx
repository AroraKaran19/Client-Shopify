import "./sidebar.css";
import { JSX, useContext, useEffect, useState } from "react";
import DiscountIcon from "../../assets/sidebarNav/DiscountIcon";
import MarketingIcon from "../../assets/sidebarNav/MarketingIcon";
import AnalyticsIcon from "../../assets/sidebarNav/AnalyticsIcon";
import ContentIcon from "../../assets/sidebarNav/ContentIcon";
import CustomerIcon from "../../assets/sidebarNav/CustomerIcon";
import ProductsIcon from "../../assets/sidebarNav/ProductsIcon";
import OrderIcon from "../../assets/sidebarNav/OrderIcon";
import HomeIcon from "../../assets/sidebarNav/HomeIcon";
import { useLocation } from "react-router-dom";
import ActiveHomeIcon from "../../assets/sidebarActiveNav/ActiveHomeIcon";
import ActiveOrderIcon from "../../assets/sidebarActiveNav/ActiveOrderIcon";
import ActiveProductsIcon from "../../assets/sidebarActiveNav/ActiveProductsIcon";
import ActiveCustomerIcon from "../../assets/sidebarActiveNav/ActiveCustomerIcon";
import ActiveDiscountIcon from "../../assets/sidebarActiveNav/ActiveDiscountIcon";
import ActiveAnalyticsIcon from "../../assets/sidebarActiveNav/ActiveAnalyticsIcon";
import NavLink from "./components/NavLink";
import StoreIcon from "../../assets/sidebarNav/StoreIcon";
import EyeIcon from "../../assets/sidebarNav/EyeIcon";
import RightArrow from "../../assets/svg/RightArrow";
import { LayoutContext } from "../../layout";
import SettingsIcon from "../../assets/sidebarNav/SettingsIcon";

export interface SidebarLink {
  name: string;
  link: string;
  activeIcon?: JSX.Element;
  icon?: JSX.Element;
  active?: boolean;
  subMenu?: SidebarLink[];
  extraIcon?: JSX.Element;
}

interface SidebarLinks {
  heading?: {
    title: string;
    filter: string;
  };
  content?: SidebarLink[];
}

const Sidebar = () => {
  const router = useLocation();
  const currentPath = router.pathname;
  const { setAddFilter } = useContext(LayoutContext);
  const [sidebarLinks, setSidebarLinks] = useState<SidebarLinks[]>([
    {
      content: [
        {
          name: "Home",
          link: "/home",
          icon: <HomeIcon />,
          activeIcon: <ActiveHomeIcon />,
          active: true,
        },
        {
          name: "Orders",
          link: "/orders",
          icon: <OrderIcon />,
          activeIcon: <ActiveOrderIcon />,
        },
        {
          name: "Products",
          link: "/products",
          icon: <ProductsIcon />,
          activeIcon: <ActiveProductsIcon />,
        },
        {
          name: "Customers",
          link: "/customers",
          icon: <CustomerIcon />,
          activeIcon: <ActiveCustomerIcon />,
        },
        {
          name: "Content",
          link: "/content",
          icon: <ContentIcon />,
        },
        {
          name: "Analytics",
          link: "/analytics",
          icon: <AnalyticsIcon />,
          activeIcon: <ActiveAnalyticsIcon />,
          subMenu: [
            {
              name: "Reports",
              link: "/analytics/reports",
            },
            {
              name: "Live View",
              link: "/analytics/live-view",
            },
          ],
        },
        {
          name: "Marketing",
          link: "/marketing",
          icon: <MarketingIcon />,
        },
        {
          name: "Discounts",
          link: "/discounts",
          icon: <DiscountIcon />,
          activeIcon: <ActiveDiscountIcon />,
        },
      ],
    },
    {
      heading: { title: "Sales channels", filter: "Sales channels" },
      content: [
        {
          name: "Online Store",
          link: "",
          icon: <StoreIcon />,
          extraIcon: <EyeIcon className="eye-icon size-4" />,
          subMenu: [
            {
              name: "Themes",
              link: "/online-store/themes",
            },
            {
              name: "Blog Posts",
              link: "/online-store/blog-posts",
            },
            {
              name: "Pages",
              link: "/online-store/pages",
            },
            {
              name: "Navigation",
              link: "/online-store/navigation",
            },
            {
              name: "Preferences",
              link: "/online-store/preferences",
            },
          ],
        },
      ],
    },
    {
      heading: { title: "Apps", filter: "Apps" },
    },
  ]);

  useEffect(() => {
    const updatedNavLinks = sidebarLinks.map((navLink) => {
      const updatedContent = navLink.content?.map((link) => {
        if (
          currentPath === link.link ||
          (currentPath == "/" && link.link == "/analytics")
        ) {
          return {
            ...link,
            active: true,
            subMenu: link.subMenu
              ? link.subMenu.map((subLinks) => {
                  return { ...subLinks, active: false };
                })
              : undefined,
          };
        }
        if (link.subMenu) {
          const updatedSubMenu = link.subMenu?.map((subLink) => {
            if (subLink.link == currentPath) {
              return { ...subLink, active: true };
            }
            return { ...subLink, active: false };
          });
          return { ...link, subMenu: updatedSubMenu, active: false };
        }
        return { ...link, active: false };
      });
      return { ...navLink, content: updatedContent };
    });
    setSidebarLinks(updatedNavLinks);
  }, [currentPath]);

  return (
    <>
      <div className="sidebar-nav-links flex flex-col justify-center leading-none">
        {sidebarLinks.map((value, index) => (
          <div key={index} className="sidebar-nav-links-group mb-3">
            {value.heading && (
              <div
                className="sidebar-nav-links-heading flex items-center text-[#616161] fill-[#616161] hover:text-black/85 hover:fill-black/85 leading-4 text-[13px] font-semibold py-1 cursor-pointer"
                onClick={() =>
                  setAddFilter &&
                  setAddFilter(value.heading ? value.heading.filter : "")
                }
              >
                <span>{value.heading.title}</span>
                <div className="add-filter-btn size-3 ml-auto">
                  <RightArrow />
                </div>
              </div>
            )}
            {value.content &&
              value.content.map((navLink, index) => (
                <NavLink key={index} navLink={navLink} />
              ))}
          </div>
        ))}
      </div>
      <div className="settings-btn mt-auto flex text-[#4a4a4a] fill-[#4a4a4a]">
        <NavLink
          navLink={{
            name: "Settings",
            link: "/settings",
            icon: <SettingsIcon />,
          }}
        />
      </div>
    </>
  );
};

export default Sidebar;
