import React from "react";
import { GraphContentData } from "../utils";
import MinusIcon from "../../../assets/svg/MinusIcon";

const GraphContainerBox = ({
  graphInfo,
  className,
  style,
}: {
  graphInfo: GraphContentData;
  className?: string;
  style?: React.CSSProperties;
}) => {
  return (
    <div
      className={`${graphInfo.name
        .toLowerCase()
        .replace(
          /\s+/g,
          "-"
        )}-graph w-max h-max flex-shrink-0 flex flex-col gap-1 bg-white rounded-xl shadow-[0_0_3px_rgba(0,0,0,0.2)] sm:w-full sm:last:w-full ${
        className || ""
      }`}
      style={style}
    >
      <div className="graph-heading w-full h-fit relative pt-4 px-4 hover:bg-[#f1f1f1] cursor-pointer">
        <h3 className="font-semibold border-b-2 border-dotted border-[#cccccc] text-sm text-[#303030] w-max">
          {graphInfo.name}
        </h3>
        <div className="content absolute w-max max-w-[320px] top-full bg-white rounded-xl p-4 shadow-[0_0_5px_rgba(0,0,0,0.2)] hidden">
          {graphInfo.dataContent}
        </div>
      </div>
      <div className="graph-info flex gap-4 flex-col justify-between px-4 pb-4 h-full w-full">
        <div className="font-semibold text-xl !leading-6 flex gap-2 items-center h-max">
          <span>{graphInfo.value}</span>
          {graphInfo.value && graphInfo.value.match(/-?\d+/)?.[0] == "0" && (
            <MinusIcon className="size-4 text-[#303030]" />
          )}
        </div>
        <div className={`graph-container rounded-lg h-full w-full flex items-center justify-center ${graphInfo.value ? "bg-[#f1f1f1]" : ""}`}>
          {!graphInfo.value ? (
            <p className="text-[rgb(97,97,97)] font-semibold text-center text-[13px] leading-5">
              There was no data found for this date range
            </p>
          ) : (
            <p className="text-[rgb(97,97,97)] font-semibold text-center text-[13px] leading-5">
              No data available
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GraphContainerBox;
