import { JSX } from "react";

export type GraphContentData = {
  name: string;
  value?: string;
  dataContent?: JSX.Element;
};

export const graphData: GraphContentData[] = [
  {
    name: "Total sales over time",
    value: "₹0",
    dataContent: (
      <div className="content-data flex flex-col gap-2 text-[13px] leading-4">
        <h3 className="content-heading text-[#303030] font-semibold">
          Total sales over time
        </h3>
        <p className="content-text text-[#303030] font-normal flex-wrap">
          Amount spent (subtotal, taxes, shipping, returns, discounts, fees,
          etc.)
        </p>
        <p className="content-extra font-['Courier_Prime'] font-normal">
          <span className="text-blue-900">Total sales = </span>
          <span className="text-green-800">
            net sales + additional fees + duties + shipping charges + taxes
          </span>
        </p>
      </div>
    ),
  },
  {
    name: "Conversion rate over time",
    value: "0%",
    dataContent: (
      <div className="content-data flex flex-col gap-2 text-[13px] leading-4">
        <h3 className="content-heading text-[#303030] font-semibold">
          Conversion rate over time
        </h3>
        <p className="content-text text-[#303030] font-normal flex-wrap">
          Percentage of online store sessions that result in a sale
        </p>
        <p className="content-extra font-['Courier_Prime'] font-normal">
          <span className="text-blue-900">Conversion rate = </span>
          <span className="text-green-800">
            sessions that completed checkout / sessions
          </span>
        </p>
      </div>
    ),
  },
  {
    name: "Average order value over time",
    value: "₹0",
    dataContent: (
      <div className="content-data flex flex-col gap-2 text-[13px] leading-4">
        <h3 className="content-heading text-[#303030] font-semibold">
          Average order value over time
        </h3>
        <p className="content-text text-[#303030] font-normal flex-wrap">
          Average order value, factoring in discounts
        </p>
        <p className="content-extra font-['Courier_Prime'] font-normal">
          <span className="text-blue-900">Average order value = </span>
          <span className="text-green-800">
            (gross sales - discounts) / orders
          </span>
        </p>
      </div>
    ),
  },
  {
    name: "Total sales by product",
    dataContent: (
      <div className="content-data flex flex-col gap-2 text-[13px] leading-4">
        <h3 className="content-heading text-[#303030] font-semibold">
          Total sales by product
        </h3>
        <p className="content-text text-[#303030] font-normal flex-wrap">
          Total sales, broken down by product
        </p>
        <p className="content-extra font-['Courier_Prime'] font-normal">
          <span className="text-blue-900">Total sales = </span>
          <span className="text-green-800">
            net sales + additional fees + duties + shipping charges + taxes
          </span>
        </p>
      </div>
    ),
  },
  {
    name: "Sessions by social referrer",
    dataContent: (
      <div className="content-data flex flex-col gap-2 text-[13px] leading-4">
        <h3 className="content-heading text-[#303030] font-semibold">
          Sessions by social referrer
        </h3>
        <p className="content-text text-[#303030] font-normal flex-wrap">
          Sessions in your online store from social sources, broken down by name
        </p>
      </div>
    ),
  },
  {
    name: "Top referrers by sessions",
    dataContent: (
      <div className="content-data flex flex-col gap-2 text-[13px] leading-4">
        <h3 className="content-heading text-[#303030] font-semibold">
          Top referrers by sessions
        </h3>
        <p className="content-text text-[#303030] font-normal flex-wrap">
          Sessions in your online store from referrers, broken down by name
        </p>
      </div>
    ),
  }
];
