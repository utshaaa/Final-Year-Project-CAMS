"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { studentSubmissions as initialSubmissions } from "@/lib/mock-data"

interface Submission {
  id: number
  studentName: string
  exam: string
  marks: number | null
  maxMarks: number
}

export default function TeacherGradesPage() {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions)
  const [saved, setSaved] = useState(false)

  const updateMarks = (id: number, marks: string) => {
    const numMarks = marks === "" ? null : Number(marks)
    setSubmissions(
      submissions.map((sub) =>
        sub.id === id ? { ...sub, marks: numMarks } : sub
      )
    )
    setSaved(false)
  }

  const handleSave = () => {
    setSaved(true)
  }

  const gradedCount = submissions.filter((s) => s.marks !== null).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Grade Students</h1>
        <p className="text-muted-foreground mt-1">View submissions and enter marks.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Student Submissions ({gradedCount}/{submissions.length} graded)
          </CardTitle>
          <div className="flex items-center gap-4">
            {saved && (
              <p className="text-sm text-green-600">Grades saved!</p>
            )}
            <Button onClick={handleSave}>Save All</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead className="text-center">Max Marks</TableHead>
                <TableHead className="text-center">Marks Obtained</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">{submission.studentName}</TableCell>
                  <TableCell>{submission.exam}</TableCell>
                  <TableCell className="text-center">{submission.maxMarks}</TableCell>
                  <TableCell className="text-center">
                    <Input
                      type="number"
                      min="0"
                      max={submission.maxMarks}
                      value={submission.marks ?? ""}
                      onChange={(e) => updateMarks(submission.id, e.target.value)}
                      className="w-20 mx-auto text-center"
                      placeholder="-"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        submission.marks !== null
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {submission.marks !== null ? "Graded" : "Pending"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
