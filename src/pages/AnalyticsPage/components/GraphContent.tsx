import { useContext, useEffect, useState } from "react";
import { generateGraphData } from "../utils";
import GraphContainerBox from "./GraphContainerBox";
import { LayoutContext } from "@/layout";
import { generateData } from "../graphData";

interface GraphInputData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}

const GraphContent = () => {
  const { selectedValues } = useContext(LayoutContext);
  const [data, setData] = useState<{
    total_sales: GraphInputData;
    conversion_rate_over_time: GraphInputData,
    average_order_value_over_time: GraphInputData,
    sessions_over_time: GraphInputData
  }>({} as any);

  useEffect(() => {
    setData({
      ...data,
      total_sales: generateData(selectedValues.range1 as Date ?? new Date(), selectedValues.range2 as Date ?? new Date()),
      conversion_rate_over_time: generateData(selectedValues.range1 as Date ?? new Date(), selectedValues.range2 as Date ?? new Date())
    })
  }, [selectedValues]);

  useEffect(() => {
    console.log(data);
  }, [data]);

  return (
    <>
      <div className="graph-content flex gap-4 sm:flex-col">
        <div className="graph-content_column_1 w-[67%] flex flex-col gap-4 sm:w-full">
          <div className="graph-content_c1_row_1">
            <GraphContainerBox
              graphInfo={generateGraphData({
                name: "Total sales over time",
                type: "ruppee",
                dataContent: {
                  heading: "Total sales over time",
                  text: "Amount spent (subtotal, taxes, shipping, returns, discounts, fees, etc.)",
                  formula: {
                    prefix: "Total sales =",
                    suffix:
                      "net sales + additional fees + duties + shipping charges + taxes",
                  },
                },
              })}
              className="h-[389px] !w-full"
              graphData={data.total_sales}
            />
          </div>

          <div className="graph-content_c1_row_2 flex gap-4 sm:flex-col">
            <div className="graph-content-c1_row_2_c1 w-1/2 flex flex-col gap-4 sm:w-full">
              <GraphContainerBox
                graphInfo={generateGraphData({
                  name: "Conversion rate breakdown",
                  type: "percent",
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
                  dataContent: {
                    heading: "Average order value over time",
                    text: "Average order value, factoring in discounts",
                    formula: {
                      prefix: "Average order value =",
                      suffix: "(gross sales - discounts) / orders",
                    },
                  },
                })}
                className="h-[254px] !w-full"
              />
              <GraphContainerBox
                graphInfo={generateGraphData({
                  name: "Sessions by location",
                  type: "ruppee",
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
                  type: "ruppee",
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
              dataContent: {
                heading: "Conversion rate over time",
                text: "Percentage of online store sessions that result in a sale",
                formula: {
                  prefix: "Conversion rate =",
                  suffix: "sessions that completed checkout / sessions",
                },
              },
            })}
            className="h-[344px] !w-full"
            graphData={data.conversion_rate_over_time}
          />
          <GraphContainerBox
            graphInfo={generateGraphData({
              name: "Sessions by device type",
              type: "donut",
              dataContent: {
                heading:
                  "Sessions in your online store, broken down by the user's device type",
                text: "Total sales for the selected date range",
              },
            })}
            className="h-[344px] !w-full"
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
              type: "ruppee",
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
    </>
  );
};

export default GraphContent;
