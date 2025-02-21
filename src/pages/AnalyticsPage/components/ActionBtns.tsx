import { useState } from "react";
import CalendarBtnIcon from "@/assets/pages/analytics/CalendarBtnIcon";
import CalendarWrapper from "@/components/Calendar/CalendarWrapper";

const ActionBtns = () => {
  const [changeStartCalendar, setChangeStartCalendar] = useState(false);
  const [changeEndCalendar, setChangeEndCalendar] = useState(false);

  const handleCalendarClose = () => {
    setChangeStartCalendar(false);
    setChangeEndCalendar(false);
  };

  return (
    <div className="action-btns w-max flex gap-2 mt-1 relative">
      <div
        className={`today-btn flex gap-0.5 items-center bg-white pl-[6px] pr-3 py-1 w-fit rounded-lg shadow-sm shadow-black/30 text-[#303030] fill-[#303030] active:!shadow-[inset_2px_0px_7px_rgba(0,0,0,0.2)] cursor-pointer ${
          changeStartCalendar
            ? "shadow-[inset_2px_0px_7px_rgba(0,0,0,0.5)]"
            : ""
        }`}
        onClick={() => {
          changeEndCalendar
            ? (setChangeEndCalendar(false), setChangeStartCalendar(true))
            : setChangeStartCalendar(!changeStartCalendar);
        }}
      >
        <div className="calendar-icon size-5 flex items-center justify-center">
          <CalendarBtnIcon className="size-4" />
        </div>
        <span className="text-xs !leading-3 font-[600] select-none result-selection-text">Today</span>
      </div>
      <div
        className={`compare-btn flex items-center bg-white px-3 py-1 w-fit rounded-lg shadow-sm shadow-black/30 text-[#303030] fill-[#303030] active:!shadow-[inset_2px_0px_7px_rgba(0,0,0,0.2)] cursor-pointer ${
          changeEndCalendar ? "shadow-[inset_2px_0px_7px_rgba(0,0,0,0.2)]" : ""
        }`}
        onClick={() => {
          changeStartCalendar
            ? (setChangeStartCalendar(false), setChangeEndCalendar(true))
            : setChangeEndCalendar(!changeEndCalendar);
        }}
      >
        <span className="text-xs !leading-3 font-[600] select-none">
          No comparison
        </span>
      </div>
      {(changeStartCalendar) && (
        <div className="calendar-container-wrapper absolute top-full mt-2 left-0 w-max h-max max-h-[380px] max-w-[730px] bg-white rounded-lg shadow-[0_0_5px_rgba(0,0,0,0.2)] z-50 transition-all ease-in-out duration-300">
          <CalendarWrapper controlClose={handleCalendarClose} />
        </div>
      )}
    </div>
  );
};

export default ActionBtns;
