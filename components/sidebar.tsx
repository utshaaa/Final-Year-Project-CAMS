"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { UserRole } from "@prisma/client"
import { ChangePasswordDialog } from "@/components/change-password-dialog"

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
  { href: "/admin/academics", label: "Academics" },
  { href: "/admin/calendar", label: "Calendar" },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  if (!user) {
    return null
  }

  const role = user.role.toLowerCase() as 'student' | 'teacher' | 'admin'
  const links = 
    user.role === UserRole.STUDENT ? studentLinks :
    user.role === UserRole.TEACHER ? teacherLinks :
    adminLinks

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
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
                  isActive 
                    ? "bg-primary/10 text-primary font-semibold" 
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
        <div className="flex flex-col gap-2">
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground">Logged in as</p>
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </div>
          {(user.role === UserRole.STUDENT || user.role === UserRole.TEACHER) && (
            <ChangePasswordDialog />
          )}
          <Button
            variant="outline" 
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={logout}
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}
