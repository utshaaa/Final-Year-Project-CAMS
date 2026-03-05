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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2, UserPlus } from "lucide-react"

interface Subject {
  id: string
  name: string
  code: string | null
  teachers?: Array<{
    teacherId: string
    teacherName: string
    classes: string[]
  }>
}

interface Class {
  id: string
  name: string
  section: string | null
}

interface Teacher {
  id: string
  name: string
  email: string
}

export function SubjectsTab() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedTeacher, setSelectedTeacher] = useState("")
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [subjectsRes, classesRes, teachersRes] = await Promise.all([
        fetch('/api/admin/subjects', { credentials: 'include' }),
        fetch('/api/admin/classes', { credentials: 'include' }),
        fetch('/api/admin/users?role=TEACHER', { credentials: 'include' }),
      ])

      const [subjectsData, classesData, teachersData] = await Promise.all([
        subjectsRes.json(),
        classesRes.json(),
        teachersRes.json(),
      ])

      setSubjects(subjectsData.subjects || [])
      setClasses(classesData.classes || [])
      setTeachers(teachersData.users || [])

      await fetchSubjectAssignments(subjectsData.subjects || [])
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

  const fetchSubjectAssignments = async (subjectsList: Subject[]) => {
    try {
      const response = await fetch('/api/admin/assignments/class-subject', {
        credentials: 'include',
      })
      if (!response.ok) return

      const data = await response.json()
      const assignments = data.assignments || []

      const subjectsWithTeachers = subjectsList.map((subject) => {
        const subjectAssignments = assignments.filter(
          (a: any) => a.subjectId === subject.id
        )

        const teacherMap = new Map<string, { teacherName: string; classes: string[] }>()

        subjectAssignments.forEach((assignment: any) => {
          const teacherId = assignment.teacherId
          const teacherName = assignment.teacherName
          const className = assignment.className

          if (teacherId && teacherName) {
            if (!teacherMap.has(teacherId)) {
              teacherMap.set(teacherId, {
                teacherName,
                classes: [],
              })
            }
            if (!teacherMap.get(teacherId)!.classes.includes(className)) {
              teacherMap.get(teacherId)!.classes.push(className)
            }
          }
        })

        return {
          ...subject,
          teachers: Array.from(teacherMap.values()),
        }
      })

      setSubjects(subjectsWithTeachers)
    } catch (error) {
      console.error('Error fetching assignments:', error)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Subject name is required",
        variant: "destructive",
      })
      return
    }

    try {
      setCreating(true)
      const response = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim(), code: code.trim() || null }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create subject')
      }

      toast({
        title: "Success",
        description: "Subject created successfully",
      })
      setName("")
      setCode("")
      fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create subject",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const handleAssignTeacher = async () => {
    if (!selectedSubject || !selectedClass || !selectedTeacher) {
      toast({
        title: "Error",
        description: "Please select subject, class, and teacher",
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
          subjectId: selectedSubject.id,
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
      setAssignDialogOpen(false)
      setSelectedSubject(null)
      setSelectedClass("")
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

  const openAssignDialog = (subject: Subject) => {
    setSelectedSubject(subject)
    setSelectedClass("")
    setSelectedTeacher("")
    setAssignDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Create New Subject</h2>
        <form onSubmit={handleCreate} className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="subjectName">Subject Name</Label>
            <Input
              id="subjectName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Mathematics"
              required
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="subjectCode">Subject Code (optional)</Label>
            <Input
              id="subjectCode"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g., MATH101"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>
          </div>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">All Subjects</h2>
        {subjects.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No subjects created yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Assigned Teachers</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell className="font-medium">{subject.name}</TableCell>
                  <TableCell>{subject.code || "-"}</TableCell>
                  <TableCell>
                    {subject.teachers && subject.teachers.length > 0 ? (
                      <div className="space-y-1">
                        {subject.teachers.map((teacher, idx) => (
                          <div key={idx} className="text-sm">
                            <span className="font-medium">{teacher.teacherName}</span>
                            <span className="text-muted-foreground ml-2">
                              ({teacher.classes.join(", ")})
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No teachers assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Dialog open={assignDialogOpen && selectedSubject?.id === subject.id} onOpenChange={setAssignDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAssignDialog(subject)}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Assign Teacher
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Assign Teacher to {subject.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
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
                          <Button
                            onClick={handleAssignTeacher}
                            disabled={assigning || !selectedClass || !selectedTeacher}
                            className="w-full"
                          >
                            {assigning ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Assigning...
                              </>
                            ) : (
                              "Assign Teacher"
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
