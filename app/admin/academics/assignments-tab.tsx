"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Class {
  id: string
  name: string
  section: string | null
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
  rollNo: string
}

interface ClassSubject {
  id: string
  className: string
  subjectName: string
  teacherName: string
}

interface Enrollment {
  id: string
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
      setSelectedEnrollClass("")
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
                      {cls.name} {cls.section ? `- ${cls.section}` : ""}
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
          <h2 className="text-lg font-semibold mb-4">Current Assignments</h2>
          {classSubjects.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No assignments yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Teacher</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classSubjects.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>{assignment.className}</TableCell>
                    <TableCell>{assignment.subjectName}</TableCell>
                    <TableCell>{assignment.teacherName}</TableCell>
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
              <Select value={selectedEnrollClass} onValueChange={setSelectedEnrollClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} {cls.section ? `- ${cls.section}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Student</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} ({student.rollNo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleEnrollStudent} disabled={enrolling} className="mt-4">
            {enrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enroll"}
          </Button>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Current Enrollments</h2>
          {enrollments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No enrollments yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Class</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>{enrollment.studentName}</TableCell>
                    <TableCell>{enrollment.studentRollNo}</TableCell>
                    <TableCell>{enrollment.className}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}
