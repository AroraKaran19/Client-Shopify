import { useContext, useMemo } from "react";
import CalendarCell from "./CalendarCell";
import {
  addMonths,
  differenceInDays,
  endOfMonth,
  startOfMonth,
} from "date-fns";
import CalendarRightIcon from "@/assets/svg/Calendar/CalendarRightIcon";
import CalendarLeftIcon from "@/assets/svg/Calendar/CalendarLeftIcon";
import { CalendarDateContainer } from "../CalendarDateWrapper";
import EmptyCells from "./EmptyCells";

const Calendar = ({
  currentDate,
  previousMonthCalendar = false,
}: {
  currentDate: Date;
  previousMonthCalendar?: boolean;
}) => {
  const {
    date,
    setCurrentDate,
    dateRange,
    setDateRange,
    datesRangeValue,
    setDatesRangeValue,
    setNextInputValue,
    setPreviousInputValue,
  } = useContext(CalendarDateContainer);

  const { differenceDays, emptyStartCells, emptyEndCells } = useMemo(() => {
    const startDate = startOfMonth(currentDate);
    const endDate = endOfMonth(currentDate);
    const differenceDays = differenceInDays(endDate, startDate) + 1;
    const emptyStartCells = (startDate.getDay() + 6) % 7;
    const emptyEndCells = (7 - endDate.getDay()) % 7;
    return {
      startDate,
      endDate,
      differenceDays,
      emptyStartCells,
      emptyEndCells,
    };
  }, [currentDate]);

  const handleDateSelection = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const dateCell = target.closest(".date-cell");
    if (dateCell) {
      if (previousMonthCalendar) {
        const newDate = new Date(dateCell.children[0]?.classList[0]);
        if (!datesRangeValue.range1) {
          setDateRange(true);
          setDatesRangeValue({ ...datesRangeValue, range1: newDate });
          setPreviousInputValue(newDate);
          setNextInputValue(newDate); 
        } else if (
          !datesRangeValue.range2 &&
          newDate > datesRangeValue.range1 &&
          newDate < new Date()
        ) {
          setDatesRangeValue({ ...datesRangeValue, range2: newDate });
          setNextInputValue(newDate);
        } else {
          setDatesRangeValue({ range1: newDate });
          setPreviousInputValue(newDate);
          setNextInputValue(newDate);
        }
      } else {
        const newDate = new Date(dateCell.children[0]?.classList[0]);
        if (!datesRangeValue.range1) {
          setDateRange(true);
          setDatesRangeValue({ ...datesRangeValue, range1: newDate });
          setPreviousInputValue(newDate);
          setNextInputValue(newDate);
        } else if (
          !datesRangeValue.range2 &&
          newDate > datesRangeValue.range1 &&
          newDate < new Date()
        ) {
          setDatesRangeValue({ ...datesRangeValue, range2: newDate });
          setNextInputValue(newDate);
        } else {
          setDatesRangeValue({ range1: newDate });
          setPreviousInputValue(newDate);
          setNextInputValue(newDate);
        }
      }
    }
  };

  return (
    <div
      className={`${
        previousMonthCalendar
          ? "previous-month-calendar"
          : "next-month-calendar"
      } w-[236px] h-max`}
    >
      <div className="grid grid-cols-7 items-center justify-center text-center">
        <CalendarCell className="prev-month-icon">
          {previousMonthCalendar && (
            <CalendarLeftIcon
              className="size-4 text-black/50"
              onClick={() =>
                setCurrentDate(
                  new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth(),
                    currentDate.getDate()
                  )
                )
              }
            />
          )}
        </CalendarCell>
        <CalendarCell className="selected-month text-sm col-span-5 font-bold">
          {currentDate
            ? currentDate.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })
            : "No Date"}
        </CalendarCell>
        <CalendarCell className="next-month-icon">
          {!previousMonthCalendar &&
            (currentDate.getFullYear() < new Date().getFullYear() ||
              (currentDate.getFullYear() === new Date().getFullYear() &&
                currentDate.getMonth() < new Date().getMonth())) && (
              <CalendarRightIcon
                className="size-4 text-black/50"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              />
            )}
        </CalendarCell>

        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day, index) => {
          const Today = new Date();

          return (
            <CalendarCell
              key={day}
              className={`${index}-day-of-week font-bold ${
                index + 1 === Today.getDay() &&
                currentDate.getMonth() == Today.getMonth() &&
                currentDate.getFullYear() == Today.getFullYear() &&
                !dateRange
                  ? "text-black"
                  : "text-black/50"
              }`}
            >
              {day}
            </CalendarCell>
          );
        })}

        <EmptyCells emptyCells={emptyStartCells} />

        {Array.from({ length: differenceDays }).map((_, index) => {
          const indexDate = index + 1;
          const cellDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            indexDate
          );

          return (
            <CalendarCell
              key={indexDate}
              className={`date-cell  select-none ${
                cellDate < new Date()
                  ? "text-black hover:bg-black hover:text-white"
                  : "disabled text-black/20"
              }
              ${
                !datesRangeValue.range1
                  ? "hover:rounded-lg hover:rounded-r-none"
                  : datesRangeValue.range1 < cellDate
                  ? !datesRangeValue.range2
                    ? "hover:rounded-lg hover:rounded-l-none"
                    : "hover:rounded-lg"
                  : "hover:rounded-lg"
              } 
              ${
                date.toDateString() == cellDate.toDateString() &&
                !dateRange
                  ? "bg-black text-white rounded-lg"
                  : ""
              } 
              ${
                datesRangeValue.range1 &&
                datesRangeValue.range1.toLocaleDateString() ===
                  cellDate.toLocaleDateString()
                  ? "selected-dates !bg-black !text-white rounded-lg rounded-r-none"
                  : ""
              } 
              ${
                datesRangeValue.range2 &&
                datesRangeValue.range2.toLocaleDateString() ===
                  cellDate.toLocaleDateString()
                  ? "selected-dates !bg-black !text-white rounded-lg rounded-l-none"
                  : ""
              }
              ${
                datesRangeValue.range1 &&
                datesRangeValue.range2 &&
                datesRangeValue.range1 < cellDate &&
                datesRangeValue.range2 > cellDate
                  ? "selected-group bg-black/5 text-black"
                  : ""
              }
              `}
              onClick={cellDate < new Date() ? handleDateSelection : undefined}
            >
              <div className={`${cellDate.toISOString()}`}>{indexDate}</div>
            </CalendarCell>
          );
        })}

        <EmptyCells emptyCells={emptyEndCells} />
      </div>
    </div>
  );
};

export default Calendar;
