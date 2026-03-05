"use client"

import { useRole } from "@/contexts/role-context"
import { StudentDashboard } from "@/components/dashboards/student-dashboard"
import { TeacherDashboard } from "@/components/dashboards/teacher-dashboard"
import { AdminDashboard } from "@/components/dashboards/admin-dashboard"

export default function Home() {
  const { role } = useRole()

  if (role === "student") {
    return <StudentDashboard />
  }

  if (role === "teacher") {
    return <TeacherDashboard />
  }

  return <AdminDashboard />
}
