import React, { useMemo } from "react";
import { GraphContentData } from "../utils";
import MinusIcon from "../../../assets/svg/MinusIcon";
import MultiAxisChart, {
  ChartData,
} from "../../../components/Graphs/MultiAxisChart";
import MulitAxisChartPercent from "../../../components/Graphs/MulitAxisChartPercent";

const GraphContainerBox = ({
  graphInfo,
  graphData,
  className,
  style,
  placeholderImage,
}: {
  graphInfo: GraphContentData;
  graphData?: ChartData;
  className?: string;
  style?: React.CSSProperties;
  placeholderImage?: string;
}) => {
  const symbol = useMemo(() => {
    switch (graphInfo.type) {
      case "ruppee":
        return "₹";
      case "percent":
        return "%";
      default:
        return "";
    }
  }, [graphInfo.type]);

  // Process graphData to ensure no decimal values
  const processedGraphData = useMemo(() => {
    if (!graphData) return undefined;
    
    return {
      ...graphData,
      datasets: graphData.datasets.map(dataset => ({
        ...dataset,
        data: Array.isArray(dataset.data) 
          ? dataset.data.map(value => Math.round(value))
          : Math.round(dataset.data)
      }))
    };
  }, [graphData]);

  return (
    <div
      className={`${graphInfo.name
        .toLowerCase()
        .replace(
          /\s+/g,
          "-"
        )}-graph w-max flex-shrink-0 flex flex-col gap-1 bg-white rounded-xl shadow-[0_0_3px_rgba(0,0,0,0.2)] sm:w-full sm:last:w-full ${
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
      <div className="graph-info flex gap-4 flex-col justify-between px-4 pb-4 h-full w-full flex-grow">
        <div className="font-semibold text-xl !leading-6 flex gap-2 items-center h-max">
          <span>{graphInfo.value ?? symbol}</span>
          {graphInfo.value && graphInfo.value.match(/-?\d+/)?.[0] == "0" && (
            <MinusIcon className="size-5 text-[#303030]" />
          )}
        </div>
        <div
          className={`graph-container flex items-center justify-center h-full max-h-[calc(100%-38px)] w-full`}
        >
          {!processedGraphData ? (
            graphInfo.type === "image" ? (
              <img src={placeholderImage} alt={placeholderImage} draggable={false} />
            ) : (
              <p className="text-[rgb(97,97,97)] font-semibold text-center text-[13px] leading-5">
                There was no data found for this date range
              </p>
            )
          ) : (
            (graphInfo.type === "ruppee" && processedGraphData && (
              <MultiAxisChart
                data={processedGraphData}
                minMax={graphInfo?.minMax}
                steps={graphInfo?.steps}
                showLabel={graphInfo?.showLabel}
                showTooltip={graphInfo?.showTooltip}
              />
            )) ||
            (graphInfo.type === "percent" && typeof processedGraphData !== "number" && (
              <MulitAxisChartPercent data={processedGraphData} showLabel={graphInfo?.showLabel} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GraphContainerBox;
