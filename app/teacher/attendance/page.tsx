"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { classStudents, subjects, classes } from "@/lib/mock-data"

export default function TeacherAttendancePage() {
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [attendance, setAttendance] = useState<Record<number, boolean>>({})
  const [saved, setSaved] = useState(false)

  const toggleAttendance = (studentId: number) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }))
    setSaved(false)
  }

  const markAllPresent = () => {
    const allPresent: Record<number, boolean> = {}
    classStudents.forEach((student) => {
      allPresent[student.id] = true
    })
    setAttendance(allPresent)
    setSaved(false)
  }

  const handleSave = () => {
    setSaved(true)
  }

  const presentCount = Object.values(attendance).filter(Boolean).length

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Mark Attendance</h1>
        <p className="text-muted-foreground mt-1">Record daily attendance for your class.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Class & Subject</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls} value={cls}>
                  {cls}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-48">
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
        </CardContent>
      </Card>

      {selectedClass && selectedSubject && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Students ({presentCount}/{classStudents.length} present)
            </CardTitle>
            <Button variant="outline" size="sm" onClick={markAllPresent}>
              Mark All Present
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {classStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-4 p-3 rounded-md bg-muted/50"
                >
                  <Checkbox
                    checked={attendance[student.id] || false}
                    onCheckedChange={() => toggleAttendance(student.id)}
                    id={`student-${student.id}`}
                  />
                  <label
                    htmlFor={`student-${student.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <p className="text-sm font-medium text-foreground">{student.name}</p>
                    <p className="text-xs text-muted-foreground">Roll No: {student.rollNo}</p>
                  </label>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      attendance[student.id]
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {attendance[student.id] ? "Present" : "Absent"}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-4">
              <Button onClick={handleSave}>Save Attendance</Button>
              {saved && (
                <p className="text-sm text-green-600 flex items-center">
                  Attendance saved successfully!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
