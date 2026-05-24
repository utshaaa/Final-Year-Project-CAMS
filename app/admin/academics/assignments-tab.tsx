"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Trash2, Search, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Class {
  id: string
  name: string
}

interface Subject {
  id: string
  name: string
}

interface Teacher {
  id: string
  name: string
  email: string
}

interface Student {
  id: string
  name: string
  email: string
  studentProfile?: {
    rollNo: string
    class: string
  }
}

interface ClassSubject {
  id: string
  className: string
  subjectName: string
  teacherName: string
}

interface Enrollment {
  id: string
  studentUserId: string
  studentName: string
  studentRollNo: string
  className: string
}

export function AssignmentsTab() {
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [enrolling, setEnrolling] = useState(false)

  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedTeacher, setSelectedTeacher] = useState("")

  const [selectedEnrollClass, setSelectedEnrollClass] = useState("")
  const [selectedStudent, setSelectedStudent] = useState("")
  const [studentComboOpen, setStudentComboOpen] = useState(false)

  const [assignmentSearch, setAssignmentSearch] = useState("")
  const [enrollmentSearch, setEnrollmentSearch] = useState("")

  const [deletingAssignmentId, setDeletingAssignmentId] = useState<string | null>(null)
  const [deletingEnrollmentStudentId, setDeletingEnrollmentStudentId] = useState<string | null>(null)
  const [deletingNow, setDeletingNow] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [classesRes, subjectsRes, teachersRes, studentsRes, assignmentsRes, enrollmentsRes] = await Promise.all([
        fetch('/api/admin/classes', { credentials: 'include' }),
        fetch('/api/admin/subjects', { credentials: 'include' }),
        fetch('/api/admin/users?role=TEACHER', { credentials: 'include' }),
        fetch('/api/admin/users?role=STUDENT', { credentials: 'include' }),
        fetch('/api/admin/assignments/class-subject', { credentials: 'include' }),
        fetch('/api/admin/assignments/enroll', { credentials: 'include' }),
      ])

      const [classesData, subjectsData, teachersData, studentsData, assignmentsData, enrollmentsData] = await Promise.all([
        classesRes.json(),
        subjectsRes.json(),
        teachersRes.json(),
        studentsRes.json(),
        assignmentsRes.json(),
        enrollmentsRes.json(),
      ])

      setClasses(classesData.classes || [])
      setSubjects(subjectsData.subjects || [])
      setTeachers(teachersData.users || [])
      setStudents(studentsData.users || [])
      setClassSubjects(assignmentsData.assignments || [])
      setEnrollments(enrollmentsData.enrollments || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAssignTeacher = async () => {
    if (!selectedClass || !selectedSubject || !selectedTeacher) {
      toast({
        title: "Error",
        description: "Please select class, subject, and teacher",
        variant: "destructive",
      })
      return
    }

    try {
      setAssigning(true)
      const response = await fetch('/api/admin/assignments/class-subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          classId: selectedClass,
          subjectId: selectedSubject,
          teacherId: selectedTeacher,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to assign teacher')
      }

      toast({
        title: "Success",
        description: "Teacher assigned successfully",
      })
      setSelectedClass("")
      setSelectedSubject("")
      setSelectedTeacher("")
      fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to assign teacher",
        variant: "destructive",
      })
    } finally {
      setAssigning(false)
    }
  }

  const handleEnrollStudent = async () => {
    if (!selectedEnrollClass || !selectedStudent) {
      toast({
        title: "Error",
        description: "Please select class and student",
        variant: "destructive",
      })
      return
    }

    try {
      setEnrolling(true)
      const response = await fetch('/api/admin/assignments/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          classId: selectedEnrollClass,
          studentId: selectedStudent,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to enroll student')
      }

      toast({
        title: "Success",
        description: "Student enrolled successfully",
      })
      setSelectedStudent("")
      fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to enroll student",
        variant: "destructive",
      })
    } finally {
      setEnrolling(false)
    }
  }

  const handleDeleteAssignment = async () => {
    if (!deletingAssignmentId) return
    try {
      setDeletingNow(true)
      const res = await fetch(`/api/admin/assignments/class-subject?id=${deletingAssignmentId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to remove assignment')
      }
      toast({ title: "Success", description: "Assignment removed" })
      setDeletingAssignmentId(null)
      fetchData()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setDeletingNow(false)
    }
  }

  const handleDeleteEnrollment = async () => {
    if (!deletingEnrollmentStudentId) return
    try {
      setDeletingNow(true)
      const res = await fetch(`/api/admin/assignments/enroll?studentId=${deletingEnrollmentStudentId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to unenroll student')
      }
      toast({ title: "Success", description: "Student unenrolled" })
      setDeletingEnrollmentStudentId(null)
      fetchData()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setDeletingNow(false)
    }
  }

  // Students of the selected class's grade, alphabetical
  const selectedClassName = classes.find((c) => c.id === selectedEnrollClass)?.name || ""
  const enrollableStudents = students
    .filter((s) => selectedClassName && s.studentProfile?.class === selectedClassName)
    .sort((a, b) => a.name.localeCompare(b.name))
  const selectedStudentObj = students.find((s) => s.id === selectedStudent)

  const filteredAssignments = classSubjects.filter((a) => {
    const q = assignmentSearch.trim().toLowerCase()
    if (!q) return true
    return (
      a.className.toLowerCase().includes(q) ||
      a.subjectName.toLowerCase().includes(q) ||
      a.teacherName.toLowerCase().includes(q)
    )
  })

  const filteredEnrollments = enrollments.filter((e) => {
    const q = enrollmentSearch.trim().toLowerCase()
    if (!q) return true
    return (
      e.studentName.toLowerCase().includes(q) ||
      e.studentRollNo.toLowerCase().includes(q) ||
      e.className.toLowerCase().includes(q)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <Tabs defaultValue="teacher" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="teacher">Assign Teacher</TabsTrigger>
        <TabsTrigger value="student">Enroll Student</TabsTrigger>
      </TabsList>

      <TabsContent value="teacher" className="space-y-6 mt-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Assign Teacher to Class + Subject</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Teacher</Label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleAssignTeacher} disabled={assigning} className="mt-4">
            {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign"}
          </Button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4 gap-4">
            <h2 className="text-lg font-semibold">Current Assignments</h2>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={assignmentSearch}
                onChange={(e) => setAssignmentSearch(e.target.value)}
                placeholder="Search class, subject, teacher..."
                className="pl-8"
              />
            </div>
          </div>
          {classSubjects.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No assignments yet</p>
          ) : filteredAssignments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No assignments match your search</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>{assignment.className}</TableCell>
                    <TableCell>{assignment.subjectName}</TableCell>
                    <TableCell>{assignment.teacherName}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingAssignmentId(assignment.id)}
                        title="Remove assignment"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </TabsContent>

      <TabsContent value="student" className="space-y-6 mt-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Enroll Student into Class</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Class</Label>
              <Select
                value={selectedEnrollClass}
                onValueChange={(v) => {
                  setSelectedEnrollClass(v)
                  setSelectedStudent("")
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Student</Label>
              <Popover open={studentComboOpen} onOpenChange={setStudentComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={studentComboOpen}
                    disabled={!selectedEnrollClass}
                    className="w-full justify-between font-normal"
                  >
                    {selectedStudentObj
                      ? `${selectedStudentObj.name} (${selectedStudentObj.studentProfile?.rollNo || 'N/A'})`
                      : selectedEnrollClass
                      ? "Select student"
                      : "Select a class first"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search student..." />
                    <CommandList>
                      <CommandEmpty>No students in this class.</CommandEmpty>
                      <CommandGroup>
                        {enrollableStudents.map((student) => (
                          <CommandItem
                            key={student.id}
                            value={`${student.name} ${student.studentProfile?.rollNo || ''}`}
                            onSelect={() => {
                              setSelectedStudent(student.id)
                              setStudentComboOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedStudent === student.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {student.name} ({student.studentProfile?.rollNo || 'N/A'})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <Button onClick={handleEnrollStudent} disabled={enrolling || !selectedStudent} className="mt-4">
            {enrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enroll"}
          </Button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4 gap-4">
            <h2 className="text-lg font-semibold">Current Enrollments</h2>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={enrollmentSearch}
                onChange={(e) => setEnrollmentSearch(e.target.value)}
                placeholder="Search student, roll no, class..."
                className="pl-8"
              />
            </div>
          </div>
          {enrollments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No enrollments yet</p>
          ) : filteredEnrollments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No enrollments match your search</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>{enrollment.studentName}</TableCell>
                    <TableCell>{enrollment.studentRollNo}</TableCell>
                    <TableCell>{enrollment.className}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingEnrollmentStudentId(enrollment.studentUserId)}
                        title="Unenroll student"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </TabsContent>

      <AlertDialog open={!!deletingAssignmentId} onOpenChange={(open) => !open && setDeletingAssignmentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              The teacher will no longer be assigned to this class-subject.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingNow}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAssignment}
              disabled={deletingNow}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingNow ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingEnrollmentStudentId} onOpenChange={(open) => !open && setDeletingEnrollmentStudentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unenroll this student?</AlertDialogTitle>
            <AlertDialogDescription>
              The student will be removed from this class.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingNow}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEnrollment}
              disabled={deletingNow}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingNow ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unenroll"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  )
}
