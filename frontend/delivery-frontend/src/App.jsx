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
import OrderTracking from "./pages/client/TrackOrder";
import Notifications from "./pages/client/Notifications";
import OrderDetail from "./pages/client/OrderDetail";
import ProfilePage from "./pages/client/ProfilePage";
import PriceCalculator from "./pages/client/PriceCalculator";

import LogistLayout from "./components/layout/LogistLayout";
import LogistDashboard from "./pages/logist/LogistDashboard";
import LogistOrders from "./pages/logist/LogistOrders";
import LogistRoutes from "./pages/logist/LogistRoutes";
import CreateRoute from "./pages/logist/CreateRoute";
import LogistVehicles from "./pages/logist/LogistVehicles";
import LogistCouriers from "./pages/logist/LogistCouries";
import LogistReports from "./pages/logist/LogistReports";
import RouteDetail from "./pages/logist/RouteDetail";
import DeliveryChecks from "./pages/logist/DeliveryChecks";

import CourierLayout from "./components/layout/CourierLayout";
import CourierDashboard from "./pages/courier/CourierDashboard";
import CourierRoute from "./pages/courier/CourierRoute";
import CourierHistory from "./pages/courier/CourierHistory";
import CourierProfile from "./pages/courier/CourierProfile";

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
        <Route path="/client" element={<Dashboard />} />

        <Route path="/client/create" element={<CreateOrder />} />

        <Route path="/client/orders" element={<OrdersHistory />} />

        <Route path="/client/track" element={<OrderTracking />} />

        <Route path="/client/orders/:id" element={<OrderDetail />} />

        <Route path="/client/notifications" element={<Notifications />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/client/calculator" element={<PriceCalculator />} />
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
          path="/logist/routes/:routeId/checks"
          element={
            <PrivateRoute>
              <DeliveryChecks />
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
        <Route
          path="/logist/routes/:id"
          element={
            <PrivateRoute>
              <RouteDetail />
            </PrivateRoute>
          }
        />

        {/* COURIER*/}
        <Route
          path="/courier"
          element={
            <PrivateRoute>
              <CourierDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/courier/route"
          element={
            <PrivateRoute>
              <CourierRoute />
            </PrivateRoute>
          }
        />
        <Route
          path="/courier/history"
          element={
            <PrivateRoute>
              <CourierHistory />
            </PrivateRoute>
          }
        />
        <Route
          path="/courier/profile"
          element={
            <PrivateRoute>
              <CourierProfile />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
