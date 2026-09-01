import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BaseLayout } from '../components/layout/BaseLayout';
import { Button } from '../components/ui/button';
import { apiClient } from '../lib/api';

interface Question {
  id: string;
  questionText: string;
  type: 'MCQ' | 'True_False' | 'Short_Answer' | 'Essay';
  points: number;
  options?: Array<string>;
  explanation?: string | null;
}

interface ExamQuestion extends Question {
  sequenceNumber: number;
}

interface ExamAttempt {
  id: string;
  examId: string;
  startedAt: string;
  submittedAt?: string | null;
  status: string;
  score: number;
  exam?: {
    title: string;
    durationMinutes: number;
    passingScore: number;
  };
}

interface ExamResponse {
  questionId: string;
  answerText?: string;
  selectedOptions?: number[];
}

export const ExamTakerPage: React.FC = () => {
  const { id: examId, attemptId: urlAttemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, ExamResponse>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Start exam or resume attempt
  useEffect(() => {
    const initializeAttempt = async () => {
      try {
        if (urlAttemptId) {
          const response = await apiClient.get(`/exams/${urlAttemptId}/resume`);
          setAttempt(response.data?.data?.attempt || response.data?.data || null);
        } else if (examId) {
          const response = await apiClient.post('/exams/start', { examId });
          setAttempt(response.data?.data?.attempt || response.data?.data || null);
        }
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to start exam');
      }
    };

    void initializeAttempt();
  }, [examId, urlAttemptId]);

  // Load exam questions once we have an attempt
  useEffect(() => {
    const loadQuestions = async () => {
      if (!attempt?.examId) return;

      try {
        const response = await apiClient.get(`/exams/${attempt.examId}/questions`);
        setQuestions(response.data?.data?.questions || []);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to load exam questions');
        setLoading(false);
      }
    };

    void loadQuestions();
  }, [attempt?.examId]);

  // Timer countdown
  useEffect(() => {
    if (!attempt?.startedAt || attempt?.submittedAt) return;

    const timer = setInterval(() => {
      const now = new Date();
      const started = new Date(attempt.startedAt);
      const durationMs = (attempt.exam?.durationMinutes || 0) * 60 * 1000;
      const elapsed = now.getTime() - started.getTime();
      const remaining = Math.max(0, durationMs - elapsed);

      setTimeRemaining(remaining);

      // Auto-submit when time runs out
      if (remaining === 0 && attempt.status !== 'submitted') {
        void handleSubmit();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [attempt]);

  const handleAnswerChange = (questionId: string, answer: any) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);

    // Auto-save answer
    void apiClient.post(`/exams/${attempt?.id}/autosave`, {
      questionId,
      response: answer,
    });
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      // Collect all answers
      const allResponses = questions.map((q) => ({
        questionId: q.id,
        ...(answers[q.id] || {}),
      }));

      await apiClient.post(`/exams/${attempt?.id}/submit`, {
        responses: allResponses,
      });

      navigate(`/exams/${attempt?.id}/results`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit exam');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <BaseLayout>
        <div className="flex items-center justify-center p-8 text-gray-500">Loading exam...</div>
      </BaseLayout>
    );
  }

  if (error) {
    return (
      <BaseLayout>
        <div className="space-y-6 bg-transparent p-5 md:p-8">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            {error}
          </div>
          <Button onClick={() => navigate('/exams')}>Back to Exams</Button>
        </div>
      </BaseLayout>
    );
  }

  if (!attempt || questions.length === 0) {
    return (
      <BaseLayout>
        <div className="space-y-6 bg-transparent p-5 md:p-8">
          <div className="glass p-6 text-sm text-gray-500">No questions available for this exam.</div>
          <Button onClick={() => navigate('/exams')}>Back to Exams</Button>
        </div>
      </BaseLayout>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) return null;
  const minutesRemaining = Math.floor(timeRemaining / 60000);
  const secondsRemaining = Math.floor((timeRemaining % 60000) / 1000);
  const timerColor = timeRemaining < 300000 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400';

  return (
    <BaseLayout>
      <div className="flex h-[calc(100vh-5rem)] gap-6 bg-transparent p-5 md:p-8">
        {/* Question Navigation Sidebar */}
        <div className="glass hidden flex-col gap-4 overflow-hidden rounded-xl p-4 md:flex md:w-48">
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
            <p className={`mt-1 text-lg font-bold ${timerColor}`}>
              {minutesRemaining}:{secondsRemaining.toString().padStart(2, '0')}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                  idx === currentQuestionIndex
                    ? 'bg-indigo-500 text-white'
                    : answers[q.id]
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                Q{idx + 1}
              </button>
            ))}
          </div>
          <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
            <Button
              size="sm"
              className="w-full"
              onClick={() => handleSubmit()}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Exam'}
            </Button>
          </div>
        </div>

        {/* Main Question Area */}
        <div className="flex-1 flex flex-col gap-6 overflow-auto">
          {/* Mobile Timer Bar */}
          <div className="glass md:hidden flex items-center justify-between rounded-xl p-4">
            <span className={`text-lg font-bold ${timerColor}`}>
              {minutesRemaining}:{secondsRemaining.toString().padStart(2, '0')}
            </span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>

          {/* Question Card */}
          <div className="glass flex-1 rounded-xl p-8 flex flex-col">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {currentQuestion?.questionText}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Points: {currentQuestion?.points}
              </p>

              {/* Answer Input Based on Type */}
              <div className="space-y-4">
                {currentQuestion?.type === 'MCQ' && currentQuestion?.options ? (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, idx) => (
                      <label key={idx} className="flex items-center gap-3 p-3 rounded-lg border-2 border-slate-200 hover:border-indigo-400 cursor-pointer transition dark:border-slate-700 dark:hover:border-indigo-500">
                        <input
                          type="radio"
                          name={currentQuestion?.id || ''}
                          checked={(answers[currentQuestion?.id || '']?.selectedOptions || [])[0] === idx}
                          onChange={() =>
                            handleAnswerChange(currentQuestion?.id || '', { selectedOptions: [idx] })
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-gray-700 dark:text-gray-200">{option}</span>
                      </label>
                    ))}
                  </div>
                ) : currentQuestion?.type === 'True_False' ? (
                  <div className="space-y-3">
                    {['True', 'False'].map((option) => (
                      <label key={option} className="flex items-center gap-3 p-3 rounded-lg border-2 border-slate-200 hover:border-indigo-400 cursor-pointer transition dark:border-slate-700 dark:hover:border-indigo-500">
                        <input
                          type="radio"
                          name={currentQuestion?.id || ''}
                          checked={answers[currentQuestion?.id || '']?.answerText === option}
                          onChange={() =>
                            handleAnswerChange(currentQuestion?.id || '', { answerText: option })
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-gray-700 dark:text-gray-200">{option}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={answers[currentQuestion?.id || '']?.answerText || ''}
                    onChange={(e) =>
                      handleAnswerChange(currentQuestion?.id || '', { answerText: e.target.value })
                    }
                    placeholder="Type your answer here..."
                    className="w-full h-32 rounded-xl border-2 border-slate-200 bg-white/50 p-4 text-gray-700 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950/30 dark:text-gray-200 dark:focus:border-indigo-500"
                  />
                )}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
              >
                ← Previous
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))
                }
                disabled={currentQuestionIndex === questions.length - 1}
              >
                Next →
              </Button>
              <div className="flex-1" />
              <Button onClick={() => handleSubmit()} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
};
