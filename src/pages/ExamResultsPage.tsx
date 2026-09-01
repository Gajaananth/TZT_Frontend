import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BaseLayout } from '../components/layout/BaseLayout';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { apiClient } from '../lib/api';

interface ExamResult {
  id: string;
  attemptId: string;
  grade: string;
  issuedAt?: string | null;
  attempt?: {
    id: string;
    score: number;
    exam?: {
      title: string;
      passingScore: number;
      durationMinutes: number;
    };
  };
}

interface QuestionResult {
  questionId: string;
  questionText: string;
  type: string;
  points: number;
  pointsEarned: number;
  isCorrect?: boolean | null;
  answerText?: string;
  selectedOptions?: number[];
  correctAnswer?: string;
  options?: string[];
}

export const ExamResultsPage: React.FC = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState<ExamResult | null>(null);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadResults = async () => {
      if (!attemptId) return;

      try {
        const [resultResp, detailResp] = await Promise.all([
          apiClient.get(`/exams/${attemptId}/results`),
          apiClient.get(`/exams/${attemptId}/details`),
        ]);

        setResult(resultResp.data?.data?.results || null);
        setQuestionResults(detailResp.data?.data?.details || []);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    void loadResults();
  }, [attemptId]);

  if (loading) {
    return (
      <BaseLayout>
        <div className="flex items-center justify-center p-8 text-gray-500">Loading results...</div>
      </BaseLayout>
    );
  }

  if (error || !result) {
    return (
      <BaseLayout>
        <div className="space-y-6 bg-transparent p-5 md:p-8">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            {error || 'Results not found'}
          </div>
          <Button onClick={() => navigate('/exams')}>Back to Exams</Button>
        </div>
      </BaseLayout>
    );
  }

  const examTitle = result.attempt?.exam?.title || 'Exam';
  const score = result.attempt?.score || 0;
  const passingScore = result.attempt?.exam?.passingScore || 0;
  const passed = score >= passingScore;
  const totalPoints = questionResults.reduce((sum, q) => sum + q.points, 0);

  return (
    <BaseLayout>
      <div className="space-y-6 bg-transparent p-5 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-indigo-600 dark:text-indigo-400">Assessment results</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{examTitle}</h1>
          </div>
          <Button variant="outline" onClick={() => navigate('/exams')}>Back to Exams</Button>
        </div>

        {/* Score Summary */}
        <div className={`glass rounded-xl p-8 text-center ${passed ? 'border-emerald-200 dark:border-emerald-900/40' : 'border-red-200 dark:border-red-900/40'}`}>
          <p className={`text-sm font-semibold uppercase tracking-[0.25em] ${passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {passed ? '✓ PASSED' : '✗ FAILED'}
          </p>
          <p className="mt-4 text-6xl font-bold text-gray-900 dark:text-white">
            {Math.round(score)}%
          </p>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            {totalPoints > 0 ? `${Math.round((score / 100) * totalPoints)} of ${totalPoints} points` : 'Score pending'}
          </p>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Passing score: {passingScore}%
          </p>
        </div>

        {/* Detailed Results */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Question Breakdown</h2>
          {questionResults.map((question, idx) => {
            const isCorrect = question.type === 'Essay' || question.type === 'Short_Answer' ? question.isCorrect : (question.selectedOptions && question.selectedOptions[0] === Number(question.correctAnswer)) || question.answerText === question.correctAnswer;

            return (
              <Card key={question.questionId} className={`space-y-4 border-l-4 ${isCorrect ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Question {idx + 1}: {question.questionText}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      Type: {question.type} • Points: {question.pointsEarned}/{question.points}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold whitespace-nowrap ${
                    isCorrect
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                    {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                </div>

                {/* Answer Display */}
                <div className="space-y-2 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
                  {question.type === 'MCQ' && question.options ? (
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Your answer:</p>
                      <p className="mt-1 text-gray-900 dark:text-white">
                        {question.selectedOptions && question.selectedOptions[0] !== undefined && question.options[question.selectedOptions[0]]
                          ? question.options[question.selectedOptions[0]]
                          : 'No answer provided'}
                      </p>
                      {!isCorrect ? (
                        <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                          Correct answer:
                        </p>
                      ) : null}
                      {!isCorrect && question.correctAnswer ? (
                        <p className="mt-1 text-emerald-700 dark:text-emerald-300">
                          {question.options[Number(question.correctAnswer)] || 'N/A'}
                        </p>
                      ) : null}
                    </div>
                  ) : question.type === 'True_False' ? (
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Your answer:</p>
                      <p className="mt-1 text-gray-900 dark:text-white">{question.answerText || 'No answer'}</p>
                      {!isCorrect ? (
                        <>
                          <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-300">Correct:</p>
                          <p className="mt-1 text-emerald-700 dark:text-emerald-300">{question.correctAnswer}</p>
                        </>
                      ) : null}
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Your answer:</p>
                      <p className="mt-1 text-gray-900 dark:text-white">{question.answerText || '(Empty)'}</p>
                      <p className="mt-2 rounded bg-amber-50 p-2 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                        This response awaits manual grading by an instructor.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        <Button onClick={() => navigate('/exams')} className="w-full">
          Back to Exams
        </Button>
      </div>
    </BaseLayout>
  );
};
