import React from "react";

const ActiveCustomerIcon = ({
  className,
  style,
  onClick,
}: {
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      className={className}
      style={style}
      onClick={onClick}
    >
      <path
        fillRule="evenodd"
        d="M8 1a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7m-2 3.5a2 2 0 1 1 3.999-.001 2 2 0 0 1-3.999.001"
      ></path>
      <path
        fillRule="evenodd"
        d="M13.484 12.227a6.274 6.274 0 0 0-10.968 0l-.437.786a1.338 1.338 0 0 0 1.17 1.987h9.502a1.338 1.338 0 0 0 1.17-1.987zm-9.657.728a4.775 4.775 0 0 1 8.346 0l.302.545h-8.95z"
      ></path>
    </svg>
  );
};

export default ActiveCustomerIcon;
