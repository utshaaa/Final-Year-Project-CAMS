"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { calendarEvents } from "@/lib/mock-data"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

function getEventTypeColor(type: string) {
  switch (type) {
    case "exam":
      return "bg-blue-100 text-blue-800"
    case "holiday":
      return "bg-green-100 text-green-800"
    case "deadline":
      return "bg-red-100 text-red-800"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1)) // February 2026

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return calendarEvents.filter((event) => event.date === dateStr)
  }

  const days = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="p-2 h-24" />)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const events = getEventsForDay(day)
    days.push(
      <div key={day} className="p-2 h-24 border border-border rounded-md">
        <span className="text-sm font-medium text-foreground">{day}</span>
        <div className="mt-1 space-y-1">
          {events.slice(0, 2).map((event) => (
            <div
              key={event.id}
              className={`text-xs px-1 py-0.5 rounded truncate ${getEventTypeColor(event.type)}`}
            >
              {event.title}
            </div>
          ))}
          {events.length > 2 && (
            <div className="text-xs text-muted-foreground">+{events.length - 2} more</div>
          )}
        </div>
      </div>
    )
  }

  const monthEvents = calendarEvents.filter((event) => {
    const eventDate = new Date(event.date)
    return eventDate.getMonth() === month && eventDate.getFullYear() === year
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Academic Calendar</h1>
        <p className="text-muted-foreground mt-1">View upcoming exams, holidays, and deadlines.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {MONTHS[month]} {year}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">{days}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Events This Month</CardTitle>
          </CardHeader>
          <CardContent>
            {monthEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events this month.</p>
            ) : (
              <div className="space-y-3">
                {monthEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getEventTypeColor(event.type)}`}>
                      {event.type}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
