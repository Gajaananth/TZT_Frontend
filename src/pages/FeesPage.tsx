import React, { useEffect, useState, useCallback } from 'react';
import { BaseLayout } from '../components/layout/BaseLayout';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentFeeStatus {
  studentId: string;
  studentName: string;
  studentNumber: string;
  courseName?: string;
  batchName?: string;
  balance: number;
  status: 'Cleared' | 'Pending' | 'Overdue' | 'Partial';
  dueDate?: string;
  classesRemaining?: number;
  feeType?: string;
}

interface AdminFeeStats {
  totalOutstanding: number;
  collectedThisMonth: number;
  overdueAccounts: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatLkr = (amount: number) =>
  new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(amount);

const StatusBadge: React.FC<{ status: StudentFeeStatus['status'] }> = ({ status }) => {
  const colors = {
    Cleared: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    Partial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    Overdue: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  };
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${colors[status]}`}>
      {status}
    </span>
  );
};

// ─── Teacher Fees View ────────────────────────────────────────────────────────
// Read-only: shows fee/class-package status for students in teacher's batches

const TeacherFeesView: React.FC = () => {
  const [students, setStudents] = useState<StudentFeeStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/fees/teacher/student-status');
      setStudents(res.data?.data?.students ?? []);
    } catch (err: any) {
      if (err.response?.status === 404 || err.response?.status === 501) {
        // API not yet implemented — show empty state gracefully
        setStudents([]);
      } else {
        setError(err.response?.data?.message || 'Failed to load student fee data.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = students.filter(s =>
    s.studentName.toLowerCase().includes(search.toLowerCase()) ||
    s.studentNumber.toLowerCase().includes(search.toLowerCase())
  );

  const atRisk = students.filter(s => s.status === 'Overdue' || s.status === 'Pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Fee Status</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Read-only view of fee and class-package balances for your students.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
          Teacher View · Read Only
        </span>
      </div>

      {/* At-risk alert */}
      {!isLoading && atRisk.length > 0 && (
        <div className="rounded-xl border border-amber-400/40 bg-amber-50/70 p-4 dark:border-amber-500/30 dark:bg-amber-900/20">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            ⚠️ {atRisk.length} student{atRisk.length > 1 ? 's' : ''} ha{atRisk.length > 1 ? 've' : 's'} an outstanding or overdue fee balance.
            Contact the accounts office if payment needs to be blocked.
          </p>
        </div>
      )}

      {/* Summary cards */}
      {!isLoading && students.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {(['Cleared', 'Partial', 'Pending', 'Overdue'] as const).map(s => (
            <div key={s} className="glass p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">{s}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {students.filter(st => st.status === s).length}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="glass p-4">
        <input
          type="search"
          placeholder="Search by name or student ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg border border-white/40 bg-white/40 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-white/10 dark:bg-slate-950/30 dark:text-white dark:placeholder-slate-400"
        />
      </div>

      {/* Table */}
      <div className="glass overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Students</h2>
        </div>

        {error && (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <Button onClick={loadData} className="mt-4 text-sm">Retry</Button>
          </div>
        )}

        {isLoading && (
          <div className="px-6 py-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="px-6 py-12 text-center">
            {students.length === 0 ? (
              <>
                <p className="text-4xl mb-3">📋</p>
                <p className="font-semibold text-gray-700 dark:text-gray-200">No student data available yet</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Fee status will appear here once students are enrolled in your batches.
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No students match your search.</p>
            )}
          </div>
        )}

        {!isLoading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-900/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Course / Batch</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Classes Left</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {filtered.map(item => (
                  <tr
                    key={item.studentId}
                    className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 ${
                      item.status === 'Overdue' ? 'bg-rose-50/40 dark:bg-rose-900/10' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-medium text-gray-900 dark:text-white">{item.studentName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.studentNumber}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {item.courseName || '—'}
                      {item.batchName && <span className="ml-1 text-xs text-gray-400">· {item.batchName}</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.classesRemaining !== undefined ? (
                        <span className={`font-semibold ${item.classesRemaining <= 2 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'}`}>
                          {item.classesRemaining === 0 ? '⛔ 0 left' : item.classesRemaining <= 2 ? `⚠️ ${item.classesRemaining}` : item.classesRemaining}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {formatLkr(item.balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {item.dueDate ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
        To record payments or create fee structures, contact the Admin office.
        This view is read-only.
      </p>
    </div>
  );
};

// ─── Admin / SuperAdmin Fees View ─────────────────────────────────────────────

const AdminFeesView: React.FC = () => {
  const [feeItems, setFeeItems] = useState<StudentFeeStatus[]>([]);
  const [stats, setStats] = useState<AdminFeeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [invoicesRes, pendingRes] = await Promise.allSettled([
        apiClient.get('/fees/invoices?limit=100'),
        apiClient.get('/fees/pending'),
      ]);

      const invoices = invoicesRes.status === 'fulfilled' ? (invoicesRes.value.data?.data?.invoices ?? []) : [];
      const pendingPayments = pendingRes.status === 'fulfilled' ? (pendingRes.value.data?.data ?? []) : [];

      // Transform invoices to StudentFeeStatus format
      const transformed = invoices.map((inv: any) => ({
        studentId: inv.student?.id ?? 'N/A',
        studentName: inv.student?.user?.name ?? 'Unknown Student',
        studentNumber: inv.student?.studentId ?? 'N/A',
        balance: inv.remainingAmount ?? 0,
        status: inv.status === 'PAID' ? 'Cleared' : inv.status === 'PENDING' ? 'Pending' : 'Overdue',
        dueDate: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-LK') : undefined,
      }));

      setFeeItems(transformed);

      // Calculate stats from pending payments
      const overdue = pendingPayments.filter((p: any) => p.isOverdue).length;
      const totalOutstanding = pendingPayments.reduce((sum: number, p: any) => sum + (Number(p.amount) - (p.payments?.reduce((s: number, pm: any) => s + Number(pm.amount), 0) ?? 0)), 0);
      
      // Get this month's collected payments
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthCollected = invoices
        .filter((inv: any) => new Date(inv.updatedAt) >= monthStart && inv.status === 'PAID')
        .reduce((sum: number, inv: any) => sum + (inv.payments?.reduce((s: number, p: any) => s + Number(p.amount), 0) ?? 0), 0);

      setStats({
        totalOutstanding,
        collectedThisMonth: thisMonthCollected,
        overdueAccounts: overdue,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load fee data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fees &amp; Payments</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Track invoices, payment history, and outstanding balances for enrolled learners.
          </p>
        </div>
        <Button id="record-payment-btn" className="w-fit">+ Record Payment</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
        ) : (
          <>
            <div className="glass p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">Outstanding</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {formatLkr(stats?.totalOutstanding ?? 0)}
              </p>
            </div>
            <div className="glass p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">Collected This Month</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {formatLkr(stats?.collectedThisMonth ?? 0)}
              </p>
            </div>
            <div className="glass p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">Overdue Accounts</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats?.overdueAccounts ?? 0}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Table */}
      <div className="glass overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Payment Summary</h2>
        </div>

        {error && (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <Button onClick={loadData} className="mt-4 text-sm">Retry</Button>
          </div>
        )}

        {isLoading && (
          <div className="px-6 py-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        )}

        {!isLoading && !error && feeItems.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-4xl mb-3">💰</p>
            <p className="font-semibold text-gray-700 dark:text-gray-200">No fee records yet</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Fee records will appear here once students are enrolled and fee structures are configured.
            </p>
          </div>
        )}

        {!isLoading && !error && feeItems.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-900/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {feeItems.map(item => (
                  <tr key={item.studentId} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">{item.studentName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{formatLkr(item.balance)}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={item.status} /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{item.dueDate ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main FeesPage ────────────────────────────────────────────────────────────

export const FeesPage: React.FC = () => {
  const { user } = useAuth();

  const roleName = user?.userRoles?.[0]?.role?.name ?? '';
  const isTeacher = roleName === 'Teacher';
  const isAdminOrAbove = roleName === 'Admin' || roleName === 'SuperAdmin';

  return (
    <BaseLayout>
      <div className="bg-transparent p-5 md:p-8">
        {isTeacher ? (
          <TeacherFeesView />
        ) : isAdminOrAbove ? (
          <AdminFeesView />
        ) : (
          // Student or other: show their own payment status
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">🚫</p>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Access Restricted</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              The Fees module is available to Teachers, Admins, and SuperAdmins.
            </p>
          </div>
        )}
      </div>
    </BaseLayout>
  );
};
