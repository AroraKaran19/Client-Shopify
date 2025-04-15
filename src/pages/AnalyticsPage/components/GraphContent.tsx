import { useContext, useEffect, useState } from "react";
import { formatCurrency, generateGraphData } from "../utils";
import GraphContainerBox from "./GraphContainerBox";
import { LayoutContext } from "@/layout";
import { fetchAllData } from "@/firebase/firebase";
import { differenceInDays } from "date-fns";

const conversionRateBreakdownValue = "5%";
const conversionRateBreakdownImage = "/default-rate-breakdown.png";
const sessionByDeviceTypeImage = "/default-device-sessions.png";

export interface GraphInputData {
  [key: string]: {
    dataset: {
      label: string;
      data: number[] | number;
    }[];
  };
}

export const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

interface GraphContentProps {
  storeId?: string;
}

const GraphContent = ({ storeId }: GraphContentProps) => {
  const { selectedValues } = useContext(LayoutContext);
  const [data, setData] = useState<GraphInputData>();
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
    setData(undefined);

    if (selectedValues.range1 && selectedValues.range2) {
      const startDate = new Date(selectedValues.range1);
      const endDate = new Date(selectedValues.range2);
      setMoreThanOneDay(differenceInDays(endDate, startDate) > 1);

      const result = fetchData();
      result.then((data) => {
        setData(data);
      });
    }
  }, [selectedValues, storeId]);

  return (
    <>
      {data ? (
        <div className="graph-content flex gap-4 sm:flex-col">
          <div className="graph-content_column_1 w-[67%] flex flex-col gap-4 sm:w-full">
            <div className="graph-content_c1_row_1">
              <GraphContainerBox
                graphInfo={generateGraphData({
                  name: "Total sales over time",
                  type: "ruppee",
                  value:
                    (data &&
                      formatCurrency(
                        data?.total_sales_over_time.dataset.reduce(
                          (prev, dataset) =>
                            prev +
                            (Array.isArray(dataset.data)
                              ? dataset.data.reduce((a, b) => a + b, 0)
                              : dataset.data),
                          0
                        )
                      ).toString()) ||
                    "",
                  dataContent: {
                    heading: "Total sales over time",
                    text: "Amount spent (subtotal, taxes, shipping, returns, discounts, fees, etc.)",
                    formula: {
                      prefix: "Total sales =",
                      suffix:
                        "net sales + additional fees + duties + shipping charges + taxes",
                    },
                  },
                  minMax: {
                    min: 0,
                  },
                  steps:
                    data?.total_sales_over_time.dataset.reduce(
                      (prev, dataset) =>
                        prev +
                        (Array.isArray(dataset.data)
                          ? dataset.data.reduce((a, b) => a + b, 0)
                          : dataset.data),
                      0
                    ) > 0
                      ? undefined
                      : 5,
                  showLabel: moreThanOneDay ? true : false,
                })}
                className="h-[389px] !w-full"
                graphData={{
                  labels: moreThanOneDay
                    ? generateLabels("date")
                    : generateLabels("time"),
                  datasets: data?.total_sales_over_time.dataset || [],
                }}
              />
            </div>

            <div className="graph-content_c1_row_2 flex gap-4 sm:flex-col">
              <div className="graph-content-c1_row_2_c1 w-1/2 flex flex-col gap-4 sm:w-full">
                <GraphContainerBox
                  graphInfo={generateGraphData({
                    name: "Conversion rate breakdown",
                    value: conversionRateBreakdownValue,
                    type: "image",
                    dataContent: {
                      heading: "Conversion rate breakdown",
                      text: "Breakdown of percentage of online store sessions that result in a sale",
                      formula: {
                        prefix: "Conversion rate =",
                        suffix: "sessions that completed checkout / sessions",
                      },
                    },
                  })}
                  className="h-[344px] !w-full"
                  placeholderImage={conversionRateBreakdownImage}
                />
                <GraphContainerBox
                  graphInfo={generateGraphData({
                    name: "Sessions over time",
                    type: "number",
                    dataContent: {
                      heading: "Sessions over time",
                      text: "Number of user sessions in your online store",
                    },
                  })}
                  className="h-[344px] !w-full"
                />
                <GraphContainerBox
                  graphInfo={generateGraphData({
                    name: "Sessions by social referrer",
                    type: "number",
                    dataContent: {
                      heading: "Sessions by social referrer",
                      text: "Sessions in your online store from social sources, broken down by name",
                    },
                  })}
                  className="h-[344px] !w-full"
                />
              </div>
              <div className="graph-content-c1_row_2_c2 w-1/2 flex flex-col gap-4 sm:w-full">
                <GraphContainerBox
                  graphInfo={generateGraphData({
                    name: "Average order value over time",
                    type: "ruppee",
                    value:
                      (data &&
                        formatCurrency(
                          data?.average_order_value_over_time.dataset.reduce(
                            (prev, data) =>
                              prev +
                              (Array.isArray(data.data)
                                ? data.data.reduce((a, b) => a + b, 0)
                                : data.data),
                            0
                          )
                        ).toString()) ||
                      "",
                    dataContent: {
                      heading: "Average order value over time",
                      text: "Average order value, factoring in discounts",
                      formula: {
                        prefix: "Average order value =",
                        suffix: "(gross sales - discounts) / orders",
                      },
                    },
                    minMax: {
                      min: 0,
                    },
                    steps:
                      data?.average_order_value_over_time.dataset.reduce(
                        (prev, data) =>
                          prev +
                          (Array.isArray(data.data)
                            ? data.data.reduce((a, b) => a + b, 0)
                            : data.data),
                        0
                      ) > 0
                        ? undefined
                        : 5,
                    showLabel: moreThanOneDay ? true : false,
                  })}
                  className="h-[254px] !w-full"
                  graphData={{
                    labels: moreThanOneDay
                      ? generateLabels("date")
                      : generateLabels("time"),
                    datasets: data?.average_order_value_over_time.dataset || [],
                  }}
                />
                <GraphContainerBox
                  graphInfo={generateGraphData({
                    name: "Sessions by location",
                    type: "number",
                    dataContent: {
                      heading: "Sessions by location",
                      text: "Sessions in your online store, broken down by geographic location",
                    },
                  })}
                  className="h-[344px] !w-full"
                />
                <GraphContainerBox
                  graphInfo={generateGraphData({
                    name: "Top referrers by sessions",
                    type: "number",
                    dataContent: {
                      heading: "Top referrers by sessions",
                      text: "External websites that directed the most sessions to your online store.",
                    },
                  })}
                  className="h-[344px] !w-full"
                />
              </div>
            </div>

            <div className="graph-content_c1_row_3">
              <GraphContainerBox
                graphInfo={generateGraphData({
                  name: "Customer cohort analysis",
                  type: "number",
                  dataContent: {
                    heading: "Customer cohort analysis",
                    text: "Percentages of customer groups that returned to your store and made repeat purchases. These cohorts are grouped by their first purchase date.",
                  },
                })}
                className="h-[344px] !w-full"
              />
            </div>

            <div className="graph-content_c1_row_4 flex gap-4 sm:flex-col">
              <div className="graph-content-c1_row_4_c1 w-1/2 flex flex-col gap-4 sm:w-full">
                <GraphContainerBox
                  graphInfo={generateGraphData({
                    name: "Sessions by referrer",
                    type: "number",
                    dataContent: {
                      heading: "Sessions by referrer",
                      text: "Sessions in your online store, broken down by the name of the site that led to the session",
                    },
                  })}
                  className="h-[344px] !w-full"
                />
                <GraphContainerBox
                  graphInfo={generateGraphData({
                    name: "POS staff sales total",
                    type: "number",
                    dataContent: {
                      heading: "POS staff sales total",
                      text: "Number of sales made by the staff member of your retail location",
                      formula: {
                        prefix: "Total sales =",
                        suffix:
                          "net sales + additional fees + duties + shipping charges + taxes",
                      },
                    },
                  })}
                  className="h-[344px] !w-full"
                />
              </div>
              <div className="graph-content-c1_row_4_c2 w-1/2 flex flex-col gap-4 sm:w-full">
                <GraphContainerBox
                  graphInfo={generateGraphData({
                    name: "Total sales by referrer",
                    type: "number",
                    dataContent: {
                      heading: "Total sales by referrer",
                      text: "Total sales, broken down by the name of the site that led to the order",
                      formula: {
                        prefix: "Total sales =",
                        suffix:
                          "net sales + additional fees + duties + shipping charges + taxes",
                      },
                    },
                  })}
                  className="h-[344px] !w-full"
                />
                <GraphContainerBox
                  graphInfo={generateGraphData({
                    name: "Total sales by POS location",
                    type: "ruppee",
                    dataContent: {
                      heading: "Total sales by POS location",
                      text: "Total sales, broken down by physical store location",
                      formula: {
                        prefix: "Total sales =",
                        suffix:
                          "net sales + additional fees + duties + shipping charges + taxes",
                      },
                    },
                  })}
                  className="h-[344px] !w-full"
                />
              </div>
            </div>
          </div>
          <div className="graph-content_column_2 w-[33%] flex flex-col gap-4 sm:w-full">
            <GraphContainerBox
              graphInfo={generateGraphData({
                name: "Conversion rate over time",
                type: "percent",
                value:
                  (data &&
                    data?.conversion_rate_over_time.dataset
                      .reduce(
                        (prev, data) =>
                          prev +
                          (Array.isArray(data.data)
                            ? data.data.reduce((a, b) => a + b, 0)
                            : data.data),
                        0
                      )
                      .toString() + "%") ||
                  "",
                dataContent: {
                  heading: "Conversion rate over time",
                  text: "Percentage of online store sessions that result in a sale",
                  formula: {
                    prefix: "Conversion rate =",
                    suffix: "sessions that completed checkout / sessions",
                  },
                },
                showLabel: moreThanOneDay ? true : false,
              })}
              className="h-[344px] !w-full"
              graphData={{
                labels: moreThanOneDay
                  ? generateLabels("date")
                  : generateLabels("time"),
                datasets: data?.conversion_rate_over_time.dataset || [],
              }}
            />
            <GraphContainerBox
              graphInfo={generateGraphData({
                name: "Sessions by device type",
                type: "image",
                dataContent: {
                  heading:
                    "Sessions in your online store, broken down by the user's device type",
                  text: "Total sales for the selected date range",
                },
              })}
              className="h-[344px] !w-full"
              placeholderImage={sessionByDeviceTypeImage}
            />
            <GraphContainerBox
              graphInfo={generateGraphData({
                name: "Total sales by product",
                type: "ruppee",
                dataContent: {
                  heading: "Total sales by product",
                  text: "Total sales for the selected date range",
                  formula: {
                    prefix: "Total sales =",
                    suffix:
                      "net sales + additional fees + duties + shipping charges + taxes",
                  },
                },
              })}
              className="h-[254px] !w-full"
            />
            <GraphContainerBox
              graphInfo={generateGraphData({
                name: "Customers by location",
                type: "number",
                dataContent: {
                  heading: "Customers by location",
                  text: "Amount customers have spent, broken down by customers' geographic locations",
                },
              })}
              className="h-[344px] !w-full"
            />
            <GraphContainerBox
              graphInfo={generateGraphData({
                name: "Total sales by social referrer",
                type: "number",
                dataContent: {
                  heading: "Total sales by social referrer",
                  text: "Total sales from social sources, broken down by name",
                  formula: {
                    prefix: "Total sales =",
                    suffix:
                      "net sales + additional fees + duties + shipping charges + taxes",
                  },
                },
              })}
              className="h-[344px] !w-full"
            />
            <GraphContainerBox
              graphInfo={generateGraphData({
                name: "Sessions by landing page",
                type: "number",
                dataContent: {
                  heading: "Sessions by landing page",
                  text: "Sessions in your online store, broken down by the page the user first landed on",
                },
              })}
              className="h-[344px] !w-full"
            />
            <GraphContainerBox
              graphInfo={generateGraphData({
                name: "Sales attributed to marketing",
                type: "number",
                dataContent: {
                  heading: "Sales attributed to marketing",
                  text: "Total sales for the selected date range",
                  formula: {
                    prefix: "Total sales =",
                    suffix:
                      "net sales + additional fees + duties + shipping charges + taxes",
                  },
                },
              })}
              className="h-[344px] !w-full"
            />
            <GraphContainerBox
              graphInfo={generateGraphData({
                name: "Products by sell-through rate",
                type: "number",
                dataContent: {
                  heading: "Products by sell-through rate",
                  text: "Percentage of the total inventory sold during the selected time period.",
                  formula: {
                    prefix: "Sell-through rate =",
                    suffix:
                      "Total quantity of items sold / [ total quantity of items sold + total quantity of items still in inventory ]",
                  },
                },
              })}
              className="h-[344px] !w-full"
            />
          </div>
        </div>
      ) : (
        <div className="w-full p-7 h-[500px]">
          <div className="flickering-container h-full w-full animate-pulse bg-black/20 rounded-xl transition-all ease-in-out"></div>
        </div>
      )}
    </>
  );
};

export default GraphContent;
