import { useEffect, useState } from "react";
import { GraphContentData, graphData } from "../utils";
import GraphContainerBox from "./GraphContainerBox";

const GraphContent = () => {
  const [data, setData] = useState<GraphContentData[]>();

  useEffect(() => {
    // fetch data
    setData(graphData);
  }, [graphData]);

  return (
    <>
      {data && (
        <div className="graph-content flex gap-4 sm:flex-col">
          <div className="graph-content_column_1 w-[67%] flex flex-col gap-4 sm:w-full">
            <div className="graph-content_c1_row_1">
              <GraphContainerBox
                graphInfo={data[0]}
                className="h-[389px] !w-full"
              />
            </div>

            <div className="graph-content_c1_row_2 flex gap-4 sm:flex-col">
              <div className="graph-content-c1_row_2_c1 w-1/2 flex flex-col gap-4 sm:w-full">
                <GraphContainerBox
                  graphInfo={{ ...data[0] }}
                  className="h-[344px] !w-full"
                />
                <GraphContainerBox
                  graphInfo={{ ...data[0] }}
                  className="h-[344px] !w-full"
                />
                <GraphContainerBox
                  graphInfo={{ ...data[0] }}
                  className="h-[344px] !w-full"
                />
              </div>
              <div className="graph-content-c1_row_2_c2 w-1/2 flex flex-col gap-4 sm:w-full">
                <GraphContainerBox
                  graphInfo={data[2]}
                  className="h-[254px] !w-full"
                />
                <GraphContainerBox
                  graphInfo={{ ...data[0] }}
                  className="h-[344px] !w-full"
                />
                <GraphContainerBox
                  graphInfo={{ ...data[0] }}
                  className="h-[344px] !w-full"
                />
              </div>
            </div>

            <div className="graph-content_c1_row_3">
              <GraphContainerBox
                graphInfo={{ ...data[0] }}
                className="h-[344px] !w-full"
              />
            </div>

            <div className="graph-content_c1_row_4 flex gap-4 sm:flex-col">
              <div className="graph-content-c1_row_4_c1 w-1/2 flex flex-col gap-4 sm:w-full">
                <GraphContainerBox
                  graphInfo={{ ...data[0] }}
                  className="h-[344px] !w-full"
                />
                <GraphContainerBox
                  graphInfo={{ ...data[0] }}
                  className="h-[344px] !w-full"
                />
              </div>
              <div className="graph-content-c1_row_4_c2 w-1/2 flex flex-col gap-4 sm:w-full">
                <GraphContainerBox
                  graphInfo={{ ...data[0] }}
                  className="h-[344px] !w-full"
                />
                <GraphContainerBox
                  graphInfo={{ ...data[0] }}
                  className="h-[344px] !w-full"
                />
              </div>
            </div>
          </div>
          <div className="graph-content_column_2 w-[33%] flex flex-col gap-4 sm:w-full">
            <GraphContainerBox
              graphInfo={data[1]}
              className="h-[344px] !w-full"
            />
            <GraphContainerBox
              graphInfo={data[1]}
              className="h-[344px] !w-full"
            />
            <GraphContainerBox
              graphInfo={data[2]}
              className="h-[254px] !w-full"
            />
            <GraphContainerBox
              graphInfo={data[1]}
              className="h-[344px] !w-full"
            />
            <GraphContainerBox
              graphInfo={data[1]}
              className="h-[344px] !w-full"
            />
            <GraphContainerBox
              graphInfo={data[1]}
              className="h-[344px] !w-full"
            />
            <GraphContainerBox
              graphInfo={data[1]}
              className="h-[344px] !w-full"
            />
            <GraphContainerBox
              graphInfo={data[1]}
              className="h-[344px] !w-full"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default GraphContent;
