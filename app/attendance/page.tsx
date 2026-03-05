"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { studentAttendance } from "@/lib/mock-data"

export default function AttendancePage() {
  const averageAttendance = Math.round(
    studentAttendance.reduce((acc, curr) => acc + curr.percentage, 0) / studentAttendance.length
  )

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
              {studentAttendance.map((record, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{record.subject}</TableCell>
                  <TableCell className="text-center">{record.totalClasses}</TableCell>
                  <TableCell className="text-center">{record.attended}</TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        record.percentage >= 75
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {record.percentage}%
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
