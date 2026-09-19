export type UserRole = 'customer' | 'business_owner' | 'admin';

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  category: string;
  description: string | null;
  location: string | null;
  phone: string | null;
  email: string | null;
  status: 'pending' | 'active' | 'suspended';
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
  day_of_week: number; // 0 = Sunday
  start_time: string; // 'HH:MM'
  end_time: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

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
  created_at: string;
}
