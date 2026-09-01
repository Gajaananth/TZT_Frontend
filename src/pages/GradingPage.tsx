import React, { useEffect, useMemo, useState } from 'react';
import { BaseLayout } from '../components/layout/BaseLayout';
import { Button } from '../components/ui/button';
import { apiClient } from '../lib/api';

interface QueueItem {
  id: string;
  status: string;
  score?: number | string | null;
  submittedAt?: string | null;
  startedAt?: string | null;
  student?: {
    id: string;
    user?: { firstName?: string; lastName?: string; email?: string };
  };
  exam?: {
    id: string;
    title?: string;
  };
  responses?: Array<{
    id: string;
    question?: { id: string; questionText?: string; type?: string };
    answerText?: string | null;
    selectedOptions?: unknown[] | null;
  }>;
}

export const GradingPage: React.FC = () => {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadQueue = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/grading/queue');
      const payload = response.data;
      const list = Array.isArray(payload) ? payload : payload?.data ?? payload?.items ?? [];
      setItems(list);
      if (list.length && !selectedAttemptId) {
        setSelectedAttemptId(list[0].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Unable to load the grading queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQueue();
  }, []);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedAttemptId) || items[0] || null,
    [items, selectedAttemptId],
  );

  useEffect(() => {
    if (selectedItem) {
      setScore(String(selectedItem.score ?? ''));
      setFeedback('');
    }
  }, [selectedItem]);

  const submitGrade = async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    setError(null);

    try {
      const numericScore = Number(score);
      const payload: Record<string, unknown> = { score: Number.isFinite(numericScore) ? numericScore : 0 };
      if (feedback.trim()) payload.feedback = feedback.trim();

      await apiClient.post(`/grading/manual/${selectedItem.id}`, payload);
      await loadQueue();
      setFeedback('');
      setScore('');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to grade the submission.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseLayout>
      <div className="space-y-6 bg-transparent p-5 md:p-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-indigo-600 dark:text-indigo-400">
              Assessment Review
            </p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Grading Studio</h1>
          </div>
          <Button variant="outline" onClick={() => void loadQueue()}>
            Refresh queue
          </Button>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            Loading manual grading queue…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            No exam responses are waiting for manual grading.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-3">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedAttemptId(item.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedItem?.id === item.id
                      ? 'border-indigo-500 bg-indigo-50 shadow-sm dark:border-indigo-400 dark:bg-indigo-950/30'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.exam?.title || 'Exam attempt'}</span>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {item.student?.user ? `${item.student.user.firstName ?? ''} ${item.student.user.lastName ?? ''}`.trim() : 'Student'}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Submitted {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : 'recently'}
                  </div>
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              {selectedItem ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-700">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedItem.exam?.title || 'Exam submission'}</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {selectedItem.student?.user ? `${selectedItem.student.user.firstName ?? ''} ${selectedItem.student.user.lastName ?? ''}`.trim() : 'Student'}
                      </p>
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {selectedItem.submittedAt ? `Queued ${new Date(selectedItem.submittedAt).toLocaleString()}` : 'Awaiting review'}
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    {selectedItem.responses?.map((response) => (
                      <div key={response.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {response.question?.questionText || 'Question'}
                        </p>
                        <p className="mt-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {response.question?.type || 'Unknown type'}
                        </p>
                        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                          {response.answerText || (Array.isArray(response.selectedOptions) ? response.selectedOptions.join(', ') : 'No response captured')}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-[160px_1fr]">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Score
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      />
                    </label>

                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Feedback
                      <textarea
                        rows={5}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Leave a brief note for the learner…"
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      />
                    </label>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button onClick={() => void submitGrade()} disabled={submitting}>
                      {submitting ? 'Saving grade…' : 'Submit grade'}
                    </Button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </BaseLayout>
  );
};
