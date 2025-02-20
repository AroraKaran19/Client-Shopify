import React from "react";

interface CalendarCellProps
  extends React.PropsWithChildren<{
    className?: string;
    onClick?: (e: any) => void;
  }> {}

const CalendarCell: React.FC<CalendarCellProps> = ({
  children,
  className,
  onClick,
}) => {
  return (
    <div
      className={`${className} flex items-center justify-center h-[30px] text-[12px] ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default CalendarCell;
