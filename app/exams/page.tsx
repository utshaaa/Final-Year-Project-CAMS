"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { availableExams } from "@/lib/mock-data"

export default function ExamsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Exams</h1>
        <p className="text-muted-foreground mt-1">View and take available exams.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {availableExams.map((exam) => (
          <Card key={exam.id}>
            <CardHeader>
              <CardTitle className="text-base">{exam.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subject</span>
                  <span className="text-foreground">{exam.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="text-foreground">{exam.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="text-foreground">{exam.duration}</span>
                </div>
              </div>
              <Button asChild className="w-full">
                <Link href={`/exams/${exam.id}`}>Take Exam</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
