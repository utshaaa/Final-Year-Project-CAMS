"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CalendarEventItem {
  id: string
  title: string
  type: string
  description?: string
  startAt: string
  endAt?: string | null
}

interface DashboardData {
  averageAttendance: number
  hasAttendanceRecords: boolean
  upcomingExams: number
  latestGrade: { subject: string; exam: string; grade: string } | null
  attendance: Array<{ subject: string; totalClasses: number; attended: number; percentage: number }>
  grades: Array<{ subject: string; exam: string; marks: number; grade: string; examType: string }>
  events: CalendarEventItem[]
}

interface MonthGroup {
  key: string
  label: string
  year: number
  month: number
  events: CalendarEventItem[]
}

function groupEventsByMonth(events: CalendarEventItem[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>()

  for (const ev of events) {
    const d = new Date(ev.startAt)
    if (isNaN(d.getTime())) continue
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: `Events in ${d.toLocaleDateString('en-US', { month: 'long' })} ${d.getFullYear()}`,
        year: d.getFullYear(),
        month: d.getMonth(),
        events: [],
      })
    }
    groups.get(key)!.events.push(ev)
  }

  const now = new Date()
  const curY = now.getFullYear()
  const curM = now.getMonth()
  const isUpcoming = (g: MonthGroup) => g.year > curY || (g.year === curY && g.month >= curM)

  const all = Array.from(groups.values())
  all.forEach((g) =>
    g.events.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
  )

  // Future/current months first (ascending), then past months (most recent first)
  const upcoming = all
    .filter(isUpcoming)
    .sort((a, b) => a.year - b.year || a.month - b.month)
  const past = all
    .filter((g) => !isUpcoming(g))
    .sort((a, b) => b.year - a.year || b.month - a.month)

  return [...upcoming, ...past]
}

export function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/student', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`)
        }
        return res.json()
      })
      .then((data) => {
        setData({
          averageAttendance: data.averageAttendance || 0,
          hasAttendanceRecords: data.hasAttendanceRecords !== false,
          upcomingExams: data.upcomingExams || 0,
          latestGrade: data.latestGrade || null,
          attendance: Array.isArray(data.attendance) ? data.attendance : [],
          grades: Array.isArray(data.grades) ? data.grades : [],
          events: Array.isArray(data.events) ? data.events : [],
        })
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching dashboard data:', err)
        setData({
          averageAttendance: 0,
          hasAttendanceRecords: false,
          upcomingExams: 0,
          latestGrade: null,
          attendance: [],
          grades: [],
          events: [],
        })
        setLoading(false)
      })
  }, [])

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Student Dashboard</h1>
          <p className="text-muted-foreground mt-1">Loading...</p>
        </div>
      </div>
    )
  }

  const { averageAttendance, hasAttendanceRecords, upcomingExams, latestGrade } = data

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
            <p className="text-sm text-muted-foreground mt-1">
              {hasAttendanceRecords ? "Average across all subjects" : "No attendance marked yet"}
            </p>
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
            {latestGrade ? (
              <>
            <div className="text-3xl font-bold text-foreground">{latestGrade.grade}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {latestGrade.subject} - {latestGrade.exam}
            </p>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold text-foreground">-</div>
                <p className="text-sm text-muted-foreground mt-1">No grades yet</p>
              </>
            )}
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
              {data.grades && data.grades.length > 0 ? (
                data.grades.slice(0, 4).map((grade, index) => (
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
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No grades available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {data.events && data.events.length > 0 && (
        <div className="space-y-4">
          {groupEventsByMonth(data.events).map((group) => (
            <Card key={group.key}>
              <CardHeader>
                <CardTitle className="text-base">{group.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {group.events.map((event) => {
                    const start = new Date(event.startAt)
                    const isPast = start.getTime() < Date.now()
                    return (
                      <div
                        key={event.id}
                        className={`flex items-start gap-3 py-2 border-b border-border last:border-0 ${isPast ? "opacity-60" : ""}`}
                      >
                        <div className="px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground capitalize flex-shrink-0">
                          {event.type}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {start.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            {' '}
                            {start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            {isPast && <span className="ml-2">(past)</span>}
                          </p>
                          {event.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
