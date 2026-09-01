import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BaseLayout } from '../components/layout/BaseLayout';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { apiClient } from '../lib/api';

interface LessonItem {
  id: string;
  title: string;
  description?: string | null;
  lessonType?: string | null;
  durationMinutes?: number | null;
  resources?: Array<{ id: string; title: string; resourceType?: string | null; fileUrl?: string | null }>;
}

interface ModuleItem {
  id: string;
  title: string;
  description?: string | null;
  sequenceNumber?: number;
  lessons?: LessonItem[];
}

interface CourseDetail {
  id: string;
  title: string;
  code: string;
  description?: string | null;
  category?: { name?: string } | null;
  difficultyLevel?: string | null;
  durationWeeks?: number | null;
  prerequisites?: string | null;
  learningOutcomes?: string | null;
  modules?: ModuleItem[];
  enrollments?: Array<{ id: string; student?: { user?: { firstName?: string; lastName?: string } } }>;
}

export const CourseDetailPage: React.FC = () => {
  const { id } = useParams();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCourse = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get(`/courses/${id}`);
        setCourse(response.data?.data || null);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Unable to load this course right now.');
      } finally {
        setLoading(false);
      }
    };

    void loadCourse();
  }, [id]);

  return (
    <BaseLayout>
      <div className="space-y-6 bg-transparent p-5 md:p-8">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-14 w-72" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-52 w-full" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">{error}</div>
        ) : course ? (
          <>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-violet-600 dark:text-violet-400">{course.category?.name || 'Course'}</p>
                <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{course.title}</h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{course.code}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="w-fit">Enroll</Button>
                <Button className="w-fit">Submit assignment</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <Card>
                <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{course.durationWeeks || 0} wks</p>
              </Card>
              <Card>
                <p className="text-sm text-gray-500 dark:text-gray-400">Level</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{course.difficultyLevel || 'N/A'}</p>
              </Card>
              <Card>
                <p className="text-sm text-gray-500 dark:text-gray-400">Modules</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{course.modules?.length || 0}</p>
              </Card>
              <Card>
                <p className="text-sm text-gray-500 dark:text-gray-400">Learners</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{course.enrollments?.length || 0}</p>
              </Card>
            </div>

            <Card>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Course overview</h2>
              <p className="mt-3 text-gray-600 dark:text-gray-300">{course.description || 'This course description is currently empty.'}</p>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Prerequisites</h3>
                  <p className="mt-2 text-gray-700 dark:text-gray-200">{course.prerequisites || 'None listed.'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Learning outcomes</h3>
                  <p className="mt-2 text-gray-700 dark:text-gray-200">{course.learningOutcomes || 'Not yet defined.'}</p>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Course modules</h2>
              {course.modules && course.modules.length > 0 ? (
                course.modules.map((moduleItem) => (
                  <Card key={moduleItem.id} className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{moduleItem.sequenceNumber ? `${moduleItem.sequenceNumber}. ` : ''}{moduleItem.title}</h3>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {moduleItem.lessons?.length || 0} lessons
                      </span>
                    </div>
                    {moduleItem.description ? <p className="text-sm text-gray-600 dark:text-gray-300">{moduleItem.description}</p> : null}

                    {moduleItem.lessons && moduleItem.lessons.length > 0 ? (
                      <div className="space-y-3">
                        {moduleItem.lessons.map((lesson) => (
                          <div key={lesson.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">{lesson.title}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{lesson.lessonType || 'General'} • {lesson.durationMinutes || 0} mins</p>
                              </div>
                              {lesson.resources && lesson.resources.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {lesson.resources.map((resource) => (
                                    <a
                                      key={resource.id}
                                      href={resource.fileUrl || '#'}
                                      target={resource.fileUrl ? '_blank' : undefined}
                                      rel={resource.fileUrl ? 'noreferrer' : undefined}
                                      className="rounded-full border border-violet-300 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100 dark:border-violet-700/60 dark:bg-violet-900/30 dark:text-violet-200"
                                      onClick={(event) => {
                                        if (!resource.fileUrl) {
                                          event.preventDefault();
                                        }
                                      }}
                                    >
                                      {resource.title}
                                    </a>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                            {lesson.description ? <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{lesson.description}</p> : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No lesson content has been added to this module yet.</p>
                    )}
                  </Card>
                ))
              ) : (
                <Card>
                  <p className="text-sm text-gray-500 dark:text-gray-400">No modules are defined for this course yet.</p>
                </Card>
              )}
            </div>
          </>
        ) : (
          <Card>
            <p className="text-sm text-gray-500 dark:text-gray-400">Course not found.</p>
          </Card>
        )}
      </div>
    </BaseLayout>
  );
};
