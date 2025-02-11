import { JSX } from "react";
import MinusIcon from "../../../assets/svg/MinusIcon";

type OverviewData = {
  name: string;
  value: string;
  dataContent: JSX.Element;
};

const OverviewGraphs = () => {
  const data: OverviewData[] = [
    {
      name: "Gross sales",
      value: "₹0",
      dataContent: (
        <div className="content-data flex flex-col gap-2 text-[13px] leading-4">
          <h3 className="content-heading text-[#303030] font-semibold">
            Gross sales over time
          </h3>
          <p className="content-text text-[#303030] font-normal flex-wrap">
            Rough sales revenue, before discounts and returns are factored in
            over time
          </p>
        </div>
      ),
    },
    {
      name: "Returning customer rate",
      value: "0%",
      dataContent: (
        <div className="content-data flex flex-col gap-2 text-[13px] leading-4">
          <h3 className="content-heading text-[#303030] font-semibold">
            Returning customer rate over time
          </h3>
          <p className="content-text text-[#303030] font-normal flex-wrap">
            Percentage of customers who placed an order that were returning
            customers
          </p>
          <p className="content-extra font-['Courier_Prime'] font-normal">
            <span className="text-blue-900">Returning customer rate = </span>
            <span className="text-green-800">
              returning customers / customers
            </span>
          </p>
        </div>
      ),
    },
    {
      name: "Orders fulfilled",
      value: "0",
      dataContent: (
        <div className="content-data flex flex-col">
          <h3 className="content-heading text-sm text-[#303030] font-semibold">
            Orders fulfilled over time
          </h3>
          <p className="content-text text-sm !leading-none text-[#303030] font-normal flex-wrap">
            Total orders that have been marked as fulfilled
          </p>
        </div>
      ),
    },
    {
      name: "Orders",
      value: "0",
      dataContent: (
        <div className="content-data flex flex-col">
          <h3 className="content-heading text-sm text-[#303030] font-semibold">
            Orders over time
          </h3>
          <p className="content-text text-sm !leading-none text-[#303030] font-normal flex-wrap">
            Number of orders across all sales channels
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="overview-graphs flex gap-4 sm:flex-col">
      {data.map((item, index) => (
        <div
          key={index}
          className={`${item.name
            .toLowerCase()
            .replace(
              /\s+/g,
              "-"
            )}-overview-graph w-[calc(100%/4-16px)] h-max last:w-1/4 flex-shrink-0 flex flex-col gap-1 bg-white hover:bg-[#f1f1f1] p-4 rounded-xl shadow-[0_0_3px_rgba(0,0,0,0.2)] cursor-pointer sm:w-full sm:last:w-full`}
        >
          <div className="overview-heading w-fit h-fit relative">
            <h3 className="font-semibold border-b-2 border-dotted border-[#cccccc] text-sm text-[#303030]">
              {item.name}
            </h3>
            <div className="content absolute w-max max-w-[320px] top-full bg-white rounded-xl p-4 shadow-[0_0_5px_rgba(0,0,0,0.2)] hidden">
              {item.dataContent}
            </div>
          </div>
          <div className="overview-info flex justify-between items-center">
            <div className="font-semibold text-sm flex gap-2 items-center">
              <span>{item.value}</span>
              {item.value.match(/-?\d+/)?.[0] == "0" && (
                <MinusIcon className="size-4 text-[#303030]" />
              )}
            </div>
            <div className="graph-container mt-3 bg-[#f5f5f5] rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OverviewGraphs;
