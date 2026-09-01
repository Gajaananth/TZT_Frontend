import React, { useEffect, useState } from 'react';
import { BaseLayout } from '../components/layout/BaseLayout';
import { Button } from '../components/ui/button';
import { apiClient } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export const AttendancePage: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ studentId: '', courseId: '', batchId: '', classDate: new Date().toISOString().slice(0,10), status: 'PRESENT', remarks: '' });
  const { user } = useAuth();

  const [filters, setFilters] = useState({ batchId: '', courseId: '', startDate: new Date().toISOString().slice(0,10), endDate: new Date().toISOString().slice(0,10), viewBy: 'date' });
  const [breakdown, setBreakdown] = useState<{ present: number; absent: number; late: number; excused: number } | null>(null);

  const loadStudents = async () => {
    try {
      const res = await apiClient.get('/students', { params: { limit: 200 } });
      setStudents(res.data.data.students || []);
    } catch (e) {
      // ignore
    }
  };

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/attendance', { params: { limit: 100 } });
      setRecords(res.data.data.records || []);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const loadBreakdown = async () => {
    try {
      const params: any = { viewBy: filters.viewBy };
      if (filters.batchId) params.batchId = filters.batchId;
      if (filters.courseId) params.courseId = filters.courseId;
      if (filters.startDate) params.startDate = new Date(filters.startDate).toISOString();
      if (filters.endDate) params.endDate = new Date(filters.endDate).toISOString();

      const res = await apiClient.get('/attendance', { params });
      setBreakdown(res.data.data.breakdown || null);
    } catch (e) {
      setBreakdown(null);
    }
  };

  useEffect(() => {
    void loadStudents();
    void loadRecords();
    void loadBreakdown();
  }, []);

  useEffect(() => {
    void loadBreakdown();
  }, [filters]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/attendance', { ...form, classDate: new Date(form.classDate).toISOString() });
      await loadRecords();
    } catch (err) {
      // show error
    }
  };

  const handleCorrect = async (attendanceId: string) => {
    const reason = prompt('Reason for correction');
    const newStatus = prompt('New status (PRESENT|ABSENT|LATE|EXCUSED)');
    if (!reason || !newStatus) return;
    try {
      await apiClient.post('/attendance/correct', { originalAttendanceId: attendanceId, newStatus, reason });
      await loadRecords();
      void loadBreakdown();
    } catch (err) {
      alert('Correction failed');
    }
  };

  return (
    <BaseLayout>
      <div className="space-y-6 bg-transparent p-5 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Attendance</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Record and correct attendance with backdating support.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="glass grid grid-cols-1 gap-3 p-5 md:grid-cols-4">
          <select value={form.studentId} onChange={(e) => setForm({...form, studentId: e.target.value})} className="rounded-xl border border-white/40 bg-white/40 p-3 dark:border-white/10 dark:bg-slate-950/30">
            <option value="">Select student</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.user?.firstName} {s.user?.lastName}</option>)}
          </select>
          <input type="date" value={form.classDate} onChange={(e) => setForm({...form, classDate: e.target.value})} className="rounded-xl border border-white/40 bg-white/40 p-3 dark:border-white/10 dark:bg-slate-950/30" />
          <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} className="rounded-xl border border-white/40 bg-white/40 p-3 dark:border-white/10 dark:bg-slate-950/30">
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="LATE">Late</option>
            <option value="EXCUSED">Excused</option>
          </select>
          <Button type="submit">Record</Button>
        </form>

        <div className="glass grid grid-cols-1 gap-3 p-5 md:grid-cols-4">
          <select value={filters.batchId} onChange={(e) => setFilters({...filters, batchId: e.target.value})} className="rounded-xl border border-white/40 bg-white/40 p-3 dark:border-white/10 dark:bg-slate-950/30">
            <option value="">All batches</option>
          </select>
          <select value={filters.courseId} onChange={(e) => setFilters({...filters, courseId: e.target.value})} className="rounded-xl border border-white/40 bg-white/40 p-3 dark:border-white/10 dark:bg-slate-950/30">
            <option value="">All courses</option>
          </select>
          <input type="date" value={filters.startDate} onChange={(e) => setFilters({...filters, startDate: e.target.value})} className="rounded-xl border border-white/40 bg-white/40 p-3 dark:border-white/10 dark:bg-slate-950/30" />
          <input type="date" value={filters.endDate} onChange={(e) => setFilters({...filters, endDate: e.target.value})} className="rounded-xl border border-white/40 bg-white/40 p-3 dark:border-white/10 dark:bg-slate-950/30" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass p-4">
            <p className="text-sm text-gray-500">Present</p>
            <p className="text-2xl font-bold">{breakdown?.present ?? '-'}</p>
          </div>
          <div className="glass p-4">
            <p className="text-sm text-gray-500">Absent</p>
            <p className="text-2xl font-bold">{breakdown?.absent ?? '-'}</p>
          </div>
          <div className="glass p-4">
            <p className="text-sm text-gray-500">Late</p>
            <p className="text-2xl font-bold">{breakdown?.late ?? '-'}</p>
          </div>
          <div className="glass p-4">
            <p className="text-sm text-gray-500">Excused</p>
            <p className="text-2xl font-bold">{breakdown?.excused ?? '-'}</p>
          </div>
        </div>

        <div className="glass overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Records</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? <div className="p-6">Loading…</div> : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-900/60">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Class Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {records.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4">{r.student?.user?.firstName} {r.student?.user?.lastName}</td>
                      <td className="px-6 py-4">{new Date(r.classDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4">{r.latestStatus}</td>
                      <td className="px-6 py-4">
                        {user?.userRoles?.some((ur: any) => ['Admin', 'SuperAdmin'].includes(ur.role?.name)) ? (
                          <Button onClick={() => handleCorrect(r.id)}>Correct</Button>
                        ) : (
                          <span className="text-sm text-gray-500">---</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </BaseLayout>
  );
};
