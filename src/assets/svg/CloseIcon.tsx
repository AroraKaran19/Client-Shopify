import React from "react";

const CloseIcon = ({
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
      <path d="M11.03 4.97a.75.75 0 0 1 0 1.06l-1.97 1.97 1.97 1.97a.749.749 0 1 1-1.06 1.06l-1.97-1.97-1.97 1.97a.749.749 0 1 1-1.06-1.06l1.97-1.97-1.97-1.97a.749.749 0 1 1 1.06-1.06l1.97 1.97 1.97-1.97a.75.75 0 0 1 1.06 0"></path>
      <path
        fillRule="evenodd"
        d="M8 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14m0-1.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 1 0 0 11"
      ></path>
    </svg>
  );
};

export default CloseIcon;
