import CalenderBtnIcon from "../../../assets/pages/analytics/CalenderBtnIcon";

const ActionBtns = () => {
  return (
    <div className="action-btns flex gap-2 mt-1">
      <div className="today-btn flex gap-0.5 items-center bg-white pl-[6px] pr-3 py-1 w-fit rounded-lg shadow-sm shadow-black/30 text-[#303030] fill-[#303030] active:!shadow-[inset_2px_0px_7px_rgba(0,0,0,0.2)] cursor-pointer">
        <div className="calender-icon size-5 flex items-center justify-center">
          <CalenderBtnIcon className="size-4" />
        </div>
        <span className="text-xs !leading-3 font-[600] select-none">Today</span>
      </div>
      <div className="compare-btn flex items-center bg-white px-3 py-1 w-fit rounded-lg shadow-sm shadow-black/30 text-[#303030] fill-[#303030] active:!shadow-[inset_2px_0px_7px_rgba(0,0,0,0.2)] cursor-pointer">
        <span className="text-xs !leading-3 font-[600] select-none">
          Compare to: Yesterday
        </span>
      </div>
    </div>
  );
};

export default ActionBtns;
