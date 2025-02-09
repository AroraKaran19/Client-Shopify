import React from "react";

const ActiveStoreIcon = ({
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
      viewBox="0 0 20 20"
      className={className}
      style={style}
      onClick={onClick}
    >
      <path d="M5 11.18v4.445c0 .345.28.625.625.625h2.5v-2.5c0-.69.56-1.25 1.25-1.25h1.25c.69 0 1.25.56 1.25 1.25v2.5h2.5c.345 0 .625-.28.625-.625V11.18a2.822 2.822 0 0 1-2.813-.975A2.807 2.807 0 0 1 10 11.25a2.807 2.807 0 0 1-2.188-1.045A2.807 2.807 0 0 1 5 11.18ZM7.188 7.5v.938a1.562 1.562 0 1 1-3.125 0V7.5h3.125ZM8.438 8.438V7.5h3.124v.938a1.563 1.563 0 0 1-3.124 0ZM12.813 8.438V7.5h3.124v.938a1.563 1.563 0 0 1-3.124 0ZM4.305 6.25h11.39l-.69-2.073a.625.625 0 0 0-.593-.427H5.588a.625.625 0 0 0-.592.427L4.305 6.25Z" />
      <path
        fillRule="evenodd"
        d="M5 0a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V5a5 5 0 0 0-5-5H5ZM3.81 3.782A1.875 1.875 0 0 1 5.588 2.5h8.824c.807 0 1.523.516 1.778 1.282l.997 2.992v1.663c0 .833-.362 1.582-.937 2.097v5.091c0 1.035-.84 1.875-1.875 1.875h-8.75a1.875 1.875 0 0 1-1.875-1.875v-5.091a2.805 2.805 0 0 1-.938-2.097V6.774l.998-2.992Z"
        clipRule="evenodd"
      />
    </svg>
  );
};

export default ActiveStoreIcon;
