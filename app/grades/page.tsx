"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type ExamType = "ONLINE" | "PHYSICAL" | "ALL"

interface Grade {
  subject: string
  exam: string
  marks: number
  grade: string
  examType: string
}

interface GradesData {
  grades: Grade[]
  subjects: string[]
  counts: {
    online: number
    physical: number
    total: number
  }
}

export default function GradesPage() {
  const [filterType, setFilterType] = useState<ExamType>("ALL")
  const [filterSubject, setFilterSubject] = useState<string>("ALL")
  const [data, setData] = useState<GradesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (filterType !== "ALL") {
          params.append("examType", filterType)
        }
        if (filterSubject !== "ALL") {
          params.append("subject", filterSubject)
        }

        const response = await fetch(`/api/grades?${params.toString()}`, {
          credentials: 'include',
        })
        if (!response.ok) {
          throw new Error("Failed to fetch grades")
        }
        const result = await response.json()
        setData(result)
        setError(null)
      } catch (err) {
        console.error("Error fetching grades:", err)
        setError("Failed to load grades")
        setData({
          grades: [],
          subjects: [],
          counts: {
            online: 0,
            physical: 0,
            total: 0,
          },
        })
      } finally {
        setLoading(false)
      }
    }

    fetchGrades()
  }, [filterType, filterSubject])

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Grades</h1>
          <p className="text-muted-foreground mt-1">Loading...</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const filteredGrades = data?.grades || []
  const onlineCount = data?.counts.online || 0
  const physicalCount = data?.counts.physical || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Grades</h1>
        <p className="text-muted-foreground mt-1">View your academic performance.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">
              All Grades ({onlineCount} Online, {physicalCount} Physical)
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="subjectFilter">Subject:</Label>
                <Select
                  value={filterSubject}
                  onValueChange={setFilterSubject}
                >
                  <SelectTrigger className="w-40" id="subjectFilter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Subjects</SelectItem>
                    {data?.subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="typeFilter">Type:</Label>
                <Select
                  value={filterType}
                  onValueChange={(value) => setFilterType(value as ExamType)}
                >
                  <SelectTrigger className="w-40" id="typeFilter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="ONLINE">Online Only</SelectItem>
                    <SelectItem value="PHYSICAL">Physical Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead className="text-center">Type</TableHead>
                <TableHead className="text-center">Marks</TableHead>
                <TableHead className="text-right">Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {error && !data ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                    {error}
                  </TableCell>
                </TableRow>
              ) : filteredGrades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                    No grades found for the selected filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredGrades.map((grade, index) => (
                  <TableRow key={`${grade.subject}-${grade.exam}-${index}`}>
                  <TableCell className="font-medium">{grade.subject}</TableCell>
                  <TableCell>{grade.exam}</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          grade.examType === "ONLINE"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {grade.examType}
                      </span>
                    </TableCell>
                  <TableCell className="text-center">{grade.marks}</TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-sm font-medium">
                      {grade.grade}
                    </span>
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
