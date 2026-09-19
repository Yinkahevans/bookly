// Shared shape reference for the Bookly data model. `frontend` and `admin` each
// keep their own copy in src/types (kept in sync manually for now); this file is
// the source of truth to copy from. If the project grows, turn this into an
// actual npm workspace package imported by all three apps.

export type UserRole = 'customer' | 'business_owner' | 'admin';
export type BusinessStatus = 'pending' | 'active' | 'suspended';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  category: string;
  description: string | null;
  location: string | null;
  phone: string | null;
  email: string | null;
  status: BusinessStatus;
  created_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  requires_approval: boolean;
  active: boolean;
}

export interface Availability {
  id: string;
  business_id: string;
  service_id: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface Booking {
  id: string;
  business_id: string;
  service_id: string;
  customer_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  reminder_sent_at: string | null;
  created_at: string;
}
