import { Routes, Route } from 'react-router-dom';

// Customer pages
import Home from '../pages/customer/Home';
import BusinessProfile from '../pages/customer/BusinessProfile';
import BookingFlow from '../pages/customer/BookingFlow';
import MyBookings from '../pages/customer/MyBookings';

// Business owner pages
import Onboarding from '../pages/business/Onboarding';
import Dashboard from '../pages/business/Dashboard';
import Services from '../pages/business/Services';
import Availability from '../pages/business/Availability';
import BusinessBookings from '../pages/business/Bookings';

// Auth pages
import Login from '../pages/auth/Login';
import SignUp from '../pages/auth/SignUp';
import AccountType from '../pages/auth/AccountType';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public / customer */}
      <Route path="/" element={<Home />} />
      <Route path="/business/:businessId" element={<BusinessProfile />} />
      <Route path="/business/:businessId/book/:serviceId" element={<BookingFlow />} />
      <Route path="/my-bookings" element={<MyBookings />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<AccountType />} />
      <Route path="/signup/:role" element={<SignUp />} />

      {/* Business owner (protected — wrap with a RequireRole guard once auth is wired) */}
      <Route path="/dashboard/onboarding" element={<Onboarding />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/dashboard/services" element={<Services />} />
      <Route path="/dashboard/availability" element={<Availability />} />
      <Route path="/dashboard/bookings" element={<BusinessBookings />} />
    </Routes>
  );
}
