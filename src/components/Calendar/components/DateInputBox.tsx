
const DateInputBox = ({ value } : { value: Date }) => {

  return (
    <input
      type="text"
      className="w-[228px] sm:w-[132px] border-[1px] border-black/30 outline-none rounded-lg py-[6px] px-3 sm:py-[10px] sm:px-[12px] text-[13px] sm:text-base cursor-default"
      placeholder={value.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      value={value.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      readOnly
    />
  );
};

export default DateInputBox;
