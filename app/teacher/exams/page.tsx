"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Trash2, Edit2, Save, X, Archive, ArchiveRestore, ArrowUp, ArrowDown, Search } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"

type QuestionType = "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER" | "LONG_ANSWER"

interface Question {
  id: string
  questionText: string
  questionType: QuestionType
  options: string[]
  correctAnswer: string | null
  marks: number
  order: number
}

interface Exam {
  id: string
  name: string
  subject: string
  className: string
  classId: string
  subjectId: string
  examType: string
  scheduledAt: string
  totalMarks: number
  duration: string | null
  archived?: boolean
}

interface ClassSubject {
  classId: string
  className?: string
  subjectId: string
  subjectName?: string
  subject?: string
}

export default function TeacherExamsPage() {
  const { toast } = useToast()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingExamId, setEditingExamId] = useState<string | null>(null)
  const [examName, setExamName] = useState("")
  const [examSubject, setExamSubject] = useState("")
  const [examClass, setExamClass] = useState("")
  const [examType, setExamType] = useState<"ONLINE" | "PHYSICAL">("ONLINE")
  const [scheduledAt, setScheduledAt] = useState("")
  const [physicalTotalMarks, setPhysicalTotalMarks] = useState("")
  const [duration, setDuration] = useState("")
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [originalQuestionIds, setOriginalQuestionIds] = useState<string[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [submittingExam, setSubmittingExam] = useState(false)
  const [examSearch, setExamSearch] = useState("")
  const [examTypeFilter, setExamTypeFilter] = useState<"ALL" | "ONLINE" | "PHYSICAL">("ALL")

  useEffect(() => {
    fetchClasses()
  }, [])

  useEffect(() => {
    if (editingExamId) {
      fetchQuestions(editingExamId)
    } else {
      setQuestions([])
    }
  }, [editingExamId])

  const fetchExams = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/teacher/exams?includeArchived=${showArchived}`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch exams')
      const data = await response.json()
      setExams(data.exams || [])
      if (data.availableClassSubjects) {
        setClassSubjects(data.availableClassSubjects)
      }
    } catch (err) {
      console.error('Error fetching exams:', err)
      setExams([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExams()
  }, [showArchived])

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/teacher/classes', {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch classes')
      const data = await response.json()
      if (data.classSubjects) {
        setClassSubjects(data.classSubjects)
      }
    } catch (err) {
      console.error('Error fetching classes:', err)
    }
  }

  const fetchQuestions = async (examId: string) => {
    try {
      setLoadingQuestions(true)
      const response = await fetch(`/api/teacher/exams/${examId}/questions`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        const qs = data.questions || []
        setQuestions(qs)
        setOriginalQuestionIds(qs.map((q: Question) => q.id))
      }
    } catch (err) {
      console.error('Error fetching questions:', err)
    } finally {
      setLoadingQuestions(false)
    }
  }

  const handleEdit = (exam: Exam) => {
    setEditingExamId(exam.id)
    setExamName(exam.name)
    setExamSubject(exam.subjectId)
    setExamClass(exam.classId)
    setExamType(exam.examType as "ONLINE" | "PHYSICAL")
    setScheduledAt(new Date(exam.scheduledAt).toISOString().slice(0, 16))
    setPhysicalTotalMarks(exam.examType === "PHYSICAL" ? String(exam.totalMarks || "") : "")
    setDuration(exam.duration || "")
    setShowForm(true)
  }

  const computedTotalMarks = questions.reduce(
    (sum, q) => sum + (Number.isFinite(q.marks) ? q.marks : 0),
    0
  )

  const hasInvalidQuestion = questions.some((q) => {
    if (!q.questionText.trim()) return true
    if (!q.marks || q.marks <= 0) return true
    if (q.questionType === 'MCQ' || q.questionType === 'TRUE_FALSE') {
      if (!q.options || q.options.length < 2) return true
      if (q.options.some((opt) => !opt.trim())) return true
      if (q.correctAnswer === null || q.correctAnswer === undefined || q.correctAnswer === '') return true
    }
    return false
  })

  const isPhysical = examType === 'PHYSICAL'
  const canSubmit = (() => {
    if (!examName || !examSubject || !examClass || !scheduledAt) return false
    if (isPhysical) return (parseInt(physicalTotalMarks) || 0) > 0
    if (questions.length === 0) return false
    if (hasInvalidQuestion) return false
    if (computedTotalMarks <= 0) return false
    return true
  })()

  const handleCancel = () => {
    setShowForm(false)
    setEditingExamId(null)
    resetForm()
  }

  const resetForm = () => {
    setExamName("")
    setExamSubject("")
    setExamClass("")
    setScheduledAt("")
    setPhysicalTotalMarks("")
    setDuration("")
    setExamType("ONLINE")
    setQuestions([])
    setOriginalQuestionIds([])
  }

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: `temp-${Date.now()}`,
        questionText: "",
        questionType: "MCQ",
        options: ["", "", "", ""],
        correctAnswer: null,
        marks: 1,
        order: questions.length,
      },
    ])
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id).map((q, idx) => ({ ...q, order: idx })))
  }

  const moveQuestion = (id: string, direction: 'up' | 'down') => {
    setQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === id)
      if (idx === -1) return prev
      const target = direction === 'up' ? idx - 1 : idx + 1
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next.map((q, i) => ({ ...q, order: i }))
    })
  }

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(
      questions.map((q) =>
        q.id === id ? { ...q, [field]: value } : q
      )
    )
  }

  const updateQuestionOption = (id: string, optionIndex: number, value: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === id
          ? {
              ...q,
              options: q.options.map((opt, i) => (i === optionIndex ? value : opt)),
            }
          : q
      )
    )
  }

  const addOption = (id: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === id ? { ...q, options: [...q.options, ""] } : q
      )
    )
  }

  const removeOption = (id: string, optionIndex: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === id
          ? { ...q, options: q.options.filter((_, i) => i !== optionIndex) }
          : q
      )
    )
  }

  const handleArchive = async (examId: string, archived: boolean) => {
    try {
      const response = await fetch(`/api/teacher/exams/${examId}/archive`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ archived }),
      })

      if (!response.ok) {
        throw new Error('Failed to update archive status')
      }

      fetchExams()
    } catch (err: any) {
      console.error('Error archiving exam:', err)
      toast({ title: 'Error', description: err.message || 'Failed to update archive status', variant: 'destructive' })
    }
  }

  const handleCreateOrUpdate = async () => {
    if (submittingExam) return
    if (!examName || !examSubject || !examClass || !scheduledAt) {
      toast({ title: 'Missing fields', description: 'Please fill in all required fields', variant: 'destructive' })
      return
    }

    if (isPhysical && questions.length > 0) {
      toast({
        title: 'Cannot save',
        description: 'Physical exams cannot contain questions. Remove all questions or change exam type to ONLINE.',
        variant: 'destructive',
      })
      return
    }

    if (isPhysical) {
      if ((parseInt(physicalTotalMarks) || 0) <= 0) {
        toast({ title: 'Missing marks', description: 'Please enter total marks for the physical exam.', variant: 'destructive' })
        return
      }
    } else {
      if (questions.length === 0) {
        toast({ title: 'No questions', description: 'Online exam must have at least one valid question before publishing.', variant: 'destructive' })
        return
      }
      if (hasInvalidQuestion) {
        toast({
          title: 'Invalid questions',
          description: 'Each question needs text, marks > 0, and (for MCQ/True-False) filled options and a correct answer.',
          variant: 'destructive',
        })
        return
      }
      if (computedTotalMarks <= 0) {
        toast({ title: 'Invalid marks', description: 'Total marks must be greater than 0.', variant: 'destructive' })
        return
      }
    }

    const classSubject = classSubjects.find(
      (cs) => cs.classId === examClass && cs.subjectId === examSubject
    )

    if (!classSubject) {
      toast({ title: 'Invalid selection', description: 'Invalid class-subject combination', variant: 'destructive' })
      return
    }

    const finalTotalMarks = isPhysical ? parseInt(physicalTotalMarks) : computedTotalMarks

    try {
      setSubmittingExam(true)
      let examId = editingExamId

      if (!editingExamId) {
        const response = await fetch('/api/teacher/exams', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            title: examName,
            subjectId: examSubject,
            classId: examClass,
            examType,
            scheduledAt,
            totalMarks: finalTotalMarks,
            duration: duration || null,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create exam')
        }

        const newExam = await response.json()
        examId = newExam.id
        setExams([newExam, ...exams])
      } else {
        const response = await fetch(`/api/teacher/exams/${editingExamId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            title: examName,
            subjectId: examSubject,
            classId: examClass,
            examType,
            scheduledAt,
            totalMarks: finalTotalMarks,
            duration: duration || null,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to update exam')
        }
      }

      const questionFailures: string[] = []

      if (examId) {
        const currentIds = new Set(questions.map((q) => q.id))
        const removedIds = originalQuestionIds.filter((id) => !currentIds.has(id))
        for (const removedId of removedIds) {
          const r = await fetch(`/api/teacher/exams/${examId}/questions/${removedId}`, {
            method: 'DELETE',
            credentials: 'include',
          })
          if (!r.ok) {
            const e = await r.json().catch(() => ({}))
            questionFailures.push(`Delete failed: ${e?.error || r.status}`)
          }
        }
      }

      if (examId && questions.length > 0) {
        for (const question of questions) {
          const isNew = question.id.startsWith('temp-')
          const url = isNew
            ? `/api/teacher/exams/${examId}/questions`
            : `/api/teacher/exams/${examId}/questions/${question.id}`
          const method = isNew ? 'POST' : 'PUT'
          const r = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              questionText: question.questionText,
              questionType: question.questionType,
              options: question.questionType === 'MCQ' || question.questionType === 'TRUE_FALSE' ? question.options : null,
              correctAnswer: question.correctAnswer,
              marks: question.marks,
              order: question.order,
            }),
          })
          if (!r.ok) {
            const e = await r.json().catch(() => ({}))
            const label = (question.questionText || '').slice(0, 40) || `Q${question.order + 1}`
            questionFailures.push(`"${label}": ${e?.error || `HTTP ${r.status}`}${e?.details ? ` (${e.details})` : ''}`)
          }
        }
      }

      if (questionFailures.length > 0) {
        toast({
          title: `${questionFailures.length} question(s) failed to save`,
          description: questionFailures.slice(0, 3).join(' | '),
          variant: 'destructive',
        })
      } else {
        toast({
          title: editingExamId ? 'Exam updated' : 'Exam created',
          description: questions.length > 0 ? `${questions.length} question(s) saved` : undefined,
        })
      }

      handleCancel()
      if (editingExamId) {
        fetchExams()
      }
    } catch (err: any) {
      console.error('Error saving exam:', err)
      toast({ title: 'Error', description: err.message || 'Failed to save exam', variant: 'destructive' })
    } finally {
      setSubmittingExam(false)
    }
  }

  const filteredExams = exams.filter((exam) => {
    if (examTypeFilter !== "ALL" && (exam.examType || "ONLINE") !== examTypeFilter) return false
    const q = examSearch.trim().toLowerCase()
    if (!q) return true
    return (
      exam.name.toLowerCase().includes(q) ||
      (exam.subject || "").toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Exam Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage exams with multiple question types.</p>
        </div>
        <Button onClick={() => {
          if (showForm) {
            handleCancel()
          } else {
            setShowForm(true)
            setEditingExamId(null)
            resetForm()
          }
        }}>
          {showForm ? "Cancel" : "Create Exam"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editingExamId ? "Edit Exam" : "Create New Exam"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="examName">Exam Name *</Label>
                <Input
                  id="examName"
                  placeholder="e.g., Midterm Exam"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="examType">Exam Type *</Label>
                <Select
                  value={examType}
                  onValueChange={(v) => {
                    if (v === 'PHYSICAL' && questions.length > 0) {
                      toast({
                        title: 'Cannot switch',
                        description: 'Delete all questions before switching to PHYSICAL.',
                        variant: 'destructive',
                      })
                      return
                    }
                    setExamType(v as "ONLINE" | "PHYSICAL")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ONLINE">Online</SelectItem>
                    <SelectItem value="PHYSICAL" disabled={questions.length > 0}>
                      Physical{questions.length > 0 ? ' (delete questions first)' : ''}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="examClass">Class *</Label>
                <Select value={examClass} onValueChange={(value) => {
                  setExamClass(value)
                  setExamSubject("")
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set(classSubjects.map((cs) => cs.classId))).map((classId) => {
                      const cs = classSubjects.find((c) => c.classId === classId)
                      return (
                        <SelectItem key={classId} value={classId}>
                          {cs?.className || classId}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="examSubject">Subject *</Label>
                <Select 
                  value={examSubject} 
                  onValueChange={setExamSubject}
                  disabled={!examClass}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {classSubjects
                      .filter((cs) => cs.classId === examClass)
                      .map((cs) => (
                        <SelectItem key={cs.subjectId} value={cs.subjectId}>
                          {cs.subjectName || cs.subject}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Scheduled Date & Time *</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalMarks">Total Marks (auto)</Label>
                <Input
                  id="totalMarks"
                  type="number"
                  min="1"
                  value={isPhysical ? physicalTotalMarks : computedTotalMarks}
                  onChange={(e) => setPhysicalTotalMarks(e.target.value)}
                  readOnly={!isPhysical}
                  disabled={!isPhysical}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  {isPhysical
                    ? 'Used as the maximum score when grading the in-person exam.'
                    : 'Calculated from sum of question marks.'}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (optional)</Label>
                <Input
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 2 hours"
                />
              </div>
            </div>

            {isPhysical ? (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Physical exam: students will not take this exam online. Questions cannot be added.
                Use the grading screen to record marks once the physical exam is conducted.
              </div>
            ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Questions ({questions.length})</Label>
                {questions.length === 0 && (
                  <Button variant="outline" size="sm" onClick={addQuestion}>
                    <Plus className="h-4 w-4 mr-1" /> Add First Question
                  </Button>
                )}
              </div>

              {loadingQuestions ? (
                <p className="text-center py-4 text-muted-foreground">Loading questions...</p>
              ) : (
                questions.map((q, index) => (
                  <div key={`${q.id}-${q.questionType}`} className="space-y-3">
                    <Card className="bg-muted/30">
                      <CardContent className="pt-4 space-y-4">
                        <div className="flex items-start gap-4">
                          <span className="text-sm font-medium text-muted-foreground mt-2">
                            Q{index + 1}
                          </span>
                          <div className="flex-1 space-y-3">
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Question Type</Label>
                                <Select
                                  key={`${q.id}-select`}
                                  value={q.questionType}
                                  onValueChange={(value) => {
                                    const newType = value as QuestionType
                                    setQuestions(prevQuestions => 
                                      prevQuestions.map(question => {
                                        if (question.id === q.id) {
                                          if (newType === 'TRUE_FALSE') {
                                            return { ...question, questionType: newType, options: ['True', 'False'], correctAnswer: null }
                                          } else if (newType === 'MCQ') {
                                            return { ...question, questionType: newType, options: ['', '', '', ''], correctAnswer: null }
                                          } else {
                                            return { ...question, questionType: newType, options: [], correctAnswer: null }
                                          }
                                        }
                                        return question
                                      })
                                    )
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="MCQ">Multiple Choice</SelectItem>
                                    <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                                    <SelectItem value="SHORT_ANSWER">Short Answer</SelectItem>
                                    <SelectItem value="LONG_ANSWER">Long Answer</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Marks</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={q.marks}
                                  onChange={(e) => updateQuestion(q.id, 'marks', parseInt(e.target.value) || 1)}
                                />
                              </div>
                            </div>

                            <Textarea
                              placeholder="Enter question text"
                              value={q.questionText}
                              onChange={(e) => updateQuestion(q.id, 'questionText', e.target.value)}
                              rows={2}
                            />

                            {(q.questionType === 'MCQ' || q.questionType === 'TRUE_FALSE') && (
                              <div className="space-y-3">
                                <Label>Options (Select correct answer)</Label>
                                <RadioGroup
                                  value={q.correctAnswer || ""}
                                  onValueChange={(value) => updateQuestion(q.id, 'correctAnswer', value)}
                                >
                                  {q.options.map((opt, optIndex) => (
                                    <div key={optIndex} className="flex items-center gap-2">
                                      <RadioGroupItem value={String(optIndex)} id={`${q.id}-opt-${optIndex}`} />
                                      <Label htmlFor={`${q.id}-opt-${optIndex}`} className="flex-1 cursor-pointer">
                                        <Input
                                          placeholder={`Option ${optIndex + 1}`}
                                          value={opt}
                                          onChange={(e) => updateQuestionOption(q.id, optIndex, e.target.value)}
                                        />
                                      </Label>
                                      {q.questionType === 'MCQ' && q.options.length > 2 && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => {
                                            removeOption(q.id, optIndex)
                                            if (q.correctAnswer === String(optIndex)) {
                                              updateQuestion(q.id, 'correctAnswer', null)
                                            }
                                          }}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </RadioGroup>
                                {q.questionType === 'MCQ' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addOption(q.id)}
                                  >
                                    <Plus className="h-4 w-4 mr-1" /> Add Option
                                  </Button>
                                )}
                              </div>
                            )}

                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => moveQuestion(q.id, 'up')}
                              disabled={index === 0}
                              title="Move up"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => moveQuestion(q.id, 'down')}
                              disabled={index === questions.length - 1}
                              title="Move down"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeQuestion(q.id)}
                              title="Delete question"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addQuestion}
                        className="w-full sm:w-auto"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Question Below
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            )}

            <Button onClick={handleCreateOrUpdate} disabled={!canSubmit || submittingExam}>
              {submittingExam
                ? (editingExamId ? "Updating..." : "Creating...")
                : (editingExamId ? "Update Exam" : "Create Exam")}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">All Exams</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="showArchived" className="text-sm font-normal cursor-pointer">
                Show Archived
              </Label>
              <input
                id="showArchived"
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="cursor-pointer"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={examSearch}
                onChange={(e) => setExamSearch(e.target.value)}
                placeholder="Search by exam name or subject..."
                className="pl-8"
              />
            </div>
            <Select value={examTypeFilter} onValueChange={(v) => setExamTypeFilter(v as "ALL" | "ONLINE" | "PHYSICAL")}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="ONLINE">Online</SelectItem>
                <SelectItem value="PHYSICAL">Physical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="text-center">Type</TableHead>
                <TableHead className="text-center">Total Marks</TableHead>
                <TableHead className="text-right">Scheduled Date</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredExams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                    {exams.length === 0
                      ? "No exams found. Create one to get started."
                      : "No exams match your search or filter."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredExams.map((exam) => (
                  <TableRow key={exam.id} className={exam.archived ? "opacity-60" : ""}>
                    <TableCell className="font-medium">{exam.name}</TableCell>
                    <TableCell>{exam.subject}</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          exam.examType === "ONLINE"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {exam.examType || "ONLINE"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">{exam.totalMarks}</TableCell>
                    <TableCell className="text-right">
                      {new Date(exam.scheduledAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      {exam.archived ? (
                        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800">
                          Archived
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(exam)}
                          disabled={exam.archived}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchive(exam.id, !exam.archived)}
                        >
                          {exam.archived ? (
                            <>
                              <ArchiveRestore className="h-4 w-4 mr-1" />
                              Unarchive
                            </>
                          ) : (
                            <>
                              <Archive className="h-4 w-4 mr-1" />
                              Archive
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
