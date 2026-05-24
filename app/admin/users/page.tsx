"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Pencil, Trash2, Plus, Loader2, UserPlus, BookOpen, X, Search } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  studentProfile?: {
    id: string
    rollNo: string
    class: string
    section?: string
  }
  teacherProfile?: {
    id: string
    department: string
  }
  enrolled?: boolean
  assignments: { id: string, label: string, classId?: string, subjectId?: string }[]
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "student",
    password: "",
    rollNo: "",
    class: "",
    department: "",
  })
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedUserForAction, setSelectedUserForAction] = useState<User | null>(null)
  const [selectedClassForAction, setSelectedClassForAction] = useState("")
  const [selectedSubjectForAction, setSelectedSubjectForAction] = useState("")
  const [performingAction, setPerformingAction] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [search, setSearch] = useState("")
  const [classFilter, setClassFilter] = useState("all")

  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
    fetchClassesAndSubjects()
  }, [])

  const fetchClassesAndSubjects = async () => {
    try {
      const [classesRes, subjectsRes] = await Promise.all([
        fetch('/api/admin/classes', { credentials: 'include' }),
        fetch('/api/admin/subjects', { credentials: 'include' }),
      ])
      const [classesData, subjectsData] = await Promise.all([
        classesRes.json(),
        subjectsRes.json(),
      ])
      setClasses(classesData.classes || [])
      setSubjects(subjectsData.subjects || [])
    } catch (error) {
      console.error('Error fetching classes/subjects:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/users', {
        credentials: 'include',
      })
      
      if (!res.ok) {
        throw new Error('Failed to fetch users')
      }
      
      const data = await res.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const openAddDialog = () => {
    setEditingUser(null)
    setFormData({ 
      name: "", 
      email: "", 
      role: "student", 
      password: "",
      rollNo: "",
      class: "",
      department: "",
    })
    setIsOpen(true)
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    const enrollmentClassId = user.role === 'student'
      ? (user.assignments?.[0]?.classId || "")
      : ""
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
      rollNo: user.studentProfile?.rollNo || "",
      class: enrollmentClassId,
      department: user.teacherProfile?.department || "",
    })
    setIsOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      return
    }

    if (!editingUser && !formData.password) {
      toast({
        title: "Error",
        description: "Password is required for new users",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        ...(formData.password && { password: formData.password }),
        ...(formData.role === 'student' && {
          rollNo: formData.rollNo,
          class: formData.class,
        }),
        ...(formData.role === 'teacher' && {
          department: formData.department,
        }),
      }

      if (editingUser) {
        const res = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'Failed to update user')
        }

        const updatedUser = await res.json()
        setUsers(users.map((u) => (u.id === editingUser.id ? updatedUser : u)))
      } else {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'Failed to create user')
        }

        const newUser = await res.json()
        setUsers([...users, newUser])
      }

      setIsOpen(false)
      setFormData({ 
        name: "", 
        email: "", 
        role: "student", 
        password: "",
        rollNo: "",
        class: "",
        department: "",
      })
      toast({
        title: "Success",
        description: `User ${editingUser ? "updated" : "created"} successfully.`,
      })
      fetchUsers()
    } catch (error: any) {
      console.error('Error saving user:', error)
      toast({
        title: "Error",
        description: error.message || 'Failed to save user',
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const openDeleteDialog = (id: string) => {
    setUserToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!userToDelete) return

    try {
      setDeleting(true)
      const res = await fetch(`/api/admin/users/${userToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete user')
      }

      toast({
        title: "Success",
        description: "User deleted successfully.",
      })
      setDeleteDialogOpen(false)
      setUserToDelete(null)
      fetchUsers()
    } catch (error: any) {
      console.error('Error deleting user:', error)
      toast({
        title: "Error",
        description: error.message || 'Failed to delete user',
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleEnrollment = async () => {
    if (!selectedUserForAction || !selectedClassForAction) return

    try {
      setPerformingAction(true)
      const res = await fetch('/api/admin/assignments/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          classId: selectedClassForAction,
          studentId: selectedUserForAction.id,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to enroll student')
      }

      toast({
        title: "Success",
        description: "Student enrolled successfully",
      })
      setEnrollDialogOpen(false)
      setSelectedUserForAction(null)
      setSelectedClassForAction("")
      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to enroll student",
        variant: "destructive",
      })
    } finally {
      setPerformingAction(false)
    }
  }

  const handleAssignment = async () => {
    if (!selectedUserForAction || !selectedClassForAction || !selectedSubjectForAction) return

    try {
      setPerformingAction(true)
      const res = await fetch('/api/admin/assignments/class-subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          classId: selectedClassForAction,
          subjectId: selectedSubjectForAction,
          teacherId: selectedUserForAction.id,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to assign teacher')
      }

      toast({
        title: "Success",
        description: "Teacher assigned successfully",
      })
      setAssignDialogOpen(false)
      setSelectedUserForAction(null)
      setSelectedClassForAction("")
      setSelectedSubjectForAction("")
      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to assign teacher",
        variant: "destructive",
      })
    } finally {
      setPerformingAction(false)
    }
  }

  const handleUnenroll = async (userId: string) => {
    try {
      setPerformingAction(true)
      const res = await fetch(`/api/admin/assignments/enroll?studentId=${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to unenroll student')
      }

      toast({
        title: "Success",
        description: "Student unenrolled successfully",
      })
      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to unenroll student",
        variant: "destructive",
      })
    } finally {
      setPerformingAction(false)
    }
  }

  const handleUnassign = async (assignmentId: string) => {
    try {
      setPerformingAction(true)
      const res = await fetch(`/api/admin/assignments/class-subject?id=${assignmentId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to remove assignment')
      }

      toast({
        title: "Success",
        description: "Assignment removed successfully",
      })
      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove assignment",
        variant: "destructive",
      })
    } finally {
      setPerformingAction(false)
    }
  }

  const classNameById = (id: string) => classes.find((c) => c.id === id)?.name || ""

  const applyFilters = (list: User[]) => {
    const q = search.trim().toLowerCase()
    const className = classFilter === "all" ? "" : classNameById(classFilter)
    return list.filter((u) => {
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      const matchesClass =
        !className ||
        u.studentProfile?.class === className ||
        (u.assignments || []).some((a) => a.label?.startsWith(className))
      return matchesSearch && matchesClass
    })
  }

  const filteredAll = applyFilters(users)
  const filteredStudents = applyFilters(users.filter((u) => u.role === 'student'))
  const filteredTeachers = applyFilters(users.filter((u) => u.role === 'teacher'))
  const filteredAdmins = applyFilters(users.filter((u) => u.role === 'admin'))

  const UserTable = ({ data, showEnrollment = true }: { data: User[], showEnrollment?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          {showEnrollment && <TableHead>Enrollment / Assignments</TableHead>}
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showEnrollment ? 6 : 5} className="text-center py-8 text-muted-foreground">
              No users found in this category
            </TableCell>
          </TableRow>
        ) : (
          data.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <span className="capitalize">{user.role}</span>
              </TableCell>
              {showEnrollment && (
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.assignments && user.assignments.length > 0 ? (
                      user.assignments.map((as) => (
                        <span 
                          key={as.id} 
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${
                            user.role === 'student' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          }`}
                        >
                          {as.label}
                          <button
                            onClick={() => user.role === 'student' ? handleUnenroll(user.id) : handleUnassign(as.id)}
                            className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
                            disabled={performingAction}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        {user.role === 'student' ? 'Not Enrolled' : user.role === 'teacher' ? 'No Subjects' : 'N/A'}
                      </span>
                    )}
                  </div>
                </TableCell>
              )}
              <TableCell>
                <span
                  className={`text-xs px-2 py-1 rounded capitalize ${
                    user.status === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {user.status}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {user.role === 'student' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedUserForAction(user)
                        setEnrollDialogOpen(true)
                      }}
                      title="Enroll in Class"
                    >
                      <UserPlus className="h-4 w-4 text-blue-600" />
                    </Button>
                  )}
                  {user.role === 'teacher' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedUserForAction(user)
                        setAssignDialogOpen(true)
                      }}
                      title="Assign to Subject"
                    >
                      <BookOpen className="h-4 w-4 text-purple-600" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(user)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openDeleteDialog(user.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Add, edit, or remove users from the system.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" /> Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  {editingUser ? "New Password (leave empty to keep current)" : "Password"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? "Enter new password" : "Enter password"}
                  required={!editingUser}
                />
              </div>

              {formData.role === "student" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="rollNo">Roll Number</Label>
                    <Input
                      id="rollNo"
                      value={formData.rollNo}
                      onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                      placeholder="e.g. 2024-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class">Class</Label>
                    <Select
                      value={formData.class || "none"}
                      onValueChange={(value) => setFormData({ ...formData, class: value === "none" ? "" : value })}
                    >
                      <SelectTrigger id="class">
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No class (unenrolled)</SelectItem>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {formData.role === "teacher" && (
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Mathematics"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1" disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="flex-1" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingUser ? "Save Changes" : "Add User"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-8"
          />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Filter by class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="all">All Users ({filteredAll.length})</TabsTrigger>
          <TabsTrigger value="students">Students ({filteredStudents.length})</TabsTrigger>
          <TabsTrigger value="teachers">Teachers ({filteredTeachers.length})</TabsTrigger>
          <TabsTrigger value="admins">Admins ({filteredAdmins.length})</TabsTrigger>
        </TabsList>
        <Card>
          <TabsContent value="all" className="m-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">All Registered Users</CardTitle>
            </CardHeader>
            <CardContent>
              <UserTable data={filteredAll} />
            </CardContent>
          </TabsContent>
          <TabsContent value="students" className="m-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Registered Students</CardTitle>
            </CardHeader>
            <CardContent>
              <UserTable data={filteredStudents} />
            </CardContent>
          </TabsContent>
          <TabsContent value="teachers" className="m-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Registered Teachers</CardTitle>
            </CardHeader>
            <CardContent>
              <UserTable data={filteredTeachers} />
            </CardContent>
          </TabsContent>
          <TabsContent value="admins" className="m-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Administrator Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <UserTable data={filteredAdmins} showEnrollment={false} />
            </CardContent>
          </TabsContent>
        </Card>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enroll {selectedUserForAction?.name} in a Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Select Class</Label>
              <Select value={selectedClassForAction} onValueChange={setSelectedClassForAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class" />
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
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setEnrollDialogOpen(false)} className="flex-1" disabled={performingAction}>
                Cancel
              </Button>
              <Button onClick={handleEnrollment} className="flex-1" disabled={performingAction || !selectedClassForAction}>
                {performingAction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Enroll Student"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign {selectedUserForAction?.name} to Subject</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Select Class</Label>
              <Select value={selectedClassForAction} onValueChange={setSelectedClassForAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class" />
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
            <div className="space-y-2">
              <Label>Select Subject</Label>
              <Select value={selectedSubjectForAction} onValueChange={setSelectedSubjectForAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a subject" />
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
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)} className="flex-1" disabled={performingAction}>
                Cancel
              </Button>
              <Button onClick={handleAssignment} className="flex-1" disabled={performingAction || !selectedClassForAction || !selectedSubjectForAction}>
                {performingAction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Assign Teacher"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

