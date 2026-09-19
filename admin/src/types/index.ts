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