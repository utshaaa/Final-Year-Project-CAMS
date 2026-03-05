"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Plus, Trash2 } from "lucide-react"
import { subjects, teacherExams as initialExams } from "@/lib/mock-data"

interface Question {
  id: number
  question: string
  options: string[]
}

interface Exam {
  id: number
  name: string
  subject: string
  questions: number
  date: string
}

export default function TeacherExamsPage() {
  const [exams, setExams] = useState<Exam[]>(initialExams)
  const [showForm, setShowForm] = useState(false)
  const [examName, setExamName] = useState("")
  const [examSubject, setExamSubject] = useState("")
  const [questions, setQuestions] = useState<Question[]>([
    { id: 1, question: "", options: ["", "", "", ""] },
  ])

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { id: Date.now(), question: "", options: ["", "", "", ""] },
    ])
  }

  const removeQuestion = (id: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.id !== id))
    }
  }

  const updateQuestion = (id: number, text: string) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, question: text } : q))
    )
  }

  const updateOption = (questionId: number, optionIndex: number, text: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt, i) =>
                i === optionIndex ? text : opt
              ),
            }
          : q
      )
    )
  }

  const handleCreate = () => {
    if (examName && examSubject && questions.length > 0) {
      const newExam: Exam = {
        id: Date.now(),
        name: examName,
        subject: examSubject,
        questions: questions.length,
        date: new Date().toISOString().split("T")[0],
      }
      setExams([...exams, newExam])
      setExamName("")
      setExamSubject("")
      setQuestions([{ id: 1, question: "", options: ["", "", "", ""] }])
      setShowForm(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Exam Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage MCQ exams.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Create Exam"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create New Exam</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="examName">Exam Name</Label>
                <Input
                  id="examName"
                  placeholder="e.g., Midterm Exam"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="examSubject">Subject</Label>
                <Select value={examSubject} onValueChange={setExamSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Questions</Label>
                <Button variant="outline" size="sm" onClick={addQuestion}>
                  <Plus className="h-4 w-4 mr-1" /> Add Question
                </Button>
              </div>

              {questions.map((q, index) => (
                <Card key={q.id} className="bg-muted/30">
                  <CardContent className="pt-4 space-y-4">
                    <div className="flex items-start gap-4">
                      <span className="text-sm font-medium text-muted-foreground mt-2">
                        Q{index + 1}
                      </span>
                      <div className="flex-1 space-y-3">
                        <Input
                          placeholder="Enter question"
                          value={q.question}
                          onChange={(e) => updateQuestion(q.id, e.target.value)}
                        />
                        <div className="grid gap-2 sm:grid-cols-2">
                          {q.options.map((opt, optIndex) => (
                            <Input
                              key={optIndex}
                              placeholder={`Option ${optIndex + 1}`}
                              value={opt}
                              onChange={(e) =>
                                updateOption(q.id, optIndex, e.target.value)
                              }
                            />
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuestion(q.id)}
                        disabled={questions.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button onClick={handleCreate}>Create Exam</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Exams</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="text-center">Questions</TableHead>
                <TableHead className="text-right">Date Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">{exam.name}</TableCell>
                  <TableCell>{exam.subject}</TableCell>
                  <TableCell className="text-center">{exam.questions}</TableCell>
                  <TableCell className="text-right">{exam.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
