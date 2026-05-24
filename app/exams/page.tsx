"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ChevronDown } from "lucide-react"

interface Exam {
  id: string
  name: string
  subject: string
  date: string
  duration: string
  totalMarks: number
  examType: string
  scheduledAt: string
  submitted?: boolean
  grade?: {
    marksObtained: number | null
    gradeLetter: string | null
    remarks: string | null
  } | null
}

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [showSubmitted, setShowSubmitted] = useState(false)

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/exams', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      setExams(data.exams || [])
    } catch (error) {
      console.error('Error fetching exams:', error)
      setExams([])
    } finally {
      setLoading(false)
    }
  }

  const renderExamCard = (exam: Exam) => (
    <Card key={exam.id}>
      <CardHeader>
        <CardTitle className="text-base">{exam.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subject</span>
            <span className="text-foreground">{exam.subject || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span className="text-foreground">
              {(() => {
                if (!exam.scheduledAt) return '—'
                const d = new Date(exam.scheduledAt)
                if (isNaN(d.getTime())) return '—'
                return d.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              })()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration</span>
            <span className="text-foreground">{exam.duration || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Marks</span>
            <span className="text-foreground">{exam.totalMarks ?? 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type</span>
            <span className="text-foreground capitalize">{(exam.examType || '').toLowerCase() || '—'}</span>
          </div>
        </div>
        {exam.examType === 'PHYSICAL' ? (
          <div className="space-y-2">
            <Button variant="outline" className="w-full" disabled>
              Scheduled (in-person)
            </Button>
            {exam.grade && exam.grade.marksObtained !== null ? (
              <div className="text-center text-sm">
                <p className="font-medium">
                  Score: {exam.grade.marksObtained} / {exam.totalMarks}
                </p>
                {exam.grade.gradeLetter && (
                  <p className="text-muted-foreground">Grade: {exam.grade.gradeLetter}</p>
                )}
              </div>
            ) : exam.grade ? (
              <p className="text-center text-xs text-muted-foreground">Pending grading</p>
            ) : (
              <p className="text-center text-xs text-muted-foreground">
                This is a physical exam. Attend in person on the scheduled date.
              </p>
            )}
          </div>
        ) : exam.submitted ? (
          <div className="space-y-2">
            <Button variant="outline" className="w-full" disabled>
              Already Submitted
            </Button>
            {exam.grade && exam.grade.marksObtained !== null && (
              <div className="text-center text-sm">
                <p className="font-medium">
                  Score: {exam.grade.marksObtained} / {exam.totalMarks}
                </p>
                {exam.grade.gradeLetter && (
                  <p className="text-muted-foreground">Grade: {exam.grade.gradeLetter}</p>
                )}
              </div>
            )}
            {exam.grade && exam.grade.marksObtained === null && (
              <p className="text-center text-sm text-muted-foreground">
                Pending grading
              </p>
            )}
          </div>
        ) : (() => {
          const startsAt = exam.scheduledAt ? new Date(exam.scheduledAt) : null
          const notYet = startsAt && !isNaN(startsAt.getTime()) && startsAt.getTime() > Date.now()
          if (notYet) {
            return (
              <div className="space-y-2">
                <Button variant="outline" className="w-full" disabled>
                  Not Yet Available
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Opens {startsAt!.toLocaleString()}
                </p>
              </div>
            )
          }
          return (
            <Button asChild className="w-full">
              <Link href={`/exams/${exam.id}`}>Take Exam</Link>
            </Button>
          )
        })()}
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Exams</h1>
          <p className="text-muted-foreground mt-1">View and take available exams.</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const submittedExams = exams.filter((e) => e.submitted)
  const pendingExams = exams.filter((e) => !e.submitted)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Exams</h1>
        <p className="text-muted-foreground mt-1">View and take available exams.</p>
      </div>

      {exams.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              No exams available. You may not be enrolled in any classes yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Pending Exams ({pendingExams.length})
            </h2>
            {pendingExams.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No pending exams. You're all caught up!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pendingExams.map((exam) => renderExamCard(exam))}
              </div>
            )}
          </div>

          {submittedExams.length > 0 && (
            <div className="space-y-3">
              <button
                onClick={() => setShowSubmitted((v) => !v)}
                className="flex items-center gap-2 text-lg font-semibold text-foreground hover:text-primary transition-colors"
              >
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${showSubmitted ? "" : "-rotate-90"}`}
                />
                Submitted Exams ({submittedExams.length})
              </button>
              {showSubmitted && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {submittedExams.map((exam) => renderExamCard(exam))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

