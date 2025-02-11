import { useState } from "react";
import "./analytics-page.css";
import ActionBtns from "./components/ActionBtns";
import GraphContent from "./components/GraphContent";
import OverviewGraphs from "./components/OverviewGraphs";
import PageHeading from "./components/PageHeading";

const AnalyticsPage = () => {

  const [focus, setFocus] = useState(false);

  return (
    <div className={`analytics-page p-6 pb-5 flex flex-col gap-5 ${focus ? "absolute top-0 left-0 w-full h-max z-[2000] bg-[#f1f1f1] transition-all duration-150 ease-in-out" : ""}`}>
      <PageHeading focus={focus} setFocus={setFocus} />
      <ActionBtns />
      <OverviewGraphs />
      <GraphContent />
      <p className="text-center text-[13px] leading-4">Learn more about <a href="https://help.shopify.com/manual/reports-and-analytics/shopify-reports/new-analytics" className="text-[rgb(0,91,211)] underline">analytics</a></p>
    </div>
  )
}

export default AnalyticsPage;