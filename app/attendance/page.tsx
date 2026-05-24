"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2 } from "lucide-react"

interface AttendanceRecord {
  subject: string
  totalClasses: number
  attended: number
  percentage: number
}

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [averageAttendance, setAverageAttendance] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAttendance()
  }, [])

  const fetchAttendance = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/attendance', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      setAttendance(data.attendance || [])
      setAverageAttendance(data.averageAttendance || 0)
    } catch (error) {
      console.error('Error fetching attendance:', error)
      setAttendance([])
      setAverageAttendance(0)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Attendance</h1>
          <p className="text-muted-foreground mt-1">View your attendance records by subject.</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Attendance</h1>
        <p className="text-muted-foreground mt-1">View your attendance records by subject.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overall Attendance: {averageAttendance}%</CardTitle>
        </CardHeader>
        <CardContent>
          {attendance.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No attendance records found. You may not be enrolled in any classes yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-center">Total Classes</TableHead>
                  <TableHead className="text-center">Attended</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.map((record, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{record.subject}</TableCell>
                    <TableCell className="text-center">{record.totalClasses}</TableCell>
                    <TableCell className="text-center">{record.attended}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          record.percentage >= 75
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {record.percentage}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

