import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BaseLayout } from '../components/layout/BaseLayout';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/api';

interface CourseSummary {
  id: string;
  title: string;
  code: string;
  description?: string | null;
  difficultyLevel?: string | null;
  durationWeeks?: number | null;
  category?: { name?: string } | null;
  modules?: Array<{ id: string; title: string; lessons?: Array<{ id: string }> }>;
  enrollments?: Array<{ id: string }>;
  createdAt?: string;
}

export const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const roleName = user?.userRoles?.[0]?.role?.name || '';
  const isStudent = roleName === 'Student';
  const isTeacher = roleName === 'Teacher';
  const isAdminOrSuperAdmin = roleName === 'Admin' || roleName === 'SuperAdmin';

  const loadCourses = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/courses', { params: { page: 1, limit: 50 } });
      setCourses(response.data?.data?.courses || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Unable to load courses right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return courses;

    return courses.filter((course) => {
      const haystack = [course.title, course.code, course.description, course.category?.name, course.difficultyLevel]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [courses, search]);

  const totalLessons = courses.reduce(
    (count, course) => count + (course.modules?.reduce((moduleTotal, moduleItem) => moduleTotal + (moduleItem.lessons?.length || 0), 0) || 0),
    0,
  );

  return (
    <BaseLayout>
      <div className="space-y-6 bg-transparent p-5 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-violet-600 dark:text-violet-400">
              {isStudent ? 'Enrolled Learning' : isTeacher ? 'Teaching Curriculum' : 'Academic catalog'}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {isStudent ? 'My Learning Courses' : isTeacher ? 'Teaching Courses & Modules' : 'Course Management'}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {isStudent
                ? 'Access your course syllabus, lecture modules, study resources, and lesson materials.'
                : isTeacher
                ? 'Manage curriculum content, structure modules, upload lesson materials, and track class progress.'
                : 'Browse academic offerings, teaching plans, and student enrollment status for each course.'}
            </p>
          </div>
          <div className="flex gap-3">
            {(isAdminOrSuperAdmin || isTeacher) && (
              <Button
                onClick={() => navigate('/courses/new')}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-md w-fit text-sm"
              >
                + Create Course
              </Button>
            )}
            <Button variant="outline" className="w-fit text-sm" onClick={() => void loadCourses()}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Courses</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{courses.length}</p>
          </div>
          <div className="glass p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Learning Modules</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {courses.reduce((count, course) => count + (course.modules?.length || 0), 0)}
            </p>
          </div>
          <div className="glass p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Lessons</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalLessons}</p>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="w-full md:max-w-md">
            <input
              type="search"
              placeholder="Search course title, code, category, or level…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-violet-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-900 dark:text-white">{filteredCourses.length}</span> of {courses.length} courses
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full py-16 text-center text-sm text-gray-500 dark:text-gray-400">
              Loading courses…
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="col-span-full py-16 text-center text-sm text-gray-500 dark:text-gray-400">
              No courses found matching your criteria.
            </div>
          ) : (
            filteredCourses.map((course) => (
              <div
                key={course.id}
                onClick={() => navigate(`/courses/${course.id}`)}
                className="glass flex flex-col justify-between p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                      {course.code}
                    </span>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {course.category?.name || 'General'}
                    </span>
                  </div>

                  <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {course.title}
                  </h2>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                    {course.description || 'Comprehensive curriculum with lessons, assessments, and study resources.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{course.modules?.length || 0} Modules</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {isStudent ? 'Open Lessons →' : 'Manage Course →'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </BaseLayout>
  );
};
