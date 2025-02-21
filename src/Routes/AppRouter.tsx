import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "../layout";
import AnalyticsPage from "../pages/AnalyticsPage/AnalyticsPage";
import NotFound from "../pages/NotFound";
import AdminPage from "@/pages/AdminPage/AdminPage";

const AppRouter = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<AnalyticsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default AppRouter