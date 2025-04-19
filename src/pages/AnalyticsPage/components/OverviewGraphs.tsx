import { JSX, useContext, useEffect, useState } from "react";
import MinusIcon from "../../../assets/svg/MinusIcon";
import MultiAxisChart from "@/components/Graphs/MultiAxisChart";
import { formatDate, GraphInputData } from "./GraphContent";
import { LayoutContext } from "@/layout";
import { fetchAllData } from "@/firebase/firebase";
import { formatCurrency } from "../utils";
import { differenceInDays } from "date-fns";

type OverviewData = {
  name: string;
  type: string;
  dataContent: JSX.Element;
};

interface OverviewGraphsProps {
  storeId?: string;
}

const OverviewGraphs = ({ storeId }: OverviewGraphsProps) => {
  const [fetchedData, setFetchedData] = useState<GraphInputData>();
  const { selectedValues } = useContext(LayoutContext);
  const [moreThanOneDay, setMoreThanOneDay] = useState<boolean>(false);

  const generateLabels = (type: string) => {
    switch (type) {
      case "time":
        return Array.from({ length: 24 }, (_, i) => {
          const hour = i % 12 === 0 ? 12 : i % 12;
          const period = i < 12 ? "AM" : "PM";
          return `${hour}:00 ${period}`;
        });
      case "date":
        const labels = [];
        if (selectedValues.range1 && selectedValues.range2) {
          for (
            let d = new Date(selectedValues.range1);
            d <= new Date(selectedValues.range2);
            d.setDate(d.getDate() + 1)
          ) {
            labels.push(
              d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })
            );
          }
        }
        return labels;
      default:
        return [];
    }
  };

  const fetchData = async () => {
    if (selectedValues.range1 && selectedValues.range2) {
      return fetchAllData(
        formatDate(selectedValues.range1),
        formatDate(selectedValues.range2),
        storeId
      );
    }
  };

  useEffect(() => {
    setFetchedData(undefined);

    if (selectedValues.range1 && selectedValues.range2) {
      const startDate = new Date(selectedValues.range1);
      const endDate = new Date(selectedValues.range2);
      setMoreThanOneDay(differenceInDays(endDate, startDate) > 1);

      const result = fetchData();
      result.then((data) => {
        setFetchedData(data);
      });
    }
  }, [selectedValues, storeId]);

  const data: OverviewData[] = [
    {
      name: "Gross sales",
      type: "ruppee",
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
      type: "percent",
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
      type: "number",
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
      type: "number",
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
          <div className="overview-info flex justify-between items-center gap-8 h-fit">
            <div className="font-semibold text-sm flex gap-2 items-center">
              <span>
                {fetchedData &&
                  (item.type === "ruppee"
                    ? formatCurrency(
                        eval(
                          fetchedData[
                            item.name.replace(/\s+/g, "_").toLowerCase()
                          ].dataset
                            .reduce(
                              (acc, curr) =>
                                acc +
                                (Array.isArray(curr.data)
                                  ? Math.floor(curr.data.reduce((a, b) => a + b, 0))
                                  : 0),
                              0
                            )
                            .toString()
                        )
                      )
                    : eval(
                        fetchedData[
                          item.name.replace(/\s+/g, "_").toLowerCase()
                        ].dataset
                          .reduce(
                            (acc, curr) =>
                              acc +
                              (Array.isArray(curr.data)
                                ? Math.ceil(curr.data.reduce((a, b) => a + b, 0))
                                : curr.data),
                            0
                          )
                          .toString()
                      ))}
              </span>
              {fetchedData &&
                eval(
                  fetchedData[
                    item.name.replace(/\s+/g, "_").toLowerCase()
                  ].dataset
                    .reduce(
                      (acc, curr) =>
                        acc +
                        (Array.isArray(curr.data)
                          ? curr.data.reduce((a, b) => a + b, 0)
                          : curr.data),
                      0
                    )
                    .toString()
                ) == "0" && <MinusIcon className="size-4 text-[#303030]" />}
            </div>
            <div className="graph-container bg-[#f5f5f5] rounded-lg w-full h-[20px] overflow-y-visible">
              {fetchedData ? (
                <MultiAxisChart
                  data={{
                    labels: moreThanOneDay
                      ? generateLabels("date")
                      : generateLabels("time"),
                    datasets:
                      fetchedData[item.name.replace(/\s+/g, "_").toLowerCase()]
                        .dataset,
                  }}
                  smallGraph={true}
                  className="!h-[30px] bg-white"
                />
              ) : (
                <div></div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OverviewGraphs;
