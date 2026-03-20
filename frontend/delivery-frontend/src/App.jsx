import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import OAuthCallback from "./pages/auth/OAuthCallback";

import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersPage from "./pages/admin/UsersPage";

import PrivateRoute from "./routes/PrivateRoute";
import ClientLayout from "../src/components/layout/ClientLayout";

import Dashboard from "./pages/client/ClientDashboard";
import OrdersHistory from "./pages/client/OrderList";
import CreateOrder from "./pages/client/CreateOrder";
import OrderTracking from "./pages/client/OrderTracking";
import Notifications from "./pages/client/Notifications";
import OrderDetail from "./pages/client/OrderDetail";
import ProfilePage from "./pages/client/ProfilePage";

import LogistLayout from "./components/logist/LogistSidebar";
import LogistDashboard from "./pages/logist/LogistDashboard";
import LogistOrders from "./pages/logist/LogistOrders";
import LogistRoutes from "./pages/logist/LogistRoutes";
import CreateRoute from "./pages/logist/CreateRoute";
import LogistVehicles from "./pages/logist/LogistVehicles";
import LogistCouriers from "./pages/logist/LogistCouriers";
import LogistReports from "./pages/logist/LogistReports";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<LoginPage />} />

        <Route path="/register" element={<RegisterPage />} />

        <Route path="/oauth-callback" element={<OAuthCallback />} />

        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <PrivateRoute>
              <UsersPage />
            </PrivateRoute>
          }
        />

        {/* CLIENT */}
        <Route
          path="/client"
          element={
            <ClientLayout>
              <Dashboard />
            </ClientLayout>
          }
        />

        <Route
          path="/client/create"
          element={
            <ClientLayout>
              <CreateOrder />
            </ClientLayout>
          }
        />

        <Route
          path="/client/orders"
          element={
            <ClientLayout>
              <OrdersHistory />
            </ClientLayout>
          }
        />

        <Route
          path="/client/track"
          element={
            <ClientLayout>
              <OrderTracking />
            </ClientLayout>
          }
        />

        <Route
          path="/client/orders/:id"
          element={
            <ClientLayout>
              <OrderDetail />
            </ClientLayout>
          }
        />

        <Route
          path="/client/notifications"
          element={
            <ClientLayout>
              <Notifications />
            </ClientLayout>
          }
        />
        <Route
          path="/profile"
          element={
            <ClientLayout>
              <ProfilePage />
            </ClientLayout>
          }
        />
        {/* LOGIST*/}

        <Route
          path="/logist"
          element={
            <PrivateRoute>
              <LogistDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/logist/orders"
          element={
            <PrivateRoute>
              <LogistOrders />
            </PrivateRoute>
          }
        />
        <Route
          path="/logist/routes"
          element={
            <PrivateRoute>
              <LogistRoutes />
            </PrivateRoute>
          }
        />
        <Route
          path="/logist/routes/new"
          element={
            <PrivateRoute>
              <CreateRoute />
            </PrivateRoute>
          }
        />
        <Route
          path="/logist/vehicles"
          element={
            <PrivateRoute>
              <LogistVehicles />
            </PrivateRoute>
          }
        />
        <Route
          path="/logist/couriers"
          element={
            <PrivateRoute>
              <LogistCouriers />
            </PrivateRoute>
          }
        />
        <Route
          path="/logist/reports"
          element={
            <PrivateRoute>
              <LogistReports />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
