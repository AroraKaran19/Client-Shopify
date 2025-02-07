import React from "react";

const NotificationIcon = ({
  className,
  style,
  onClick,
  count,
}: {
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  count?: number;
}) => {
  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        className={className}
        style={style}
        onClick={onClick}
      >
        <path
          fillRule="evenodd"
          d="m5.252 12.424-2.446-.281c-1.855-.213-2.38-2.659-.778-3.616l.065-.038a2.89 2.89 0 0 0 1.407-2.48v-.509a4.5 4.5 0 0 1 9 0v.51c0 1.016.535 1.958 1.408 2.479l.065.038c1.602.957 1.076 3.403-.778 3.616l-2.543.292v.365a2.7 2.7 0 0 1-5.4 0zm3.9.076h-2.4v.3a1.2 1.2 0 1 0 2.4 0zm-3.152-1.5h4l3.024-.348a.452.452 0 0 0 .18-.837l-.065-.038a4.4 4.4 0 0 1-.674-.495l-.073-.067a4.4 4.4 0 0 1-1.392-3.205v-.51a3 3 0 1 0-6 0v.51a4.4 4.4 0 0 1-1.391 3.205l-.073.067a4.6 4.6 0 0 1-.674.495l-.065.038a.453.453 0 0 0 .18.838z"
        ></path>
      </svg>
      <div className="nt-count absolute top-1 right-1 text-white text-[8px] p-[0.4rem] bg-red-500 rounded-full w-fit h-fit">
        <div className="count absolute top-1/2 left-1/2 transform -translate-x-[60%] -translate-y-[60%]">
          <p className="leading-none">{count}</p>
        </div>
      </div>
    </>
  );
};

export default NotificationIcon;
