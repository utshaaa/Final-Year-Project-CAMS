"use client"

import Link from "next/link"
import { useRole } from "@/contexts/role-context"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"

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

export function MobileNav() {
  const { role } = useRole()

  const links = role === "student" ? studentLinks : role === "teacher" ? teacherLinks : adminLinks

  return (
    <div className="md:hidden border-b border-border bg-card px-4 py-2">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64">
          <nav className="flex flex-col gap-2 mt-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
