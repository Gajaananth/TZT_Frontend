import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '../lib/api'

interface Question {
  id: string
  questionText: string
  type: string
  points: number
  options?: unknown[]
  difficulty?: string
}

interface ExamSection {
  title: string
  description?: string
  sequenceNumber: number
  questions: Array<{
    questionId: string
    points: number
    sequenceNumber: number
  }>
}

export const ExamCreatorPage: React.FC = () => {
  const navigate = useNavigate()
  const { examId } = useParams()
  const isEditing = !!examId

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    startDate: '',
    endDate: '',
    durationMinutes: 60,
    passingScore: 70,
    randomizeQuestions: false,
  })

  const [sections, setSections] = useState<ExamSection[]>([
    {
      title: 'General',
      sequenceNumber: 1,
      questions: [],
    },
  ])

  const [courses, setCourses] = useState<any[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set())
  const [currentSectionIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const { data } = await apiClient.get('/courses?limit=100')
        setCourses(data.data || [])
      } catch (err) {
        console.error('Failed to load courses:', err)
      }
    }

    const loadQuestions = async () => {
      try {
        const { data } = await apiClient.get('/questions?limit=500')
        setQuestions(data.data || [])
      } catch (err) {
        console.error('Failed to load questions:', err)
      }
    }

    loadCourses()
    loadQuestions()
  }, [])

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    })
  }

  const handleAddQuestion = (questionId: string) => {
    const question = questions.find(q => q.id === questionId)
    if (!question || !formData.courseId) return

    const updatedSections = [...sections]
    const section = updatedSections[currentSectionIndex] ?? updatedSections[0]
    if (!section) {
      setError('No question section available for this exam.')
      return
    }

    const exists = section.questions.some(q => q.questionId === questionId)
    if (exists) {
      setError('Question already added to this section')
      return
    }

    section.questions.push({
      questionId,
      points: question.points || 1,
      sequenceNumber: section.questions.length + 1,
    })

    setSections(updatedSections)
    setSelectedQuestions(new Set([...selectedQuestions, questionId]))
    setSuccess('Question added to section')
  }

  const handleRemoveQuestion = (questionId: string) => {
    const updatedSections = [...sections]
    const section = updatedSections[currentSectionIndex] ?? updatedSections[0]
    if (!section) return

    section.questions = section.questions.filter(q => q.questionId !== questionId)
    setSections(updatedSections)

    const newSelected = new Set(selectedQuestions)
    newSelected.delete(questionId)
    setSelectedQuestions(newSelected)
  }

  const handleUpdateQuestionPoints = (index: number, points: number) => {
    const updatedSections = [...sections]
    const section = updatedSections[currentSectionIndex] ?? updatedSections[0]
    if (!section || !section.questions[index]) return

    section.questions[index].points = Math.max(1, points)
    setSections(updatedSections)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (!formData.title || !formData.courseId) {
        throw new Error('Please fill in all required fields')
      }

      const firstSection = sections[0]
      if (!firstSection || firstSection.questions.length === 0) {
        throw new Error('Please add at least one question to the exam')
      }

      const payload = {
        ...formData,
        durationMinutes: parseInt(String(formData.durationMinutes)),
        passingScore: parseFloat(String(formData.passingScore)),
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        sections: sections.map(s => ({
          title: s.title,
          description: s.description,
          sequenceNumber: s.sequenceNumber,
          questions: s.questions,
        })),
      }

      await apiClient.post('/exams', payload)
      setSuccess(`Exam "${formData.title}" created successfully!`)
      setTimeout(() => {
        navigate(`/exams`)
      }, 1500)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create exam')
    } finally {
      setLoading(false)
    }
  }

  const currentSection = sections[currentSectionIndex] ?? sections[0]
  const sectionQuestionIds = new Set(currentSection?.questions.map(q => q.questionId) ?? [])

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{isEditing ? 'Edit' : 'Create'} Exam</h1>
          <p className="mt-2 text-gray-600">Build your exam by adding metadata and selecting questions from the bank</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800 border border-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg bg-green-50 p-4 text-green-800 border border-green-200">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Exam Metadata Section */}
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-6 text-gray-900">Exam Details</h2>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="e.g., Math Final Exam"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course *
                </label>
                <select
                  name="courseId"
                  value={formData.courseId}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.title || course.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Exam instructions and details"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  name="durationMinutes"
                  value={formData.durationMinutes}
                  onChange={handleFormChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  name="passingScore"
                  value={formData.passingScore}
                  onChange={handleFormChange}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="randomizeQuestions"
                  checked={formData.randomizeQuestions}
                  onChange={handleFormChange}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">
                  Randomize question order for each student
                </label>
              </div>
            </div>
          </div>

          {/* Questions Section */}
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2 text-gray-900">Questions</h2>
              <p className="text-sm text-gray-600">
                Add at least {1 - (currentSection?.questions.length ?? 0)} more question{(currentSection?.questions.length ?? 0) === 0 ? 's' : ''}
              </p>
            </div>

            {/* Questions Added to This Section */}
            {(currentSection?.questions.length ?? 0) > 0 && (
              <div className="mb-8 space-y-4">
                <h3 className="font-medium text-gray-900">Questions in {currentSection?.title}</h3>
                {currentSection?.questions.map((q, idx) => {
                  const questionDetail = questions.find(qd => qd.id === q.questionId)
                  return (
                    <div key={q.questionId} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{idx + 1}. {questionDetail?.questionText}</p>
                            <p className="text-xs text-gray-500 mt-1">Type: {questionDetail?.type}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(q.questionId)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <label className="text-sm text-gray-700">Points:</label>
                          <input
                            type="number"
                            value={q.points}
                            onChange={e => handleUpdateQuestionPoints(idx, parseInt(e.target.value))}
                            min="1"
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Question Bank */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Available Questions</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {questions.length === 0 ? (
                  <p className="text-gray-500 text-sm">No questions available. Please create questions first.</p>
                ) : (
                  questions.map(q => (
                    <div key={q.id} className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{q.questionText}</p>
                          <div className="mt-2 flex gap-2">
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {q.type}
                            </span>
                            {q.difficulty && (
                              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                                {q.difficulty}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddQuestion(q.id)}
                          disabled={sectionQuestionIds.has(q.id)}
                          className={`px-3 py-1 rounded text-sm font-medium whitespace-nowrap ${
                            sectionQuestionIds.has(q.id)
                              ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {sectionQuestionIds.has(q.id) ? 'Added' : 'Add'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <button
              type="button"
              onClick={() => navigate('/exams')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : isEditing ? 'Update Exam' : 'Create Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
