"use client"

import Link from "next/link"
import { useRole, Role } from "@/contexts/role-context"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

const studentLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/attendance", label: "Attendance" },
  { href: "/exams", label: "Exams" },
  { href: "/grades", label: "Grades" },
  { href: "/calendar", label: "Calendar" },
  { href: "/todo", label: "To-Do" },
  { href: "/chat", label: "Chat" },
]

const teacherLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/teacher/attendance", label: "Attendance" },
  { href: "/teacher/exams", label: "Exams" },
  { href: "/teacher/grades", label: "Grades" },
  { href: "/chat", label: "Chat" },
]

const adminLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/calendar", label: "Calendar" },
]

export function Sidebar() {
  const { role, setRole } = useRole()
  const pathname = usePathname()

  const links = role === "student" ? studentLinks : role === "teacher" ? teacherLinks : adminLinks

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-card">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2 font-semibold hover:opacity-90">
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            CAMS
          </span>
        </Link>
      </div>
      
      <div className="flex-1 px-4 py-2">
        <nav className="flex flex-col gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="border-t border-border p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">Current Role</span>
            <Select value={role} onValueChange={(value: Role) => setRole(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
             Logout
          </Button>
        </div>
      </div>
    </div>
  )
}
