import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BaseLayout } from '../components/layout/BaseLayout';
import { Button } from '../components/ui/button';
import { AdminPasswordConfirmModal } from '../components/common/AdminPasswordConfirmModal';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/api';

export const StudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<any | null>(null);

  const roleName = user?.userRoles?.[0]?.role?.name || '';
  const isAdminOrSuperAdmin = roleName === 'Admin' || roleName === 'SuperAdmin';

  const loadStudents = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/students', { params: { limit: 50 } });
      setStudents(response.data?.data?.students || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Unable to load students right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStudents();
  }, []);

  const activeCount = students.filter((student) => student.isActive !== false).length;
  const pendingCount = students.filter((student) => student.isActive === false).length;

  const downloadCsv = async () => {
    try {
      const response = await apiClient.get('/students/export', { params: { limit: 1000 }, responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'students.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Unable to export students at the moment.');
    }
  };

  const handleConfirmDelete = async (password: string) => {
    if (!studentToDelete) return;
    await apiClient.delete(`/students/${studentToDelete.id}`, {
      data: { password },
    });
    setStudents((prev) => prev.filter((s) => s.id !== studentToDelete.id));
    setStudentToDelete(null);
  };

  return (
    <BaseLayout>
      <div className="space-y-6 bg-transparent p-5 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Track learners, enrollment status, and parent/guardian details from one place.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="w-fit" onClick={downloadCsv}>
              Export CSV
            </Button>
            <Button className="w-fit" onClick={() => void loadStudents()}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Enrolled</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{activeCount}</p>
          </div>
          <div className="glass p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending Review</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{pendingCount}</p>
          </div>
          <div className="glass p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Records Loaded</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{students.length}</p>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">{error}</div>
        ) : null}

        <div className="glass overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Students</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 text-sm text-gray-500 dark:text-gray-400">Loading students…</div>
            ) : students.length === 0 ? (
              <div className="p-6 text-sm text-gray-500 dark:text-gray-400">No students found yet.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-900/60">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Guardian</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</th>
                    {isAdminOrSuperAdmin && (
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {students.map((student) => {
                    const studentName = `${student.user?.firstName || ''} ${student.user?.lastName || ''}`.trim() || 'Student';
                    return (
                      <tr
                        key={student.id}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50"
                        onClick={() => navigate(`/students/${student.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900 dark:text-white">{studentName}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{student.studentId || student.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{student.batch?.name || student.batchId || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                          {student.guardian ? `${student.guardian.firstName} ${student.guardian.lastName}` : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${student.isActive === false ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'}`}>
                            {student.isActive === false ? 'Pending Review' : 'Active'}
                          </span>
                        </td>
                        {isAdminOrSuperAdmin && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/id-card/student/${student.id}`);
                              }}
                              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-500/10 dark:text-indigo-400 transition-colors"
                              title="View & Print ID Card"
                            >
                              🪪 ID Card
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setStudentToDelete(student);
                              }}
                              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-500/10 dark:text-red-400 transition-colors"
                              title="Remove Student"
                            >
                              🗑️ Remove
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <AdminPasswordConfirmModal
          isOpen={Boolean(studentToDelete)}
          onClose={() => setStudentToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Remove Student"
          itemName={studentToDelete ? `${studentToDelete.user?.firstName || ''} ${studentToDelete.user?.lastName || ''}`.trim() : ''}
          itemType="student"
        />
      </div>
    </BaseLayout>
  );
};
