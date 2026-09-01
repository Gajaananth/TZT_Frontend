import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Footer } from '../components/layout/Footer';

export const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4">Welcome, {user.firstName}!</h1>
            <p className="text-xl text-gray-300 mb-8">
              You are logged in as {user.email}
            </p>
            <Button
              onClick={() => navigate('/dashboard')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="text-center mb-12">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <img src="/logo.png" alt="TZIT Education Logo" className="h-24 w-auto" />
          </div>

          <h1 className="text-6xl font-bold mb-4">TZIT Education ERP</h1>
          <p className="text-xl text-gray-300 mb-2">
            Unified Education Management & Learning Platform
          </p>
          <p className="text-lg text-gray-400">
            Manage students, teachers, courses, attendance, fees, and more
          </p>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={() => navigate('/login')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg"
          >
            Login
          </Button>
          <Button
            onClick={() => navigate('/register')}
            variant="outline"
            className="border-white text-white hover:bg-white hover:text-purple-900 px-8 py-3 text-lg"
          >
            Register
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-semibold mb-2">📚 Course Management</h3>
            <p className="text-gray-300">
              Manage courses, modules, and learning content with rich text and multimedia support.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-semibold mb-2">👥 Student Management</h3>
            <p className="text-gray-300">
              Track student profiles, enrollment, attendance, and academic progress.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-semibold mb-2">💰 Fee Management</h3>
            <p className="text-gray-300">
              Manage invoices, payments, fee structures, and financial tracking.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
