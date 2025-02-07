import React from "react";

const FilterIcon = ({
  mode,
  className,
  style,
	onClick
}: {
  className?: string;
  style?: React.CSSProperties;
	onClick?: () => void;
  mode?: boolean;
}) => {
  return (
    <div className={`outer-wrapper h-full p-[0.35rem] rounded-lg transition-all duration-100 ease-in-out ${mode ? "bg-black/20" : ""}`}>
      <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      className={className}
			style={style}
      onClick={onClick}
    >
      <path d="M1 4a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5h-12.5a.75.75 0 0 1-.75-.75"></path>
      <path d="M4.75 12a.75.75 0 0 1 .75-.75h5a.75.75 0 0 1 0 1.5h-5a.75.75 0 0 1-.75-.75"></path>
      <path d="M3.5 7.25a.75.75 0 0 0 0 1.5h9a.75.75 0 0 0 0-1.5z"></path>
    </svg>
    </div>
  );
};

export default FilterIcon;
