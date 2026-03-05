export const studentAttendance = [
  { subject: "Mathematics", totalClasses: 30, attended: 27, percentage: 90 },
  { subject: "Physics", totalClasses: 28, attended: 24, percentage: 86 },
  { subject: "Chemistry", totalClasses: 25, attended: 22, percentage: 88 },
  { subject: "English", totalClasses: 20, attended: 18, percentage: 90 },
  { subject: "Computer Science", totalClasses: 22, attended: 20, percentage: 91 },
]

export const studentGrades = [
  { subject: "Mathematics", exam: "Midterm", marks: 85, grade: "A" },
  { subject: "Physics", exam: "Midterm", marks: 78, grade: "B+" },
  { subject: "Chemistry", exam: "Midterm", marks: 82, grade: "A-" },
  { subject: "English", exam: "Midterm", marks: 88, grade: "A" },
  { subject: "Computer Science", exam: "Quiz 1", marks: 92, grade: "A+" },
]

export const availableExams = [
  { id: 1, name: "Mathematics Final", subject: "Mathematics", date: "2026-02-15", duration: "2 hours" },
  { id: 2, name: "Physics Quiz 2", subject: "Physics", date: "2026-02-18", duration: "1 hour" },
  { id: 3, name: "Chemistry Lab Test", subject: "Chemistry", date: "2026-02-20", duration: "1.5 hours" },
]

export const examQuestions = [
  {
    id: 1,
    question: "What is the derivative of x^2?",
    options: ["x", "2x", "x^2", "2"],
    correct: 1,
  },
  {
    id: 2,
    question: "What is the value of pi (approximately)?",
    options: ["3.14", "2.71", "1.41", "1.73"],
    correct: 0,
  },
  {
    id: 3,
    question: "What is the quadratic formula used for?",
    options: ["Finding roots of linear equations", "Finding roots of quadratic equations", "Finding derivatives", "Finding integrals"],
    correct: 1,
  },
  {
    id: 4,
    question: "What is 15% of 200?",
    options: ["15", "20", "30", "35"],
    correct: 2,
  },
  {
    id: 5,
    question: "Simplify: 3x + 2x",
    options: ["5x", "6x", "5x^2", "6x^2"],
    correct: 0,
  },
]

export const calendarEvents = [
  { id: 1, title: "Mathematics Final Exam", date: "2026-02-15", type: "exam" },
  { id: 2, title: "Physics Quiz", date: "2026-02-18", type: "exam" },
  { id: 3, title: "Spring Break", date: "2026-02-25", type: "holiday" },
  { id: 4, title: "Project Submission", date: "2026-02-28", type: "deadline" },
  { id: 5, title: "Chemistry Lab Test", date: "2026-02-20", type: "exam" },
  { id: 6, title: "National Holiday", date: "2026-02-10", type: "holiday" },
]

export const chatMessages = [
  { id: 1, sender: "teacher", text: "Hello! How can I help you today?", time: "10:30 AM" },
  { id: 2, sender: "student", text: "I have a question about the homework assignment.", time: "10:32 AM" },
  { id: 3, sender: "teacher", text: "Sure, what would you like to know?", time: "10:33 AM" },
]

export const classStudents = [
  { id: 1, name: "John Smith", rollNo: "CS001" },
  { id: 2, name: "Emma Wilson", rollNo: "CS002" },
  { id: 3, name: "Michael Brown", rollNo: "CS003" },
  { id: 4, name: "Sarah Davis", rollNo: "CS004" },
  { id: 5, name: "James Johnson", rollNo: "CS005" },
  { id: 6, name: "Emily Taylor", rollNo: "CS006" },
  { id: 7, name: "Daniel Martinez", rollNo: "CS007" },
  { id: 8, name: "Olivia Anderson", rollNo: "CS008" },
]

export const teacherExams = [
  { id: 1, name: "Mathematics Midterm", subject: "Mathematics", questions: 20, date: "2026-02-10" },
  { id: 2, name: "Mathematics Final", subject: "Mathematics", questions: 30, date: "2026-02-15" },
]

export const studentSubmissions = [
  { id: 1, studentName: "John Smith", exam: "Mathematics Midterm", marks: 85, maxMarks: 100 },
  { id: 2, studentName: "Emma Wilson", exam: "Mathematics Midterm", marks: 92, maxMarks: 100 },
  { id: 3, studentName: "Michael Brown", exam: "Mathematics Midterm", marks: 78, maxMarks: 100 },
  { id: 4, studentName: "Sarah Davis", exam: "Mathematics Midterm", marks: 88, maxMarks: 100 },
  { id: 5, studentName: "James Johnson", exam: "Mathematics Midterm", marks: null, maxMarks: 100 },
]

export const subjects = ["Mathematics", "Physics", "Chemistry", "English", "Computer Science"]
export const classes = ["Class 10-A", "Class 10-B", "Class 11-A", "Class 11-B", "Class 12-A"]

export const allUsers = [
  { id: 1, name: "John Smith", email: "john@college.edu", role: "student", status: "active" },
  { id: 2, name: "Emma Wilson", email: "emma@college.edu", role: "student", status: "active" },
  { id: 3, name: "Dr. Robert Lee", email: "robert@college.edu", role: "teacher", status: "active" },
  { id: 4, name: "Prof. Sarah Adams", email: "sarah@college.edu", role: "teacher", status: "active" },
  { id: 5, name: "Michael Brown", email: "michael@college.edu", role: "student", status: "inactive" },
  { id: 6, name: "Admin User", email: "admin@college.edu", role: "admin", status: "active" },
]

export const adminStats = {
  totalStudents: 245,
  totalTeachers: 32,
  activeUsers: 270,
}
