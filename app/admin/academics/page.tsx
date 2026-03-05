"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClassesTab } from "@/app/admin/academics/classes-tab"
import { SubjectsTab } from "@/app/admin/academics/subjects-tab"
import { AssignmentsTab } from "@/app/admin/academics/assignments-tab"

export default function AcademicsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Academics Management</h1>
        <p className="text-muted-foreground mt-1">Manage classes, subjects, and assignments.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="classes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="classes">Classes</TabsTrigger>
              <TabsTrigger value="subjects">Subjects</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
            </TabsList>
            <TabsContent value="classes" className="mt-6">
              <ClassesTab />
            </TabsContent>
            <TabsContent value="subjects" className="mt-6">
              <SubjectsTab />
            </TabsContent>
            <TabsContent value="assignments" className="mt-6">
              <AssignmentsTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
