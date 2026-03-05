"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { availableExams, examQuestions } from "@/lib/mock-data"

export default function TakeExamPage() {
  const params = useParams()
  const examId = Number(params.id)
  const exam = availableExams.find((e) => e.id === examId)

  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)

  if (!exam) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-semibold text-foreground">Exam not found</h1>
        <Button asChild className="mt-4">
          <Link href="/exams">Back to Exams</Link>
        </Button>
      </div>
    )
  }

  const handleSubmit = () => {
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground">Exam Submitted Successfully!</h2>
              <p className="text-muted-foreground">
                Your answers for {exam.name} have been submitted. You will receive your results soon.
              </p>
              <Button asChild>
                <Link href="/exams">Back to Exams</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{exam.name}</h1>
        <p className="text-muted-foreground mt-1">
          {exam.subject} | Duration: {exam.duration}
        </p>
      </div>

      <div className="space-y-4">
        {examQuestions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle className="text-base">
                Question {index + 1}: {question.question}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[question.id] || ""}
                onValueChange={(value) =>
                  setAnswers((prev) => ({ ...prev, [question.id]: value }))
                }
              >
                {question.options.map((option, optIndex) => (
                  <div key={optIndex} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={String(optIndex)}
                      id={`q${question.id}-opt${optIndex}`}
                    />
                    <Label
                      htmlFor={`q${question.id}-opt${optIndex}`}
                      className="text-sm cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-4">
        <Button variant="outline" asChild>
          <Link href="/exams">Cancel</Link>
        </Button>
        <Button onClick={handleSubmit}>Submit Exam</Button>
      </div>
    </div>
  )
}
