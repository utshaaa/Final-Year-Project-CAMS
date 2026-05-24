"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { UserRole } from "@prisma/client"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const studentLinks = [
  { href: "/student", label: "Dashboard" },
  { href: "/attendance", label: "Attendance" },
  { href: "/exams", label: "Exams" },
  { href: "/grades", label: "Grades" },
  { href: "/calendar", label: "Calendar" },
  { href: "/todo", label: "To-Do" },
  { href: "/chat", label: "Chat" },
]

const teacherLinks = [
  { href: "/teacher", label: "Dashboard" },
  { href: "/teacher/attendance", label: "Attendance" },
  { href: "/teacher/exams", label: "Exams" },
  { href: "/teacher/grades", label: "Grades" },
  { href: "/chat", label: "Chat" },
]

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/calendar", label: "Calendar" },
]

export function MobileNav() {
  const { user } = useAuth()
  const pathname = usePathname()

  if (!user) {
    return null
  }

  const links = 
    user.role === UserRole.STUDENT ? studentLinks :
    user.role === UserRole.TEACHER ? teacherLinks :
    adminLinks

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
            {links.map((link) => {
              let isActive = false
              
              if (pathname === link.href) {
                isActive = true
              } else if (link.href !== '/' && pathname.startsWith(link.href + '/')) {
                const isDashboardRoute = link.href === '/admin' || link.href === '/teacher' || link.href === '/student'
                if (!isDashboardRoute) {
                  isActive = true
                }
              }
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-2 text-sm transition-colors rounded-md",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
