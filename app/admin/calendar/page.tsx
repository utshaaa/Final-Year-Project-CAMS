"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface CalendarEvent {
  id: string
  title: string
  date: string
  startTime?: string
  endTime?: string
  type: string
  description?: string
  classId?: string | null
  subjectId?: string | null
  className?: string | null
}

interface Class {
  id: string
  name: string
}

interface Subject {
  id: string
  name: string
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

function getEventTypeColor(type: string) {
  switch (type) {
    case "exam":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    case "holiday":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    case "event":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export default function AdminCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    startTime: "09:00",
    endTime: "10:00",
    type: "exam",
    description: "",
    classId: "all",
    subjectId: "none",
  })
  const { toast } = useToast()

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const startOfMonth = new Date(year, month, 1)
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59)

  useEffect(() => {
    fetchEvents()
    fetchClasses()
    fetchSubjects()
  }, [year, month])

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/admin/classes')
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes || [])
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
      setClasses([])
    }
  }

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/admin/subjects')
      if (response.ok) {
        const data = await response.json()
        setSubjects(data.subjects || [])
      }
    } catch (error) {
      console.error('Error fetching subjects:', error)
      setSubjects([])
    }
  }

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const startDate = startOfMonth.toISOString().split('T')[0]
      const endDate = endOfMonth.toISOString().split('T')[0]
      const response = await fetch(
        `/api/calendar/events?startDate=${startDate}&endDate=${endDate}&role=admin`,
        { credentials: 'include' }
      )
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch events: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!Array.isArray(data)) {
        setEvents([])
        return
      }
      
      const formattedEvents = data.map((event: any) => ({
        id: event.id,
        title: event.title,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        type: event.type,
        description: event.description || '',
        classId: event.classId,
        subjectId: event.subjectId,
        className: event.className,
      }))
      
      setEvents(formattedEvents)
    } catch (err: any) {
      console.error('Error fetching calendar events:', err)
      toast({
        title: "Error",
        description: err.message || 'Failed to load calendar events from database',
        variant: "destructive",
      })
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return events.filter((event) => event.date === dateStr)
  }

  const openAddDialog = (day?: number) => {
    setEditingEvent(null)
    const defaultDate = day 
      ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      : new Date().toISOString().split('T')[0]
    setFormData({ 
      title: "", 
      date: defaultDate, 
      startTime: "09:00",
      endTime: "10:00",
      type: "exam", 
      description: "",
      classId: "all",
      subjectId: "none",
    })
    setIsOpen(true)
  }

  const openEditDialog = (event: CalendarEvent) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      date: event.date,
      startTime: event.startTime || "09:00",
      endTime: event.endTime || "10:00",
      type: event.type,
      description: event.description || "",
      classId: event.classId || "all",
      subjectId: event.subjectId || "none",
    })
    setIsOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title || !formData.date) {
      return
    }

    try {
      setSaving(true)
      
      if (editingEvent) {
        const res = await fetch(`/api/admin/calendar/events/${editingEvent.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            date: formData.date,
            startTime: formData.type === 'holiday' ? null : formData.startTime,
            endTime: formData.type === 'holiday' ? null : formData.endTime,
            type: formData.type,
            classId: formData.classId === 'all' ? null : formData.classId,
            subjectId: (formData.type === 'exam' && formData.subjectId !== 'none') ? formData.subjectId : null,
            audience: formData.classId === 'all' ? 'ALL' : 'CLASS_ONLY',
          }),
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'Failed to update event')
        }
      } else {
        const res = await fetch('/api/calendar/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            date: formData.date,
            startTime: formData.type === 'holiday' ? null : formData.startTime,
            endTime: formData.type === 'holiday' ? null : formData.endTime,
            type: formData.type,
            classId: formData.classId === 'all' ? null : formData.classId,
            subjectId: (formData.type === 'exam' && formData.subjectId !== 'none') ? formData.subjectId : null,
            audience: formData.classId === 'all' ? 'ALL' : 'CLASS_ONLY',
          }),
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'Failed to create event')
        }
      }

      setIsOpen(false)
      setFormData({ 
        title: "", 
        date: "", 
        startTime: "09:00",
        endTime: "10:00",
        type: "exam", 
        description: "",
        classId: "all",
        subjectId: "none",
      })
      toast({
        title: "Success",
        description: `Event ${editingEvent ? "updated" : "created"} successfully.`,
      })
      fetchEvents()
    } catch (error: any) {
      console.error('Error saving event:', error)
      toast({
        title: "Error",
        description: error.message || 'Failed to save event',
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const openDeleteDialog = (id: string) => {
    setEventToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!eventToDelete) return

    try {
      setDeleting(true)
      const res = await fetch(`/api/admin/calendar/events/${eventToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete event')
      }

      toast({
        title: "Success",
        description: "Event deleted successfully.",
      })
      setDeleteDialogOpen(false)
      setEventToDelete(null)
      fetchEvents()
    } catch (error: any) {
      console.error('Error deleting event:', error)
      toast({
        title: "Error",
        description: error.message || 'Failed to delete event',
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const days = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="p-2 h-24" />)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDay(day)
    const isToday = 
      day === new Date().getDate() &&
      month === new Date().getMonth() &&
      year === new Date().getFullYear()
    
    days.push(
      <div 
        key={day} 
        className={`p-2 h-24 border border-border rounded-md hover:bg-muted/50 transition-colors cursor-pointer relative ${
          isToday ? 'bg-primary/5 border-primary' : ''
        }`}
        onClick={() => openAddDialog(day)}
      >
        <div className="flex items-center justify-between mb-1">
          <span className={`text-sm font-medium ${isToday ? 'text-primary font-bold' : 'text-foreground'}`}>
            {day}
          </span>
          {dayEvents.length > 0 && (
            <span className="text-xs text-muted-foreground">{dayEvents.length}</span>
          )}
        </div>
        <div className="mt-1 space-y-1">
          {dayEvents.slice(0, 2).map((event) => (
            <TooltipProvider key={event.id} delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer flex items-center gap-1 ${getEventTypeColor(event.type)}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      openEditDialog(event)
                    }}
                  >
                    {event.startTime && <span className="opacity-70 font-mono text-[10px]">{event.startTime}</span>}
                    <span className="truncate">{event.title}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-sm font-medium">{event.title}</p>
                  {event.description && event.description.trim() && (
                    <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          {dayEvents.length > 2 && (
            <div className="text-xs text-muted-foreground">+{dayEvents.length - 2} more</div>
          )}
        </div>
      </div>
    )
  }

  const monthEvents = events.filter((event) => {
    const eventDate = new Date(event.date)
    return eventDate.getMonth() === month && eventDate.getFullYear() === year
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Academic Calendar Management</h1>
          <p className="text-muted-foreground mt-1">Manage events and holidays.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openAddDialog()}>
              <Plus className="h-4 w-4 mr-2" /> Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>{editingEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto p-6 pt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter event title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Event Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.type !== 'holiday' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      required={formData.type !== 'holiday'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      required={formData.type !== 'holiday'}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="classId">For Class</Label>
                <Select
                  value={formData.classId}
                  onValueChange={(value) => setFormData({ ...formData, classId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.type === 'exam' && (
                <div className="space-y-2">
                  <Label htmlFor="subjectId">Subject (for Exams)</Label>
                  <Select
                    value={formData.subjectId}
                    onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Specific Subject</SelectItem>
                      {subjects.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter event description"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-2 p-6 pt-2 border-t mt-auto">
              <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1" disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="flex-1" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingEvent ? "Save Changes" : "Add Event"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {MONTHS[month]} {year}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAYS.map((day) => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">{days}</div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Events This Month ({monthEvents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {monthEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events this month.</p>
            ) : (
              <div className="space-y-3">
                {monthEvents.map((event) => (
                  <TooltipProvider key={event.id} delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-start gap-3 py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors rounded-md px-2 -mx-2">
                          <div className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${getEventTypeColor(event.type)}`}>
                            {event.type}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                            <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                              <p className="text-xs text-muted-foreground">{event.date}</p>
                              {event.startTime && (
                                <p className="text-xs text-primary font-medium">
                                  {event.startTime} - {event.endTime}
                                </p>
                              )}
                              {event.className && (
                                <p className="text-xs bg-muted px-1 rounded truncate max-w-[100px]">
                                  {event.className}
                                </p>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                            )}
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditDialog(event)
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                openDeleteDialog(event.id)
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </TooltipTrigger>
                      {event.description && event.description.trim() && (
                        <TooltipContent side="right" className="max-w-xs">
                          <p className="text-sm font-medium">{event.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event from the calendar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
