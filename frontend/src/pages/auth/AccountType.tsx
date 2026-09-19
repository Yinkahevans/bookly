import { useNavigate } from 'react-router-dom';

export default function AccountType() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-cream px-6 py-10">
      <div className="mx-auto max-w-md text-center">
        <h1 className="font-display text-3xl text-navy">Join Bookly</h1>
        <p className="mt-2 text-slate">Are you booking services, or offering them?</p>

        <div className="mt-8 space-y-4">
          <button
            onClick={() => navigate('/signup/customer')}
            className="w-full rounded-md border-2 border-navy px-4 py-3 font-medium text-navy transition hover:bg-navy hover:text-white"
          >
            I'm booking services
          </button>
          <button
            onClick={() => navigate('/signup/business_owner')}
            className="w-full rounded-md bg-orange px-4 py-3 font-medium text-white transition hover:bg-orange-dark"
          >
            I run a business
          </button>
        </div>

        <p className="mt-6 text-sm text-slate">
          Already have an account?{' '}
          <a href="/login" className="font-medium text-orange hover:underline">
            Log in
          </a>
        </p>
      </div>
    </main>
  );
}