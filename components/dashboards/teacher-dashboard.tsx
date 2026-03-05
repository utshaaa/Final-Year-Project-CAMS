"use client"

<<<<<<< HEAD
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DashboardData {
  totalStudents: number
  activeExams: number
  pendingGrades: number
  exams: Array<{ id: string; name: string; subject: string; questions: number; date: string }>
}

export function TeacherDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/teacher')
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching dashboard data:', err)
        setData({
          totalStudents: 0,
          activeExams: 0,
          pendingGrades: 0,
          exams: [],
        })
        setLoading(false)
      })
  }, [])

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Teacher Dashboard</h1>
          <p className="text-muted-foreground mt-1">Loading...</p>
        </div>
      </div>
    )
  }

  const { totalStudents, activeExams, pendingGrades, exams } = data
=======
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { classStudents, teacherExams } from "@/lib/mock-data"

export function TeacherDashboard() {
>>>>>>> 8ca0a2cfda5c941d1985d3709ed67e26c069ad8d
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Teacher Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage your classes and students.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
<<<<<<< HEAD
            <div className="text-3xl font-bold text-foreground">{totalStudents}</div>
=======
            <div className="text-3xl font-bold text-foreground">{classStudents.length}</div>
>>>>>>> 8ca0a2cfda5c941d1985d3709ed67e26c069ad8d
            <p className="text-sm text-muted-foreground mt-1">In your current class</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
<<<<<<< HEAD
            <div className="text-3xl font-bold text-foreground">{activeExams}</div>
=======
            <div className="text-3xl font-bold text-foreground">{teacherExams.length}</div>
>>>>>>> 8ca0a2cfda5c941d1985d3709ed67e26c069ad8d
            <p className="text-sm text-muted-foreground mt-1">Exams created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Grades
            </CardTitle>
          </CardHeader>
          <CardContent>
<<<<<<< HEAD
            <div className="text-3xl font-bold text-foreground">{pendingGrades}</div>
=======
            <div className="text-3xl font-bold text-foreground">5</div>
>>>>>>> 8ca0a2cfda5c941d1985d3709ed67e26c069ad8d
            <p className="text-sm text-muted-foreground mt-1">Submissions to grade</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/teacher/attendance"
            className="p-4 rounded-md bg-muted hover:bg-muted/80 transition-colors text-center"
          >
            <p className="font-medium text-foreground">Mark Attendance</p>
            <p className="text-xs text-muted-foreground mt-1">Record daily attendance</p>
          </Link>
          <Link
            href="/teacher/exams"
            className="p-4 rounded-md bg-muted hover:bg-muted/80 transition-colors text-center"
          >
            <p className="font-medium text-foreground">Create Exam</p>
            <p className="text-xs text-muted-foreground mt-1">Add new MCQ exam</p>
          </Link>
          <Link
            href="/teacher/grades"
            className="p-4 rounded-md bg-muted hover:bg-muted/80 transition-colors text-center"
          >
            <p className="font-medium text-foreground">Grade Students</p>
            <p className="text-xs text-muted-foreground mt-1">Enter marks manually</p>
          </Link>
          <Link
            href="/chat"
            className="p-4 rounded-md bg-muted hover:bg-muted/80 transition-colors text-center"
          >
            <p className="font-medium text-foreground">Messages</p>
            <p className="text-xs text-muted-foreground mt-1">Chat with students</p>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Exams</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
<<<<<<< HEAD
              {exams.map((exam) => (
=======
            {teacherExams.map((exam) => (
>>>>>>> 8ca0a2cfda5c941d1985d3709ed67e26c069ad8d
              <div key={exam.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{exam.name}</p>
                  <p className="text-xs text-muted-foreground">{exam.subject}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-foreground">{exam.questions} questions</p>
                  <p className="text-xs text-muted-foreground">{exam.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
