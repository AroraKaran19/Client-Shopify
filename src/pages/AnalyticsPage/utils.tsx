import { JSX } from "react";

export type GraphContentData = {
  name: string;
  value?: string;
  type: "ruppee" | "percent" | "number" | "line" | "donut";
  dataContent: JSX.Element;
  minMax?: { min: number; max: number };
  steps?: number;
};

export interface GraphData {
  children?: GraphData[];
  data: GraphContentData;
}

const handleDataContent = (heading: string, text: string, formula?: {prefix: string, suffix: string}) => {
  return (
    <div className="content-data flex flex-col gap-2 text-[13px] leading-4">
      <h3 className="content-heading text-[#303030] font-semibold">
        {heading}
      </h3>
      <p className="content-text text-[#303030] font-[500] flex-wrap">
        {text}
      </p>
      {formula && (
        <p className="content-extra font-['Courier_Prime'] font-normal">
          <span className="text-blue-900">{formula.prefix} {" "}</span>
          <span className="text-green-800">{formula.suffix}</span>
        </p>
      )}
    </div>
  );
};

export function generateGraphData({
  name,
  value,
  type,
  dataContent,
}: {
  name: string;
  value?: string;
  type: "ruppee" | "percent" | "number" | "line" | "donut";
  dataContent: { heading: string; text: string; formula?: { prefix: string, suffix: string } };
  minMax?: { min: number; max: number };
  steps?: number;
}) {
  return {
    name: name,
    value: value,
    type: type,
    dataContent: handleDataContent(
      dataContent.heading,
      dataContent.text,
      dataContent.formula
    ),
  };
}
