"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { adminStats } from "@/lib/mock-data"

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of the academic system.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{adminStats.totalStudents}</div>
            <p className="text-sm text-muted-foreground mt-1">Enrolled students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{adminStats.totalTeachers}</div>
            <p className="text-sm text-muted-foreground mt-1">Faculty members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{adminStats.activeUsers}</div>
            <p className="text-sm text-muted-foreground mt-1">Currently active</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Management</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/admin/users"
            className="p-4 rounded-md bg-muted hover:bg-muted/80 transition-colors"
          >
            <p className="font-medium text-foreground">User Management</p>
            <p className="text-sm text-muted-foreground mt-1">Add, edit, or remove users from the system</p>
          </Link>
          <Link
            href="/admin/calendar"
            className="p-4 rounded-md bg-muted hover:bg-muted/80 transition-colors"
          >
            <p className="font-medium text-foreground">Academic Calendar</p>
            <p className="text-sm text-muted-foreground mt-1">Manage events, holidays, and deadlines</p>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
