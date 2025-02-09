import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "../layout";
import AnalyticsPage from "../pages/AnalyticsPage";
import NotFound from "../pages/NotFound";

const AppRouter = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<AnalyticsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default AppRouter