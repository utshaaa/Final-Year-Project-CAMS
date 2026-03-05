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
import { studentGrades } from "@/lib/mock-data"

export default function GradesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Grades</h1>
        <p className="text-muted-foreground mt-1">View your academic performance.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Grades</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead className="text-center">Marks</TableHead>
                <TableHead className="text-right">Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentGrades.map((grade, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{grade.subject}</TableCell>
                  <TableCell>{grade.exam}</TableCell>
                  <TableCell className="text-center">{grade.marks}</TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-sm font-medium">
                      {grade.grade}
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
