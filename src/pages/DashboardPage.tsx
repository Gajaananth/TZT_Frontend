import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BaseLayout } from '../components/layout/BaseLayout';
import { Button } from '../components/ui/button';
import { apiClient } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

interface DashboardData {
  students: any[];
  teachers: any[];
  attendance: any[];
  breakdown: { present: number; absent: number; late: number; excused: number };
}

const emptyBreakdown = { present: 0, absent: 0, late: 0, excused: 0 };

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({ students: [], teachers: [], attendance: [], breakdown: emptyBreakdown });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const role = user?.userRoles.map((userRole) => userRole.role.name).find((name) => ['SuperAdmin', 'Admin', 'Teacher', 'Student'].includes(name)) || 'User';

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const [studentsResponse, teachersResponse, attendanceResponse] = await Promise.all([
        apiClient.get('/students', { params: { limit: 8 } }),
        apiClient.get('/teachers', { params: { limit: 8 } }),
        apiClient.get('/attendance', { params: { limit: 8, viewBy: 'date' } }),
      ]);

      setData({
        students: studentsResponse.data?.data?.students || [],
        teachers: teachersResponse.data?.data?.teachers || [],
        attendance: attendanceResponse.data?.data?.records || [],
        breakdown: { ...emptyBreakdown, ...(attendanceResponse.data?.data?.breakdown || {}) },
      });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'The dashboard could not load live data. Check the API connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const totalAttendance = Object.values(data.breakdown).reduce((total, count) => total + count, 0);
  const attendanceRate = totalAttendance ? Math.round(((data.breakdown.present + data.breakdown.late) / totalAttendance) * 100) : 0;
  const metrics = [
    { label: 'Students loaded', value: data.students.length, detail: 'Open student directory', href: '/students', tone: 'text-cyan-600 dark:text-cyan-400' },
    { label: 'Teachers loaded', value: data.teachers.length, detail: 'Open staff directory', href: '/teachers', tone: 'text-amber-600 dark:text-amber-400' },
    { label: 'Attendance rate', value: `${attendanceRate}%`, detail: `${totalAttendance} records in view`, href: '/attendance', tone: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Access role', value: role, detail: user?.email || 'Authenticated user', href: '/dashboard', tone: 'text-indigo-600 dark:text-indigo-400' },
  ];

  return (
    <BaseLayout>
      <div className="min-h-full bg-transparent px-5 py-6 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-800 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">Operations overview</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white md:text-4xl">Good morning, {user?.firstName}.</h1>
              <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">Live activity across your education workspace, updated from the connected API.</p>
            </div>
            <Button variant="outline" className="w-fit" onClick={() => void loadDashboard()} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh data'}</Button>
          </header>

          {error ? <div className="flex flex-col gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300 md:flex-row md:items-center md:justify-between"><span>{error}</span><Button variant="outline" className="w-fit" onClick={() => void loadDashboard()}>Try again</Button></div> : null}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Live totals">
            {metrics.map((metric) => (
              <Link key={metric.label} to={metric.href} className="glass group p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{metric.label}</p>
                <p className={`mt-3 truncate text-3xl font-bold ${metric.tone}`}>{loading ? '…' : metric.value}</p>
                <p className="mt-3 text-sm text-slate-500 group-hover:text-slate-800 dark:text-slate-500 dark:group-hover:text-slate-300">{metric.detail} <span aria-hidden="true">→</span></p>
              </Link>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
            <div className="glass overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800"><div><h2 className="font-semibold text-slate-950 dark:text-white">Attendance pulse</h2><p className="mt-1 text-sm text-slate-500">Current response across loaded records</p></div><Link className="text-sm font-semibold text-cyan-600 hover:text-cyan-500" to="/attendance">View records</Link></div>
              <div className="grid gap-3 p-5 sm:grid-cols-4">
                {(['present', 'absent', 'late', 'excused'] as const).map((status) => <div key={status} className="border-l-2 border-slate-200 pl-3 dark:border-slate-700"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{status}</p><p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{loading ? '…' : data.breakdown[status]}</p></div>)}
              </div>
            </div>

            <div className="glass overflow-hidden">
              <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800"><h2 className="font-semibold text-slate-950 dark:text-white">Recent attendance</h2><p className="mt-1 text-sm text-slate-500">Latest records from the API</p></div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? <p className="p-5 text-sm text-slate-500">Loading records…</p> : data.attendance.length === 0 ? <p className="p-5 text-sm text-slate-500">No attendance records found.</p> : data.attendance.slice(0, 5).map((record) => <div key={record.id} className="flex items-center justify-between gap-4 px-5 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{record.student?.user?.firstName} {record.student?.user?.lastName}</p><p className="text-xs text-slate-500">{record.classDate ? new Date(record.classDate).toLocaleDateString() : 'Date unavailable'}</p></div><span className="shrink-0 text-xs font-semibold uppercase text-slate-500">{record.latestStatus || 'Unknown'}</span></div>)}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-indigo-400/20 bg-slate-900/80 p-6 text-white shadow-lg backdrop-blur-glass">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-sm font-semibold uppercase tracking-widest text-cyan-300">Work queue</p><h2 className="mt-2 text-xl font-semibold">Move through today&apos;s records</h2><p className="mt-1 text-sm text-slate-300">Use the live management screens to review people, record attendance, and inspect details.</p></div><div className="flex flex-wrap gap-3"><Link to="/students" className="border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10">Manage students</Link><Link to="/attendance" className="bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300">Record attendance</Link></div></div>
          </section>
        </div>
      </div>
    </BaseLayout>
  );
};
