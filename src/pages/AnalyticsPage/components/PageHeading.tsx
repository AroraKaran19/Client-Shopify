import NewBtnIcon from "../../../assets/pages/analytics/NewBtnIcon";
import FocusInBtnIcon from "../../../assets/pages/analytics/FocusInBtnIcon";
import FocusOutBtnIcon from "../../../assets/pages/analytics/FocusOutBtnIcon";

const PageHeading = ({ focus, setFocus } : { focus: boolean; setFocus: (focus: boolean) => void }) => {

  return (
    <div className="page-heading flex justify-between items-center">
      <h2 className="font-bold text-[1.3rem] leading-6 text-[#303030]">Overview</h2>
      <div className="action-btns flex gap-2">
        <div className="new-btn p-1.5 bg-black/5 hover:bg-black/10 cursor-pointer rounded-lg flex items-center">
					<NewBtnIcon className="size-4" />
				</div>
        <div className="focus-btn p-1.5 bg-black/5 hover:bg-black/10 cursor-pointer rounded-lg flex items-center" onClick={() => setFocus(!focus)}>
					{!focus ? <FocusInBtnIcon className="size-4" /> : <FocusOutBtnIcon className="size-4" />}
				</div>
        <div className="customize-btn py-1 px-3 font-semibold cursor-pointer text-[12px] leading-none bg-[#303030] text-white rounded-lg flex items-center select-none">
					<span>Customize</span>
				</div>
      </div>
    </div>
  );
};

export default PageHeading;
