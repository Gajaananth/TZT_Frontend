import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BaseLayout } from '../components/layout/BaseLayout';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/api';

interface ExamSummary {
  id: string;
  title: string;
  description?: string | null;
  course?: { title?: string } | null;
  durationMinutes?: number | null;
  passingScore?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
  createdAt?: string;
  questions?: Array<{ id: string }>;
}

export const ExamsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const roleName = user?.userRoles?.[0]?.role?.name || '';
  const isStudent = roleName === 'Student';
  const isTeacher = roleName === 'Teacher';
  const isAdminOrSuperAdmin = roleName === 'Admin' || roleName === 'SuperAdmin';

  const loadExams = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/exams', { params: { page: 1, limit: 50 } });
      setExams(response.data?.data?.exams || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Unable to load exams right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadExams();
  }, []);

  const getExamStatus = (exam: ExamSummary) => {
    if (!exam.startDate || !exam.endDate) return 'Active';

    const now = new Date();
    const start = new Date(exam.startDate);
    const end = new Date(exam.endDate);

    if (now < start) return 'Upcoming';
    if (now > end) return 'Closed';
    return 'Active';
  };

  return (
    <BaseLayout>
      <div className="space-y-6 bg-transparent p-5 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-indigo-600 dark:text-indigo-400">
              {isStudent ? 'Assessments & Quizzes' : isTeacher ? 'Authoring & Grading' : 'Exam Management'}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {isStudent ? 'My Scheduled Exams' : isTeacher ? 'Exam Authoring Studio' : 'Examination Center'}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {isStudent
                ? 'Take your assigned course tests, practice quizzes, and view scored evaluation results.'
                : isTeacher
                ? 'Create exam papers, build question pools, set passing benchmarks, and grade submissions.'
                : 'Monitor testing schedules, student attempts, and academic performance across all courses.'}
            </p>
          </div>
          <div className="flex gap-3">
            {(isAdminOrSuperAdmin || isTeacher) && (
              <Button
                onClick={() => navigate('/exams/new')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md text-sm"
              >
                + Create New Exam
              </Button>
            )}
            <Button variant="outline" className="text-sm" onClick={() => void loadExams()}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Available Tests</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{exams.length}</p>
          </div>
          <div className="glass p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Exams</p>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
              {exams.filter((e) => getExamStatus(e) === 'Active').length}
            </p>
          </div>
          <div className="glass p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isStudent ? 'Graded Results' : 'Grading Pool'}
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {exams.length}
            </p>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full py-16 text-center text-sm text-gray-500">Loading exams…</div>
          ) : exams.length === 0 ? (
            <div className="col-span-full py-16 text-center text-sm text-gray-500">
              {isStudent ? 'No exams are currently assigned to you.' : 'No exams created yet. Click "+ Create New Exam" to begin.'}
            </div>
          ) : (
            exams.map((exam) => {
              const status = getExamStatus(exam);
              return (
                <div
                  key={exam.id}
                  className="glass flex flex-col justify-between p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl group border border-slate-200 dark:border-slate-800"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                        {exam.course?.title || 'Academic Assessment'}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          status === 'Active'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {status}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                      {exam.title}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {exam.description || 'Comprehensive evaluation covering course competencies and learning objectives.'}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Duration: </span>
                        {exam.durationMinutes ? `${exam.durationMinutes} mins` : 'Untimed'}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Pass Mark: </span>
                        {exam.passingScore ? `${exam.passingScore}%` : '50%'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    {isStudent ? (
                      <Button
                        onClick={() => navigate(`/exams/${exam.id}/attempt`)}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md"
                      >
                        📝 Start / Take Exam
                      </Button>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/grading`)}
                          className="text-xs"
                        >
                          Grade Submissions
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => navigate(`/exams/${exam.id}/attempt`)}
                          className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          Preview Test →
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </BaseLayout>
  );
};
