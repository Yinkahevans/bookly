import { Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import Dashboard from './pages/Dashboard';
import Businesses from './pages/Businesses';
import Bookings from './pages/Bookings';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Login from './pages/Login';

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/businesses" element={<Businesses />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/users" element={<Users />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </>
  );
}