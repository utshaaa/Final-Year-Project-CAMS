"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"

interface Exam {
  id: string
  name: string
  subject: string
  duration: string | null
  examType?: string
  scheduledAt?: string
}

interface Question {
  id: string
  question: string
  questionType: string
  options: string[]
  marks: number
}

interface Grade {
  marksObtained: number | null
  totalMarks: number
  gradeLetter: string | null
  remarks: string | null
}

export default function TakeExamPage() {
  const params = useParams()
  const router = useRouter()
  const examId = params.id as string
  const [exam, setExam] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [result, setResult] = useState<{ totalMarks: number; obtainedMarks: number; requiresManualGrading?: boolean } | null>(null)
  const [grade, setGrade] = useState<Grade | null>(null)
  const [physicalOnly, setPhysicalOnly] = useState(false)
  const [notYetAvailable, setNotYetAvailable] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/exams/${examId}`, {
          credentials: 'include',
        })
        if (!response.ok) {
          setExam(null)
          return
        }
        const data = await response.json()
        setExam(data.exam)
        setQuestions(data.questions || [])

        if (data.physicalOnly) {
          setPhysicalOnly(true)
        }

        if (data.notYetAvailable) {
          setNotYetAvailable(true)
        }

        if (data.alreadySubmitted) {
          setAlreadySubmitted(true)
          setSubmitted(true)
          if (data.grade) {
            setGrade(data.grade)
            setResult({
              totalMarks: data.grade.totalMarks,
              obtainedMarks: data.grade.marksObtained || 0,
            })
          }
        }
      } catch (error) {
        console.error('Error fetching exam:', error)
        setExam(null)
      } finally {
        setLoading(false)
      }
    }

    if (examId) {
      fetchExam()
    }
  }, [examId])

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const performSubmit = async () => {
    try {
      setSubmitting(true)
      const response = await fetch(`/api/exams/${examId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ answers }),
      })

      if (!response.ok) {
        let msg = 'Failed to submit exam'
        try {
          const err = await response.json()
          if (err?.error) msg = err.error
        } catch {}
        throw new Error(msg)
      }

      const data = await response.json()
      setResult(data)
      setSubmitted(true)
      if (data.requiresManualGrading) {
        setGrade({
          marksObtained: null,
          totalMarks: data.totalMarks,
          gradeLetter: null,
          remarks: 'Pending manual grading',
        })
      }
    } catch (error: any) {
      console.error('Error submitting exam:', error)
      toast({
        title: 'Submission failed',
        description: error?.message || 'Failed to submit exam. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-semibold text-foreground">Exam not found</h1>
        <Button asChild className="mt-4">
          <Link href="/exams">Back to Exams</Link>
        </Button>
      </div>
    )
  }

  if (notYetAvailable) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <CardContent className="pt-6 space-y-4 text-center">
            <h2 className="text-xl font-semibold">{exam.name}</h2>
            <p className="text-muted-foreground">{exam.subject}</p>
            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              This exam is not yet available.
              {exam.scheduledAt && (
                <p className="mt-2">
                  Starts: {new Date(exam.scheduledAt).toLocaleString()}
                </p>
              )}
              {exam.duration && <p>Duration: {exam.duration}</p>}
            </div>
            <Button asChild>
              <Link href="/exams">Back to Exams</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (physicalOnly) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <CardContent className="pt-6 space-y-4 text-center">
            <h2 className="text-xl font-semibold">{exam.name}</h2>
            <p className="text-muted-foreground">{exam.subject}</p>
            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              This is a physical (in-person) exam. It cannot be taken online.
              {exam.scheduledAt && (
                <p className="mt-2">
                  Scheduled: {new Date(exam.scheduledAt).toLocaleString()}
                </p>
              )}
              {exam.duration && <p>Duration: {exam.duration}</p>}
            </div>
            <Button asChild>
              <Link href="/exams">Back to Exams</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted || alreadySubmitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                {alreadySubmitted ? 'Exam Already Submitted' : 'Exam Submitted Successfully!'}
              </h2>
              {grade && grade.marksObtained !== null ? (
                <div className="space-y-2">
                  <p className="text-lg">
                    <span className="font-semibold">Score:</span> {grade.marksObtained} / {grade.totalMarks}
                  </p>
                  {grade.gradeLetter && (
                    <p className="text-lg">
                      <span className="font-semibold">Grade:</span> {grade.gradeLetter}
                    </p>
                  )}
                  <p className="text-muted-foreground">
                    You scored {Math.round((grade.marksObtained / grade.totalMarks) * 100)}%
                  </p>
                  {grade.remarks && (
                    <p className="text-sm text-muted-foreground">Remarks: {grade.remarks}</p>
                  )}
                </div>
              ) : grade && grade.marksObtained === null ? (
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    Your answers are pending manual grading by the teacher.
                  </p>
                  {grade.remarks && (
                    <p className="text-sm text-muted-foreground">{grade.remarks}</p>
                  )}
                </div>
              ) : result && (
                <div className="space-y-2">
                  <p className="text-lg">
                    <span className="font-semibold">Score:</span> {result.obtainedMarks} / {result.totalMarks}
                  </p>
                  <p className="text-muted-foreground">
                    {result.requiresManualGrading
                      ? 'Your answers have been submitted for manual grading.'
                      : `You scored ${Math.round((result.obtainedMarks / result.totalMarks) * 100)}%`}
                  </p>
                </div>
              )}
              <p className="text-muted-foreground">
                {alreadySubmitted 
                  ? 'You have already submitted this exam and cannot retake it.'
                  : 'Your answers for ' + exam.name + ' have been submitted.'}
              </p>
              <Button asChild>
                <Link href="/exams">Back to Exams</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{exam.name}</h1>
        <p className="text-muted-foreground mt-1">
          {exam.subject} | Duration: {exam.duration || 'N/A'}
        </p>
      </div>

      <div className="space-y-4">
        {questions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No questions available for this exam.</p>
            </CardContent>
          </Card>
        ) : (
          questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  Question {index + 1} ({question.marks} {question.marks === 1 ? 'mark' : 'marks'})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm font-medium">{question.question}</p>
                <p className="text-xs text-muted-foreground">
                  Type: {question.questionType.replace('_', ' ')}
                </p>

                {question.questionType === 'MCQ' && (
                  <RadioGroup
                    value={answers[question.id] || ""}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                  >
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={String(optIndex)}
                          id={`q${question.id}-opt${optIndex}`}
                        />
                        <Label
                          htmlFor={`q${question.id}-opt${optIndex}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {question.questionType === 'TRUE_FALSE' && (
                  <RadioGroup
                    value={answers[question.id] || ""}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                  >
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={String(optIndex)}
                          id={`q${question.id}-opt${optIndex}`}
                        />
                        <Label
                          htmlFor={`q${question.id}-opt${optIndex}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {question.questionType === 'SHORT_ANSWER' && (
                  <Textarea
                    placeholder="Enter your answer"
                    value={answers[question.id] || ""}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    rows={3}
                  />
                )}

                {question.questionType === 'LONG_ANSWER' && (
                  <Textarea
                    placeholder="Enter your detailed answer"
                    value={answers[question.id] || ""}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    rows={6}
                  />
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="flex gap-4">
        <Button variant="outline" asChild>
          <Link href="/exams">Cancel</Link>
        </Button>
        <Button
          onClick={() => setConfirmOpen(true)}
          disabled={submitting || questions.length === 0}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Exam"
          )}
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit exam?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit the exam? You cannot change your answers after submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false)
                performSubmit()
              }}
            >
              Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
