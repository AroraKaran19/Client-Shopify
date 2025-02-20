import { useContext, useEffect, useState } from "react";
import TickIcon from "@/assets/svg/TickIcon";
import Calendar from "./components/Calendar";
import CalendarDateWrapper from "./CalendarDateWrapper";
import DateInputBox from "./components/DateInputBox";
import RightSlimArrowIcon from "@/assets/svg/RightSlimArrowIcon";
import { LayoutContext } from "@/layout";

export interface DurationOption {
  name: string;
  value: string;
  active?: boolean;
  range: { range1: Date; range2: Date };
}

const CalendarWrapper = ({ controlClose }: { controlClose: () => void }) => {
  const [inputPreviousValue, setInputPreviousValue] = useState<Date>(
    new Date()
  );
  const [inputNextValue, setInputNextValue] = useState<Date>(new Date());
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [date, setDate] = useState<Date>(new Date());
  const [changes, setChanges] = useState<boolean>(false);
  const {
    durationOptions,
    setDurationOptions,
    selectedValues,
    setSelectedValues,
  } = useContext(LayoutContext);

  const handleDurationSelection = (index: number) => {
    const tempDurationOptions = durationOptions.map((option, i) => ({
      ...option,
      active: i === index,
    }));
    setDurationOptions(tempDurationOptions);
  };

  useEffect(() => {
    if (selectedValues.range1 && selectedValues.range2) {
      if (
        selectedValues.range1.toLocaleDateString() ==
          inputPreviousValue.toLocaleDateString() &&
        selectedValues.range2.toLocaleDateString() ==
          inputNextValue.toLocaleDateString()
      ) {
        setChanges(false);
      } else {
        setChanges(true);
      }
    } else {
      setChanges(true);
    }
  }, [inputPreviousValue, inputNextValue, selectedValues]);

  return (
    <CalendarDateWrapper
      date={date}
      setDate={setDate}
      durationOption={durationOptions.filter((option) => option.active)[0]}
      currentDate={currentDate}
      setCurrentDate={setCurrentDate}
      inputPreviousValue={inputPreviousValue}
      inputNextValue={inputNextValue}
      setPreviousInputValue={setInputPreviousValue}
      setNextInputValue={setInputNextValue}
    >
      <>
        <div className="calendar-wrapper h-full w-full flex">
          <div className="duration-selection flex flex-col overflow-y-auto p-1.5 rounded-lg w-[201px] max-w-[201px] max-h-[332px] gap-1 sm:hidden">
            {durationOptions.map((option, index) => (
              <div
                key={index}
                className={`duration-option flex items-center justify-between p-1.5 cursor-pointer rounded-lg whitespace-break-spaces select-none transition-all duration-150 ease-in-out leading-[20px] ${
                  option.active
                    ? "bg-black/10"
                    : "hover:bg-black/5 active:bg-black/10"
                }`}
                onClick={() => handleDurationSelection(index)}
              >
                <span
                  className={`text-black/80 text-[0.875rem] transition-all duration-150 ease-in-out ${
                    option.active ? "font-semibold !text-black" : "font-normal"
                  }`}
                >
                  {option.name}
                </span>
                {option.active && <TickIcon className="size-4" />}
              </div>
            ))}
          </div>

          <div className="calendar-selection-wrapper p-4 flex flex-col gap-6 items-center w-max text-black/80 font-['Roboto',sans-serif] font-[450]">
            <div className="date-inputs w-full flex gap-2 items-center leading-none">
              <DateInputBox
                value={inputPreviousValue}
              />
              <RightSlimArrowIcon className="size-4" />
              <DateInputBox
                value={inputNextValue}
              />
            </div>
            <div className="calendar-container h-full w-full flex gap-4">
              <Calendar
                currentDate={
                  new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() - 1,
                    currentDate.getDate()
                  )
                }
                previousMonthCalendar={true}
              />
              <Calendar currentDate={currentDate} />
            </div>
          </div>
        </div>
        <div className="calendar-action-btns w-full p-3 bg-white rounded-bl-lg rounded-br-lg border-t flex gap-2 justify-end items-center">
          <div
            className="cancel-btn flex justify-center items-center bg-white border py-1 px-2 rounded-lg cursor-pointer select-none text-black/80 font-['Roboto',sans-serif] font-[550] text-xs shadow-sm shadow-black/20 active:shadow-[inset_2px_0px_7px_rgba(0,0,0,0.2)]"
            onClick={controlClose}
          >
            <span>Cancel</span>
          </div>
          <div
            className={`apply-btn flex justify-center items-center ${
              changes
                ? "bg-black text-white cursor-pointer active:shadow-[inset_4px_-2px_4px_rgba(255,255,255,0.5)]"
                : "bg-black/30 text-white"
            } py-1 px-2 rounded-lg select-none text-black/80 font-['Roboto',sans-serif] font-[550] text-xs`}
            onClick={() => {
              if (changes) {
                setSelectedValues({
                  range1: inputPreviousValue,
                  range2: inputNextValue,
                });
                controlClose();
              }
            }}
            title={!changes ? "No changes" : undefined}
          >
            <span>Apply</span>
          </div>
        </div>
      </>
    </CalendarDateWrapper>
  );
};

export default CalendarWrapper;
