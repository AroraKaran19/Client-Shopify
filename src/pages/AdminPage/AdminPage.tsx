import XMarkIcon from "@/assets/svg/XMarkIcon";
import { fetchData, updateDateData } from "@/firebase/firebase";
import { useEffect, useRef, useState } from "react";

interface DateData {
  gross_sales: { time: string; value: number }[];
  returning_customer_rate: { time: string; value: number }[];
  orders_fulfilled: { time: string; value: number }[];
  orders: { time: string; value: number }[];
	total_sales_over_time: { time: string; value: number }[];
	conversion_rate_over_time: { time: string; value: number }[];
	average_order_value_over_time: { time: string; value: number }[];
}

const Graphs = [
  "Gross sales",
  "Returning customer rate",
  "Orders fulfilled",
  "Orders",
	"Total sales over time",
	"Conversion rate over time",
	"Average order value over time",
];

const AdminPage = () => {
  const [date, setDate] = useState<string>();
  const dateRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<DateData | undefined>(undefined);
  const [copyData, setCopyData] = useState<DateData | undefined>(undefined);
  const [unsavedChanges, setUnsavedChanges] = useState<number[]>([]);
  const [massChanges, setMassChanges] = useState<boolean>(false);
  const [allowSave, setAllowSave] = useState<boolean>(false);
  const [currentSelection, setCurrentSelection] = useState<string>("");
  const [changeValue, setChangeValue] = useState<boolean>(false);
  const timeLabels = Array.from({ length: 24 }, (_, i) => {
    const hour = i % 12 === 0 ? 12 : i % 12;
    const period = i < 12 ? "AM" : "PM";
    return `${hour}:00 ${period}`;
  });

  useEffect(() => {
    if (date) {
      const fetchDataAsync = async () => {
        return fetchData(date);
      };

      fetchDataAsync().then((result) => {
        const transformData = (key: keyof typeof result) => {
          return timeLabels.map((time, index) => ({
            time,
            value: result[key][index],
          }));
        };

        setData({
          gross_sales: transformData("gross_sales"),
          returning_customer_rate: transformData("returning_customer_rate"),
          orders_fulfilled: transformData("orders_fulfilled"),
          orders: transformData("orders"),
					total_sales_over_time: transformData("total_sales_over_time"),
					conversion_rate_over_time: transformData("conversion_rate_over_time"),
					average_order_value_over_time: transformData("average_order_value_over_time"),
        });
      });
    }
  }, [date]);

  useEffect(() => {
    if (data) {
      setCopyData(data);
    }
  }, [data]);

  useEffect(() => {
    if (copyData) {
      Object.values(copyData[currentSelection as keyof DateData]).forEach(
        (item, index) => {
          setUnsavedChanges((prev) => {
            const copy = [...prev];
            copy[index] = item.value;
            return copy;
          });
        }
      );
    }
  }, [currentSelection]);

  const saveData = () => {
    if (copyData !== data) {
      const ask_user = confirm("Are you sure you want to save the changes?");
      if (ask_user) {
        const dataToSave = Object.entries(copyData || {}).reduce(
          (acc, [key, value]) => {
            acc[key as keyof DateData] = value.map(
              (item: { value: any }) => item.value
            );
            return acc;
          },
          {} as DateData
        );
        updateDateData(date as string, dataToSave);
        setChangeValue(false);
        setDate("");
        if (dateRef.current) {
          dateRef.current.value = "";
        }
        setData(undefined);
        setCopyData(undefined);
      } else {
        setChangeValue(false);
      }
    }
  };

  const saveMassChanges = () => {
    if (massChanges) {
      const ask_user = confirm(
        `Are you sure you want to save the changes in ${currentSelection
          .toUpperCase()
          .replace(/_/g, " ")}?`
      );
      if (ask_user) {
        setCopyData((prevCopyData) => {
          if (!prevCopyData) return prevCopyData;
          const copy = { ...prevCopyData };
          copy[currentSelection as keyof DateData] = unsavedChanges.map(
            (value, index) => ({ time: timeLabels[index], value })
          );
          return copy;
        });
        setChangeValue(false);
      } else {
        if (copyData) {
          Object.values(copyData[currentSelection as keyof DateData]).forEach(
            (item, index) => {
              setUnsavedChanges((prev) => {
                const copy = [...prev];
                copy[index] = item.value;
                return copy;
              });
            }
          );
        }
      }
    }
  };

  useEffect(() => {
    setAllowSave(copyData === data);
  }, [copyData]);

  const closeChangeWindow = () => {
    if (massChanges) {
      const ask_user = confirm("Are you sure you want to discard the changes?");
      if (ask_user) {
        setChangeValue(false);
        setUnsavedChanges(
          copyData
            ? copyData[currentSelection as keyof DateData].map(
                (item) => item.value
              )
            : []
        );
				setMassChanges(false);
      }
    } else {
      setChangeValue(false);
      setMassChanges(false);
    }
  };

  useEffect(() => {
    setMassChanges(
      JSON.stringify(unsavedChanges) !=
        JSON.stringify(
          copyData
            ? copyData[currentSelection as keyof DateData].map(
                (item) => item.value
              )
            : []
        )
    );
  }, [unsavedChanges]);

  return (
    <div className="admin-page h-full w-full p-6 relative">
      <div className="page-heading">
        <h1 className="text-3xl font-bold text-center underline">Admin Page</h1>
      </div>
      <div className="admin-changes-container w-full p-6 flex justify-center items-center border mt-6">
        <form
          className="admin-changes-form w-full max-w-lg"
          onSubmit={(e) => {
            e.preventDefault();
            saveData();
          }}
        >
          <label>Date</label>
          <input
            type="date"
            className="w-full border p-2 mb-4"
            onChange={(e) => setDate(e.target.value)}
            ref={dateRef}
						min={"2021-01-01"}
						max={new Date().toISOString().split("T")[0]}
          />
          {date ? (
            copyData ? (
							<>
              <h2 className="text-2xl font-bold text-center">KPIs</h2>
              <div className="kpi-container w-full flex gap-2 flex-col items-center justify-center">
                {Graphs.map((item, index) => {
                  return (
                    <button
                      key={index}
                      className="change-value-btn w-full p-2 bg-black hover:bg-black/60 active:bg-black/80 text-white rounded-xl transition-all ease-in-out duration-200"
                      type="button"
                      onClick={() => {
                        setCurrentSelection(
                          item.toLowerCase().replace(/ /g, "_")
                        );
                        setChangeValue(true);
                      }}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
              <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all ease-in-out duration-200"
                disabled={allowSave}
                title={copyData === data ? "No changes to save" : ""}
              >
                Submit
              </button>
            </>
						) : (
							<h2 className="text-2xl font-bold text-center">
								Loading data...
							</h2>
						)
          ) : (
						<h2 className="text-2xl font-bold text-center">
							Select a date to view data
						</h2>
					)}
        </form>
      </div>
      {changeValue && copyData && (
        <div className="change-value-window absolute top-0 left-0 w-full h-full bg-black/20 backdrop-blur-sm flex justify-center items-center transition-all ease-in-out duration-500">
          <div className="change-values-container h-[500px] w-[700px] bg-white p-6 rounded-lg flex flex-col items-center relative gap-6">
            <div
              className="close-btn absolute top-2 right-4 cursor-pointer p-1 hover:bg-black/20 active:bg-black/30 text-black/80 hover:text-black rounded-full transition-all ease-in-out duration-200"
              onClick={closeChangeWindow}
            >
              <XMarkIcon className="size-6" />
            </div>
            <h2 className="heading text-xl text-black">
              Change value for{" "}
              {currentSelection.toUpperCase().replace(/_/g, " ")}
            </h2>
            <div className="data-value-containers w-full flex flex-col gap-2 overflow-y-auto">
              <table>
                <thead>
                  <tr>
                    <th className="border sticky top-0 bg-white">Time</th>
                    <th className="border sticky top-0 bg-white">
                      Current Value
                    </th>
                    <th className="border sticky top-0 bg-white">
                      Change Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {copyData[currentSelection as keyof DateData].map(
                    (item, index) => {
                      return (
                        <tr
                          key={index}
                          className={`${currentSelection}-${item.time}-row w-full`}
                        >
                          <td className="w-1/3 border-r border-l text-center">
                            {item.time}
                          </td>
                          <td className="w-1/3 border-r border-l text-center">
                            {item.value}
                          </td>
                          <td className="w-1/3 border-r">
                            <input
                              type="number"
                              className="w-full text-center outline-none"
                              onChange={(e) => {
                                setUnsavedChanges((prev) => {
                                  const copy = [...prev];
                                  copy[index] = parseInt(e.target.value || "0");
                                  return copy;
                                });
                              }}
                              placeholder={item.value.toFixed()}
                            />
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
            <button
              className="save-btn mt-auto bg-green-300 px-3 py-2 text-black rounded-lg w-fit place-self-center text-sm cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed transition-all ease-in-out duration-200"
              disabled={!massChanges}
              onClick={saveMassChanges}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
