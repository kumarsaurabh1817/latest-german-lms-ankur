import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingSpinner from "./components/LoadingSpinner";
import SocialFloatingButtons from "./components/SocialFloatingButtons";
import ScrollToTop from "./components/ScrollToTop";

import Home from "./pages/Home";
import Courses from "./features/courses/pages/Courses";
import CourseDetail from "./features/courses/pages/CourseDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Consultation from "./pages/Consultation";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import StudentDashboard from "./features/dashboard/pages/StudentDashboard";
import TeacherDashboard from "./features/dashboard/pages/TeacherDashboard";
import AdminDashboard from "./features/dashboard/pages/AdminDashboard";
import StripeCheckout from "./features/payment/pages/StripeCheckout";
import RazorpayCheckout from "./features/payment/pages/RazorpayCheckout";

const DashboardRedirect = () => {
  const { user } = useAuth();
  if (user?.role === "admin") return <Navigate to="/dashboard/admin" replace />;
  if (user?.role === "teacher")
    return <Navigate to="/dashboard/teacher" replace />;
  return <Navigate to="/dashboard/student" replace />;
};

const App = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/consultation" element={<Consultation />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/student"
            element={
              <ProtectedRoute roles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/teacher"
            element={
              <ProtectedRoute roles={["teacher"]}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          {/* Stripe checkout — protected, for logged-in students only */}
          <Route
            path="/checkout/stripe"
            element={
              <ProtectedRoute roles={["student"]}>
                <StripeCheckout />
              </ProtectedRoute>
            }
          />
          {/* Razorpay checkout — protected, for logged-in students only */}
          <Route
            path="/checkout/razorpay"
            element={
              <ProtectedRoute roles={["student"]}>
                <RazorpayCheckout />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <SocialFloatingButtons />
    </div>
  );
};

export default App;
