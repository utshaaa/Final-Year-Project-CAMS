"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

type ExamType = "ONLINE" | "PHYSICAL"

interface SubmissionAnswer {
  questionId: string
  questionText: string
  questionType: string
  questionMarks: number
  answerText: string
  marksObtained: number | null
  isCorrect: boolean | null
}

interface Submission {
  id: string | number
  studentId: string
  studentName: string
  exam: string
  examId: string
  marks: number | null
  maxMarks: number
  examType: ExamType
  gradeLetter?: string | null
  remarks?: string | null
  answers?: SubmissionAnswer[]
  submitted?: boolean
}

interface ClassSubject {
  classId: string
  class: string
  subjectId: string
  subject: string
}

interface Exam {
  id: string
  title: string
  subject: string
  class: string
  examType: ExamType
  totalMarks: number
  scheduledAt?: string
}

export default function TeacherGradesPage() {
  const { toast } = useToast()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedExam, setSelectedExam] = useState("")
  
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([])
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([])
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [currentExam, setCurrentExam] = useState<Exam | null>(null)
  
  const [gradeInputs, setGradeInputs] = useState<Record<string, {
    marks: string
    gradeLetter: string
    remarks: string
    questionMarks?: Record<string, string>
  }>>({})
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)

  useEffect(() => {
    fetchClasses()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      fetchExams()
    }
  }, [selectedClass, selectedSubject])

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/teacher/classes', {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch classes')
      const data = await response.json()
      setClasses(data.classes)
      setSubjects(data.subjects)
      setClassSubjects(data.classSubjects)
    } catch (err) {
      console.error('Error fetching classes:', err)
    }
  }

  const fetchExams = async () => {
    try {
      const response = await fetch('/api/teacher/exams', {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch exams')
      const data = await response.json()
      
      let filtered = data.exams || data
      if (selectedSubject) {
        const subjectName = subjects.find((s) => s.id === selectedSubject)?.name
        filtered = filtered.filter((e: any) => e.subject === subjectName)
      }

      const normalized = filtered.map((e: any) => ({
        id: e.id,
        title: e.title || e.name,
        subject: e.subject,
        class: e.class || e.className || '',
        examType: e.examType,
        totalMarks: e.totalMarks,
        scheduledAt: e.scheduledAt,
      }))

      setExams(normalized)
    } catch (err) {
      console.error('Error fetching exams:', err)
    }
  }

  const handleExamSelect = async () => {
    if (!selectedExam) {
      setSubmissions([])
      setCurrentExam(null)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/teacher/exams/${selectedExam}/submissions`, {
        credentials: 'include',
      })
      if (!response.ok) {
        let msg = 'Failed to fetch submissions'
        try {
          const err = await response.json()
          if (err?.error) msg = err.error
          if (err?.details) msg += ` (${err.details})`
        } catch {}
        throw new Error(msg)
      }
      const data = await response.json()
      setCurrentExam(data.exam)
      
      const formattedSubmissions = data.submissions.map((sub: any) => ({
        id: sub.grade?.id || `pending-${sub.studentId}`,
        studentId: sub.studentId,
        studentName: sub.studentName,
        exam: data.exam.title,
        examId: data.exam.id,
        marks: sub.grade?.marksObtained || null,
        maxMarks: data.exam.totalMarks,
        examType: data.exam.examType,
        gradeLetter: sub.grade?.gradeLetter || null,
        remarks: sub.grade?.remarks || null,
        answers: sub.answers || [],
        submitted: sub.submitted,
      }))
      
      setSubmissions(formattedSubmissions)
      
      const inputs: Record<string, { marks: string; gradeLetter: string; remarks: string; questionMarks: Record<string, string> }> = {}
      formattedSubmissions.forEach((sub: any) => {
        const questionMarks: Record<string, string> = {}
        if (sub.answers) {
          sub.answers.forEach((answer: any) => {
            questionMarks[answer.questionId] = answer.marksObtained?.toString() || ""
          })
        }
        inputs[sub.studentId] = {
          marks: sub.marks?.toString() || "",
          gradeLetter: sub.gradeLetter || "",
          remarks: sub.remarks || "",
          questionMarks,
        }
      })
      setGradeInputs(inputs)
    } catch (err: any) {
      console.error('Error fetching submissions:', err)
      toast({ title: 'Error', description: err?.message || 'Failed to fetch submissions', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    handleExamSelect()
  }, [selectedExam])

  const updateGradeInput = (studentId: string, field: 'marks' | 'gradeLetter' | 'remarks', value: string) => {
    setGradeInputs((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId] || { marks: "", gradeLetter: "", remarks: "", questionMarks: {} },
        [field]: value,
      },
    }))
    setSaved(false)
  }

  const updateQuestionMark = (studentId: string, questionId: string, marks: string) => {
    setGradeInputs((prev) => {
      const current = prev[studentId] || { marks: "", gradeLetter: "", remarks: "", questionMarks: {} }
      const nextQuestionMarks = {
        ...current.questionMarks,
        [questionId]: marks,
      }
      const total = Object.values(nextQuestionMarks).reduce((sum, m) => sum + (parseInt(m) || 0), 0)
      return {
        ...prev,
        [studentId]: {
          ...current,
          questionMarks: nextQuestionMarks,
          marks: String(total),
        },
      }
    })
    setSaved(false)
  }

  const calculateTotalMarks = (studentId: string): number => {
    const input = gradeInputs[studentId]
    if (!input || !input.questionMarks) return 0
    return Object.values(input.questionMarks).reduce((sum, marks) => {
      const m = parseInt(marks) || 0
      return sum + m
    }, 0)
  }

  const handleSave = async () => {
    if (!selectedExam || !currentExam) {
      toast({ title: 'No exam selected', description: 'Please select an exam first', variant: 'destructive' })
      return
    }

    try {
      const gradesToSave = submissions
        .filter((sub) => {
          const input = gradeInputs[sub.studentId]
          if (!input) return false
          const hasMarks = input.marks !== '' && input.marks !== null && input.marks !== undefined
          return hasMarks || !!input.gradeLetter || !!input.remarks
        })
        .map((sub) => {
          const input = gradeInputs[sub.studentId]
          return {
            studentId: sub.studentId,
            examId: sub.examId,
            marksObtained: input.marks ? parseInt(input.marks) : null,
            gradeLetter: input.gradeLetter || null,
            remarks: input.remarks || null,
          }
        })

      if (gradesToSave.length === 0) {
        toast({
          title: 'Nothing to save',
          description: 'Enter marks, grade letter, or remarks for at least one student.',
          variant: 'destructive',
        })
        return
      }

      const response = await fetch('/api/teacher/grades', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ grades: gradesToSave }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        const failures = Array.isArray(payload?.results)
          ? payload.results.filter((r: any) => !r.success)
          : []
        if (failures.length > 0) {
          const studentNameById = new Map(submissions.map((s) => [s.studentId, s.studentName]))
          for (const f of failures) {
            toast({
              title: `Failed: ${studentNameById.get(f.studentId) || f.studentId}`,
              description: f.error || 'Save failed',
              variant: 'destructive',
            })
          }
        }
        throw new Error(payload?.error || 'Failed to save grades')
      }

      const failedCount = payload?.failedCount || 0
      const savedCount = payload?.savedCount ?? gradesToSave.length
      if (failedCount > 0 && Array.isArray(payload?.results)) {
        const studentNameById = new Map(submissions.map((s) => [s.studentId, s.studentName]))
        for (const r of payload.results) {
          if (!r.success) {
            toast({
              title: `Failed: ${studentNameById.get(r.studentId) || r.studentId}`,
              description: r.error || 'Save failed',
              variant: 'destructive',
            })
          }
        }
      }

      toast({
        title: 'Grades saved',
        description: `${savedCount} saved${failedCount ? `, ${failedCount} failed` : ''}`,
      })
      setSaved(true)
      handleExamSelect()
    } catch (err: any) {
      console.error('Error saving grades:', err)
      toast({ title: 'Error', description: err.message || 'Failed to save grades', variant: 'destructive' })
    }
  }

  const gradedCount = submissions.filter((s) => {
    const input = gradeInputs[s.studentId]
    return input && input.marks && parseInt(input.marks) >= 0
  }).length
  const filteredSubmissions = submissions

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Grade Students</h1>
        <p className="text-muted-foreground mt-1">View submissions and enter marks.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Exam to Grade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="classSelect">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger id="classSelect">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subjectSelect">Subject</Label>
              <Select 
                value={selectedSubject} 
                onValueChange={setSelectedSubject}
                disabled={!selectedClass}
              >
                <SelectTrigger id="subjectSelect">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {classSubjects
                    .filter((cs) => cs.classId === selectedClass)
                    .map((cs) => {
                      const subject = subjects.find((s) => s.id === cs.subjectId)
                      return (
                        <SelectItem key={cs.subjectId} value={cs.subjectId}>
                          {subject?.name || cs.subject}
                        </SelectItem>
                      )
                    })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="examSelect">Exam</Label>
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger id="examSelect">
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams
                    .filter((exam) => {
                      if (selectedSubject) {
                        const subjectName = subjects.find((s) => s.id === selectedSubject)?.name
                        return exam.subject === subjectName
                      }
                      return true
                    })
                    .map((exam) => {
                      const datePart = exam.scheduledAt
                        ? new Date(exam.scheduledAt).toLocaleDateString()
                        : ''
                      const classPart = exam.class ? ` - ${exam.class}` : ''
                      const typePart = exam.examType ? ` - ${exam.examType}` : ''
                      const datePartLabel = datePart ? ` - ${datePart}` : ''
                      return (
                        <SelectItem key={exam.id} value={exam.id}>
                          {(exam.title || 'Untitled exam')}{classPart}{typePart}{datePartLabel}
                        </SelectItem>
                      )
                    })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {currentExam && (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
              {currentExam.title} - {currentExam.class} ({currentExam.examType})
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({gradedCount}/{submissions.length} graded)
              </span>
          </CardTitle>
          <div className="flex items-center gap-4">
            {saved && (
              <p className="text-sm text-green-600">Grades saved!</p>
            )}
            <Button onClick={handleSave}>Save All</Button>
          </div>
        </CardHeader>
        <CardContent>
            {loading ? (
              <p className="text-center py-4 text-muted-foreground">Loading...</p>
            ) : filteredSubmissions.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">
                {selectedExam ? "No students found for this exam." : "Please select an exam to grade."}
              </p>
            ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead className="text-center">Marks Obtained</TableHead>
                <TableHead className="text-center">Grade Letter</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map((submission) => {
                const input = gradeInputs[submission.studentId] || { marks: "", gradeLetter: "", remarks: "", questionMarks: {} }
                const isGraded = input.marks && parseInt(input.marks) >= 0
                const hasAnswers = submission.answers && submission.answers.length > 0
                const isExpanded = expandedStudent === submission.studentId
                return (
                  <React.Fragment key={submission.id}>
                    <TableRow>
                      <TableCell className="font-medium">{submission.studentName}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <Input
                            type="number"
                      min="0"
                      max={submission.maxMarks}
                              value={input.marks}
                              onChange={(e) => updateGradeInput(submission.studentId, 'marks', e.target.value)}
                              className="w-20 text-center"
                      placeholder="-"
                            />
                            <span className="text-xs text-muted-foreground">/ {submission.maxMarks}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            value={input.gradeLetter}
                            onChange={(e) => updateGradeInput(submission.studentId, 'gradeLetter', e.target.value)}
                            className="w-16 text-center"
                            placeholder="A"
                            maxLength={3}
                          />
                        </TableCell>
                        <TableCell>
                          <Textarea
                            value={input.remarks}
                            onChange={(e) => updateGradeInput(submission.studentId, 'remarks', e.target.value)}
                            className="min-h-[60px]"
                            placeholder="Optional remarks"
                            rows={2}
                    />
                  </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hasAnswers && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setExpandedStudent(isExpanded ? null : submission.studentId)}
                            >
                              {isExpanded ? "Hide Answers" : "View Answers"}
                            </Button>
                          )}
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              isGraded
                                ? "bg-green-100 text-green-800"
                                : submission.submitted
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {isGraded ? "Graded" : submission.submitted ? "Pending" : "Not Submitted"}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && hasAnswers && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-muted/30">
                          <div className="space-y-4 py-4">
                            <h4 className="font-semibold text-sm">Student Answers</h4>
                            {submission.answers?.map((answer: SubmissionAnswer, idx: number) => {
                              const questionMark = input.questionMarks?.[answer.questionId] || answer.marksObtained?.toString() || ""
                              const needsGrading = answer.questionType === 'SHORT_ANSWER' || answer.questionType === 'LONG_ANSWER'
                              return (
                                <Card key={answer.questionId} className="bg-background">
                                  <CardContent className="pt-4 space-y-3">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <p className="font-medium text-sm">Q{idx + 1}: {answer.questionText}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Type: {answer.questionType.replace('_', ' ')} | Max Marks: {answer.questionMarks}
                                        </p>
                                      </div>
                                      {needsGrading && (
                                        <div className="flex items-center gap-2">
                                          <Label className="text-xs">Marks:</Label>
                                          <Input
                                            type="number"
                                            min="0"
                                            max={answer.questionMarks}
                                            value={questionMark}
                                            onChange={(e) => updateQuestionMark(submission.studentId, answer.questionId, e.target.value)}
                                            className="w-20 text-center"
                                            placeholder="0"
                                          />
                                          <span className="text-xs text-muted-foreground">/ {answer.questionMarks}</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="bg-muted p-3 rounded-md">
                                      <p className="text-sm font-medium mb-1">Student Answer:</p>
                                      <p className="text-sm whitespace-pre-wrap">{answer.answerText}</p>
                                    </div>
                                    {answer.isCorrect !== null && (
                                      <p className={`text-xs ${answer.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                        {answer.isCorrect ? 'Correct' : 'Incorrect'} 
                                        {answer.marksObtained !== null && ` (${answer.marksObtained}/${answer.questionMarks} marks)`}
                                      </p>
                                    )}
                                  </CardContent>
                                </Card>
                              )
                            })}
                            {input.questionMarks && Object.keys(input.questionMarks).length > 0 && (
                              <div className="pt-2 border-t">
                                <p className="text-sm font-medium">
                                  Calculated Total: {calculateTotalMarks(submission.studentId)} / {submission.maxMarks}
                                </p>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })}
            </TableBody>
          </Table>
            )}
        </CardContent>
      </Card>
      )}
    </div>
  )
}
