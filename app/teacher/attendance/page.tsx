"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Student {
  id: string
  studentId: string
  name: string
  rollNo: string
  class: string
}

interface AttendanceHistoryItem {
  date: string
  present: number
  absent: number
  late: number
  total: number
}

export default function TeacherAttendancePage() {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]
  const [activeTab, setActiveTab] = useState("mark")
  const [selectedClass, setSelectedClass] = useState("")
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  const [leaving, setLeaving] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [attendance, setAttendance] = useState<Record<string, "PRESENT" | "ABSENT" | "LATE">>({})
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [teacherClasses, setTeacherClasses] = useState<Array<{ id: string; name: string }>>([])
  const [history, setHistory] = useState<AttendanceHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyClass, setHistoryClass] = useState("")
  const [historyFrom, setHistoryFrom] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 7)
    return date.toISOString().split('T')[0]
  })
  const [historyTo, setHistoryTo] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchClasses()
  }, [])

  useEffect(() => {
    if (attendanceDate > today) {
      setStudents([])
      setAttendance({})
      setHasUnsavedChanges(false)
      setError('Cannot mark attendance for a future date.')
    } else if (selectedClass && attendanceDate) {
      fetchStudents()
    } else {
      setStudents([])
      setAttendance({})
    }
  }, [selectedClass, attendanceDate])

  useEffect(() => {
    if (activeTab === "history" && historyClass) {
      fetchHistory()
    }
  }, [activeTab, historyClass, historyFrom, historyTo])

  // Warn on browser close / refresh when there are unsaved attendance changes
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [hasUnsavedChanges])

  // Intercept in-app link navigation when there are unsaved changes
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!hasUnsavedChanges || e.defaultPrevented) return
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const anchor = (e.target as HTMLElement | null)?.closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('http') || href.startsWith('#') || anchor.target === '_blank') return
      if (href === window.location.pathname) return
      e.preventDefault()
      setPendingHref(href)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [hasUnsavedChanges])

  const confirmLeave = () => {
    const href = pendingHref
    setHasUnsavedChanges(false)
    setPendingHref(null)
    if (href) router.push(href)
  }

  const saveAndLeave = async () => {
    setLeaving(true)
    const ok = await handleSave()
    setLeaving(false)
    if (ok) {
      const href = pendingHref
      setPendingHref(null)
      if (href) router.push(href)
    }
  }

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/teacher/classes', {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch classes')
      const data = await response.json()
      setTeacherClasses(data.classes || [])
      if (data.classes && data.classes.length > 0 && !selectedClass) {
        setSelectedClass(data.classes[0].id)
        setHistoryClass(data.classes[0].id)
      }
    } catch (err) {
      console.error('Error fetching classes:', err)
    }
  }

  const fetchStudents = async () => {
    if (!selectedClass) return
    
    try {
      setLoadingStudents(true)
      setError(null)
      const response = await fetch(`/api/teacher/students?classId=${selectedClass}`, {
        credentials: 'include',
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch students')
      }
      const data = await response.json()
      setStudents(data || [])
      
      const initialAttendance: Record<string, "PRESENT" | "ABSENT" | "LATE"> = {}
      data.forEach((student: Student) => {
        initialAttendance[student.studentId] = "ABSENT"
      })
      setAttendance(initialAttendance)
      setHasUnsavedChanges(false)

      fetchExistingAttendance()
    } catch (err: any) {
      console.error('Error fetching students:', err)
      setError(err.message || 'Failed to load students')
      setStudents([])
    } finally {
      setLoadingStudents(false)
    }
  }

  const fetchExistingAttendance = async () => {
    if (!selectedClass || !attendanceDate) return

    try {
      const response = await fetch(`/api/teacher/attendance?classId=${selectedClass}&date=${attendanceDate}`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        if (data.attendance && data.attendance.length > 0) {
          const existingAttendance: Record<string, "PRESENT" | "ABSENT" | "LATE"> = {}
          data.attendance.forEach((record: any) => {
            existingAttendance[record.studentId] = record.status
          })
          setAttendance(existingAttendance)
          setSaved(true)
          setHasUnsavedChanges(false)
        }
      }
    } catch (err) {
      console.error('Error fetching existing attendance:', err)
    }
  }

  const fetchHistory = async () => {
    if (!historyClass) return

    try {
      setHistoryLoading(true)
      const response = await fetch(
        `/api/teacher/attendance/history?classId=${historyClass}&from=${historyFrom}&to=${historyTo}`,
        { credentials: 'include' }
      )
      if (!response.ok) {
        throw new Error('Failed to fetch history')
      }
      const data = await response.json()
      setHistory(data.history || [])
    } catch (err) {
      console.error('Error fetching history:', err)
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const toggleAttendance = (studentId: string, status: "PRESENT" | "ABSENT" | "LATE") => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }))
    setSaved(false)
    setHasUnsavedChanges(true)
    setError(null)
  }

  const markAllPresent = () => {
    const allPresent: Record<string, "PRESENT" | "ABSENT" | "LATE"> = {}
    students.forEach((student) => {
      allPresent[student.studentId] = "PRESENT"
    })
    setAttendance(allPresent)
    setSaved(false)
    setHasUnsavedChanges(true)
    setError(null)
  }

  const handleSave = async (): Promise<boolean> => {
    if (!selectedClass || !attendanceDate) {
      setError('Please select class and date')
      return false
    }

    if (attendanceDate > today) {
      setError('Cannot mark attendance for a future date.')
      return false
    }

    if (students.length === 0) {
      setError('No students found for this class')
      return false
    }

    try {
      setLoading(true)
      setError(null)
      const entries = students.map((student) => ({
        studentId: student.studentId,
        status: attendance[student.studentId] || "ABSENT",
      }))

      const response = await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          classId: selectedClass,
          date: attendanceDate,
          entries,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save attendance')
      }

      setSaved(true)
      setHasUnsavedChanges(false)
      if (activeTab === "history") {
        fetchHistory()
      }
      return true
    } catch (err: any) {
      console.error('Error saving attendance:', err)
      setError(err.message || 'Failed to save attendance')
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleEditHistory = (date: string) => {
    setSelectedClass(historyClass)
    setAttendanceDate(date)
    setActiveTab("mark")
  }

  const presentCount = Object.values(attendance).filter((s) => s === "PRESENT").length
  const absentCount = Object.values(attendance).filter((s) => s === "ABSENT").length
  const lateCount = Object.values(attendance).filter((s) => s === "LATE").length

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Attendance</h1>
        <p className="text-muted-foreground mt-1">Mark and view attendance records for your classes.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
          <TabsTrigger value="history">Attendance History</TabsTrigger>
        </TabsList>

        <TabsContent value="mark" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Class & Date</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4 flex-wrap">
              <div className="space-y-2">
                <Label htmlFor="classSelect">Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-48" id="classSelect">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {teacherClasses.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateSelect">Date</Label>
                <Input
                  id="dateSelect"
                  type="date"
                  value={attendanceDate}
                  max={today}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="w-48"
                />
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {saved && !error && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Attendance saved successfully!</AlertDescription>
            </Alert>
          )}

          {selectedClass && attendanceDate <= today && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  Students ({presentCount} Present, {lateCount} Late, {absentCount} Absent)
                </CardTitle>
                <Button variant="outline" size="sm" onClick={markAllPresent} disabled={loadingStudents || students.length === 0}>
                  Mark All Present
                </Button>
              </CardHeader>
              <CardContent>
                {loadingStudents ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : students.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">No students found for this class.</p>
                ) : (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Roll No</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student) => {
                          const status = attendance[student.studentId] || "ABSENT"
                          return (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium">{student.name}</TableCell>
                              <TableCell>{student.rollNo}</TableCell>
                              <TableCell>
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    variant={status === "PRESENT" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => toggleAttendance(student.studentId, "PRESENT")}
                                    disabled={loading}
                                  >
                                    Present
                                  </Button>
                                  <Button
                                    variant={status === "LATE" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => toggleAttendance(student.studentId, "LATE")}
                                    disabled={loading}
                                  >
                                    Late
                                  </Button>
                                  <Button
                                    variant={status === "ABSENT" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => toggleAttendance(student.studentId, "ABSENT")}
                                    disabled={loading}
                                  >
                                    Absent
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                    <div className="flex gap-4 pt-4">
                      <Button onClick={handleSave} disabled={loading || students.length === 0}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Attendance"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Filters</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4 flex-wrap">
              <div className="space-y-2">
                <Label htmlFor="historyClassSelect">Class</Label>
                <Select value={historyClass} onValueChange={(value) => {
                  setHistoryClass(value)
                  setSelectedClass(value)
                }}>
                  <SelectTrigger className="w-48" id="historyClassSelect">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {teacherClasses.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="historyFrom">From</Label>
                <Input
                  id="historyFrom"
                  type="date"
                  value={historyFrom}
                  onChange={(e) => setHistoryFrom(e.target.value)}
                  className="w-48"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="historyTo">To</Label>
                <Input
                  id="historyTo"
                  type="date"
                  value={historyTo}
                  onChange={(e) => setHistoryTo(e.target.value)}
                  className="w-48"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attendance History</CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">No attendance records found for the selected period.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-center">Present</TableHead>
                      <TableHead className="text-center">Late</TableHead>
                      <TableHead className="text-center">Absent</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => (
                      <TableRow key={item.date}>
                        <TableCell className="font-medium">
                          {new Date(item.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-center">{item.present}</TableCell>
                        <TableCell className="text-center">{item.late}</TableCell>
                        <TableCell className="text-center">{item.absent}</TableCell>
                        <TableCell className="text-center">{item.total}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditHistory(item.date)}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!pendingHref} onOpenChange={(o) => !o && !leaving && setPendingHref(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved attendance changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved attendance changes. Do you want to save them before leaving this page?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={leaving}>Stay on page</AlertDialogCancel>
            <Button variant="outline" onClick={confirmLeave} disabled={leaving}>
              Leave without saving
            </Button>
            <Button onClick={saveAndLeave} disabled={leaving}>
              {leaving ? "Saving..." : "Save & leave"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
