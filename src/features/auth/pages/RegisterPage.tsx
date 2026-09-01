import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { PasswordInput } from '../../../components/ui/password-input';
import { Spinner } from '../../../components/ui/spinner';
import { Footer } from '../../../components/layout/Footer';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, error } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<'Student' | 'Teacher'>('Student');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    specialization: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setFormError('All required fields must be filled');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    try {
      await register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        role,
        role === 'Teacher' ? formData.specialization : undefined
      );
      navigate('/dashboard');
    } catch (err) {
      setFormError(error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-shell flex min-h-screen flex-col justify-between">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <div className="glass p-8 sm:p-10">
            {/* Logo */}
            <div className="mb-6 flex justify-center">
              <img src="/logo.png" alt="TZIT Education Logo" className="h-14 w-auto" />
            </div>

            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-300">TZIT Education</p>
            <h1 className="mb-1 text-center text-3xl font-bold text-slate-950 dark:text-white">Create Account</h1>
            <p className="mb-6 text-center text-sm text-slate-600 dark:text-slate-300">
              Join TZIT Education ERP & LMS
            </p>

            {/* Role Selector */}
            <div className="mb-6">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Register as:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('Student')}
                  className={`flex flex-col items-center justify-center rounded-xl p-3.5 text-center transition-all duration-200 border ${
                    role === 'Student'
                      ? 'border-indigo-500 bg-indigo-50/80 shadow-md shadow-indigo-500/10 dark:border-indigo-400 dark:bg-indigo-950/40 text-indigo-950 dark:text-white'
                      : 'border-slate-200/80 bg-white/40 hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="mb-1 text-2xl">🎓</span>
                  <span className="text-sm font-bold">Student</span>
                  <span className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Take courses & exams</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('Teacher')}
                  className={`flex flex-col items-center justify-center rounded-xl p-3.5 text-center transition-all duration-200 border ${
                    role === 'Teacher'
                      ? 'border-indigo-500 bg-indigo-50/80 shadow-md shadow-indigo-500/10 dark:border-indigo-400 dark:bg-indigo-950/40 text-indigo-950 dark:text-white'
                      : 'border-slate-200/80 bg-white/40 hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="mb-1 text-2xl">👨‍🏫</span>
                  <span className="text-sm font-bold">Teacher / Instructor</span>
                  <span className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Manage courses & grading</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {(formError || error) && (
                <div className="rounded-xl border border-red-400/40 bg-red-500/10 p-4">
                  <p className="text-sm text-red-700 dark:text-red-200">{formError || error}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
              </div>

              {role === 'Teacher' && (
                <div>
                  <label htmlFor="specialization" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Department / Specialization <span className="text-xs text-slate-400">(Optional)</span>
                  </label>
                  <Input
                    id="specialization"
                    name="specialization"
                    type="text"
                    placeholder="e.g. Computer Science, Mathematics"
                    value={formData.specialization}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <PasswordInput
                    id="password"
                    name="password"
                    label="Password *"
                    placeholder="Min 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div>
                  <PasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    label="Confirm Password *"
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="mt-6 flex w-full items-center justify-center gap-2 py-3.5 font-semibold text-base shadow-lg shadow-indigo-500/20"
              >
                {isLoading ? (
                  <>
                    <Spinner />
                    Creating {role} Account...
                  </>
                ) : (
                  `Register as ${role}`
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-300">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
