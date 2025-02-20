import React, { createContext, useContext, useEffect, useState } from "react";
import { DurationOption } from "./CalendarWrapper";
import { LayoutContext } from "@/layout";

interface CalendarDateContainerProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  date: Date;
  setDate: (date: Date) => void;
  dateRange: boolean;
  setDateRange: (dateRange: boolean) => void;
  datesRangeValue: { range1?: Date; range2?: Date };
  setDatesRangeValue: (datesRangeValue: {
    range1?: Date;
    range2?: Date;
  }) => void;
  inputPreviousValue: Date;
  setPreviousInputValue: (value: Date) => void;
  inputNextValue: Date;
  setNextInputValue: (value: Date) => void;
}

export const CalendarDateContainer = createContext<CalendarDateContainerProps>(
  {} as CalendarDateContainerProps
);

const CalendarDateWrapper = ({
  children,
  durationOption,
  currentDate,
  setCurrentDate,
  date,
  setDate,
  inputPreviousValue,
  inputNextValue,
  setPreviousInputValue,
  setNextInputValue,
}: {
  children: React.ReactElement;
  durationOption: DurationOption;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  date: Date;
  setDate: (date: Date) => void;
  inputPreviousValue: Date;
  setPreviousInputValue: (value: Date) => void;
  inputNextValue: Date;
  setNextInputValue: (value: Date) => void;
}) => {
  const [dateRange, setDateRange] = useState<boolean>(false);
  const { datesRangeValue, setDatesRangeValue } = useContext(LayoutContext);

  useEffect(() => {
    if (durationOption) {
      switch (durationOption.value) {
        case "today":
          setDate(durationOption.range.range1);
          setDateRange(false);
          setDatesRangeValue({});
          setPreviousInputValue(durationOption.range.range1);
          setNextInputValue(durationOption.range.range2);
          break;
        case "yesterday":
          setDate(durationOption.range.range1);
          setDateRange(false);
          setDatesRangeValue({});
          setPreviousInputValue(durationOption.range.range1);
          setNextInputValue(durationOption.range.range2);
          break;
        case "last_7_days":
          setDate(durationOption.range.range1);
          setDateRange(true);
          setDatesRangeValue({ range1: durationOption.range.range1, range2: durationOption.range.range2 });
          setPreviousInputValue(durationOption.range.range1);
          setNextInputValue(durationOption.range.range2);
          break;
        case "last_30_days":
          setDate(durationOption.range.range1);
          setDateRange(true);
          setDatesRangeValue({ range1: durationOption.range.range1, range2: durationOption.range.range2 });
          setPreviousInputValue(durationOption.range.range1);
          setNextInputValue(durationOption.range.range2);
          break;
        case "last_90_days":
          setDate(durationOption.range.range1);
          setDateRange(true);
          setDatesRangeValue({ range1: durationOption.range.range1, range2: durationOption.range.range2 });
          setPreviousInputValue(durationOption.range.range1);
          setNextInputValue(durationOption.range.range2);
          break;
        case "last_365_days":
          setDate(durationOption.range.range1);
          setDateRange(true);
          setDatesRangeValue({ range1: durationOption.range.range1, range2: durationOption.range.range2 });
          setPreviousInputValue(durationOption.range.range1);
          setNextInputValue(durationOption.range.range2);
          break;
        case "last_month":
          setDate(durationOption.range.range1);
          setDateRange(true);
          setDatesRangeValue({
            range1: durationOption.range.range1,
            range2: durationOption.range.range2,
          });
          setPreviousInputValue(
            durationOption.range.range1
          );
          setNextInputValue(
            durationOption.range.range2
          );
          break;
        case "last_12_months":
          setDate(durationOption.range.range1);
          setDateRange(true);
          setDatesRangeValue({
            range1: durationOption.range.range1,
            range2: durationOption.range.range2,
          });
          setPreviousInputValue(
            durationOption.range.range1
          );
          setNextInputValue(
            durationOption.range.range2
          );
          break;
        case "last_year":
          setDate(durationOption.range.range1);
          setDateRange(true);
          setDatesRangeValue({
            range1: durationOption.range.range1,
            range2: durationOption.range.range2,
          });
          setPreviousInputValue(
            durationOption.range.range1
          );
          setNextInputValue(
            durationOption.range.range2
          );
          break;
        default:
          break;
      }
    }
  }, [durationOption]);

  return (
    <CalendarDateContainer.Provider
      value={{
        currentDate,
        setCurrentDate,
        date,
        setDate,
        dateRange,
        setDateRange,
        datesRangeValue,
        setDatesRangeValue,
        inputPreviousValue,
        setPreviousInputValue,
        inputNextValue,
        setNextInputValue,
      }}
    >
      {children}
    </CalendarDateContainer.Provider>
  );
};

export default CalendarDateWrapper;
