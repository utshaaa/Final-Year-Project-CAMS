"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { studentAttendance, studentGrades, availableExams } from "@/lib/mock-data"

export function StudentDashboard() {
  const averageAttendance = Math.round(
    studentAttendance.reduce((acc, curr) => acc + curr.percentage, 0) / studentAttendance.length
  )
  const upcomingExams = availableExams.length
  const latestGrade = studentGrades[studentGrades.length - 1]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Student Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here{"'"}s your academic overview.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{averageAttendance}%</div>
            <p className="text-sm text-muted-foreground mt-1">Average across all subjects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{upcomingExams}</div>
            <p className="text-sm text-muted-foreground mt-1">Exams scheduled this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Latest Grade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{latestGrade.grade}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {latestGrade.subject} - {latestGrade.exam}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/attendance"
              className="block p-3 rounded-md bg-muted hover:bg-muted/80 transition-colors text-sm"
            >
              View Attendance Details
            </Link>
            <Link
              href="/exams"
              className="block p-3 rounded-md bg-muted hover:bg-muted/80 transition-colors text-sm"
            >
              Take Available Exams
            </Link>
            <Link
              href="/grades"
              className="block p-3 rounded-md bg-muted hover:bg-muted/80 transition-colors text-sm"
            >
              Check All Grades
            </Link>
            <Link
              href="/calendar"
              className="block p-3 rounded-md bg-muted hover:bg-muted/80 transition-colors text-sm"
            >
              Academic Calendar
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Grades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {studentGrades.slice(0, 4).map((grade, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{grade.subject}</p>
                    <p className="text-xs text-muted-foreground">{grade.exam}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{grade.grade}</p>
                    <p className="text-xs text-muted-foreground">{grade.marks} marks</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
