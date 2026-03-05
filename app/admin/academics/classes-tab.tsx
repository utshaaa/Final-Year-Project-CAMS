"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

interface Class {
  id: string
  name: string
  section: string | null
  studentCount: number
}

export function ClassesTab() {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState("")
  const [section, setSection] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/classes', {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch classes')
      const data = await response.json()
      setClasses(data.classes || [])
    } catch (error) {
      console.error('Error fetching classes:', error)
      toast({
        title: "Error",
        description: "Failed to load classes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Class name is required",
        variant: "destructive",
      })
      return
    }

    try {
      setCreating(true)
      const response = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim(), section: section.trim() || null }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create class')
      }

      toast({
        title: "Success",
        description: "Class created successfully",
      })
      setName("")
      setSection("")
      fetchClasses()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create class",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
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
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Create New Class</h2>
        <form onSubmit={handleCreate} className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="className">Class Name</Label>
            <Input
              id="className"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Grade 10"
              required
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="section">Section (optional)</Label>
            <Input
              id="section"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="e.g., A"
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
        <h2 className="text-lg font-semibold mb-4">All Classes</h2>
        {classes.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No classes created yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class Name</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Students</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((cls) => (
                <TableRow key={cls.id}>
                  <TableCell className="font-medium">{cls.name}</TableCell>
                  <TableCell>{cls.section || "-"}</TableCell>
                  <TableCell>{cls.studentCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
