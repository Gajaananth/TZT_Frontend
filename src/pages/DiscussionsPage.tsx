import React, { useEffect, useMemo, useState } from 'react';
import { BaseLayout } from '../components/layout/BaseLayout';
import { Button } from '../components/ui/button';
import { apiClient } from '../lib/api';

interface Reply {
  id: string;
  content?: string | null;
  createdAt?: string;
  student?: { id: string; user?: { firstName?: string; lastName?: string } };
  reactions?: Array<{ id: string; type?: string }>; 
}

interface Topic {
  id: string;
  title: string;
  content?: string | null;
  courseId?: string | null;
  createdAt?: string;
  student?: { id: string; user?: { firstName?: string; lastName?: string } };
  replies?: Reply[];
}

export const DiscussionsPage: React.FC = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadCourses = async () => {
    try {
      const response = await apiClient.get('/courses', { params: { page: 1, limit: 100 } });
      const list = response.data?.data?.courses ?? response.data?.courses ?? [];
      setCourses(list);
    } catch (err) {
      console.error('Failed to load courses for discussions');
    }
  };

  const loadTopics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/discussions', { params: { page: 1, limit: 50, courseId: selectedCourse !== 'all' ? selectedCourse : undefined } });
      const list = response.data?.data ?? response.data?.topics ?? [];
      setTopics(Array.isArray(list) ? list : []);
      if (!selectedTopicId && Array.isArray(list) && list.length > 0) {
        setSelectedTopicId(list[0].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Unable to load discussions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCourses();
  }, []);

  useEffect(() => {
    void loadTopics();
  }, [selectedCourse]);

  const selectedTopic = useMemo(
    () => topics.find((topic) => topic.id === selectedTopicId) || topics[0] || null,
    [topics, selectedTopicId],
  );

  const createTopic = async () => {
    if (!title.trim() || !content.trim() || !selectedCourse || selectedCourse === 'all') {
      setError('Choose a course and provide a title and description before posting.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await apiClient.post('/discussions', {
        title: title.trim(),
        content: content.trim(),
        courseId: selectedCourse,
      });
      setTitle('');
      setContent('');
      await loadTopics();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create the topic.');
    } finally {
      setSubmitting(false);
    }
  };

  const addReply = async () => {
    if (!selectedTopic || !replyContent.trim()) {
      setError('Write a reply before sending it.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await apiClient.post(`/discussions/${selectedTopic.id}/replies`, {
        content: replyContent.trim(),
      });
      setReplyContent('');
      await loadTopics();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to add the reply.');
    } finally {
      setSubmitting(false);
    }
  };

  const reactToReply = async (replyId: string) => {
    setSubmitting(true);
    setError(null);

    try {
      await apiClient.post(`/discussions/replies/${replyId}/react`, { type: 'LIKE' });
      await loadTopics();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to add the reaction.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseLayout>
      <div className="space-y-6 bg-transparent p-5 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-600 dark:text-cyan-400">
              Community
            </p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Discussions</h1>
          </div>
          <Button variant="outline" onClick={() => void loadTopics()}>
            Refresh
          </Button>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Course filter</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              >
                <option value="all">All courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New topic</h2>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Topic title"
                className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="What would you like to discuss?"
                className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
              <div className="mt-3 flex justify-end">
                <Button onClick={() => void createTopic()} disabled={submitting}>
                  {submitting ? 'Posting…' : 'Post topic'}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  Loading topics…
                </div>
              ) : topics.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  No topics match this filter yet.
                </div>
              ) : (
                topics.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setSelectedTopicId(topic.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedTopic?.id === topic.id
                        ? 'border-cyan-500 bg-cyan-50 dark:border-cyan-400 dark:bg-cyan-950/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-gray-900 dark:text-white">{topic.title}</span>
                      <span className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {topic.replies?.length ?? 0} replies
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {topic.student?.user ? `${topic.student.user.firstName ?? ''} ${topic.student.user.lastName ?? ''}`.trim() : 'Student'}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            {selectedTopic ? (
              <>
                <div className="border-b border-slate-200 pb-4 dark:border-slate-700">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedTopic.title}</h2>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{selectedTopic.content}</p>
                  <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    Posted by {selectedTopic.student?.user ? `${selectedTopic.student.user.firstName ?? ''} ${selectedTopic.student.user.lastName ?? ''}`.trim() : 'Student'}
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {(selectedTopic.replies ?? []).map((reply) => (
                    <div key={reply.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {reply.student?.user ? `${reply.student.user.firstName ?? ''} ${reply.student.user.lastName ?? ''}`.trim() : 'Student'}
                        </p>
                        <button
                          type="button"
                          onClick={() => void reactToReply(reply.id)}
                          className="rounded-full bg-cyan-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300"
                        >
                          {reply.reactions?.length ?? 0} like{(reply.reactions?.length ?? 0) === 1 ? '' : 's'}
                        </button>
                      </div>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{reply.content}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={3}
                    placeholder="Write a reply to this topic…"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  />
                  <div className="mt-3 flex justify-end">
                    <Button onClick={() => void addReply()} disabled={submitting}>
                      {submitting ? 'Sending…' : 'Add reply'}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-500 dark:text-slate-400">Select a topic to view the thread.</div>
            )}
          </div>
        </div>
      </div>
    </BaseLayout>
  );
};
