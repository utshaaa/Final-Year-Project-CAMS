import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

function generateId(): string {
  return randomBytes(16).toString('hex')
}

async function main() {
  console.log('🌱 Starting seed...')

  await prisma.grade.deleteMany()
  await prisma.exam.deleteMany()
  await prisma.attendanceRecord.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.classSubject.deleteMany()
  await prisma.calendarEvent.deleteMany()
  await prisma.todoItem.deleteMany()
  await prisma.message.deleteMany()
  await prisma.studentProfile.deleteMany()
  await prisma.teacherProfile.deleteMany()
  await prisma.subject.deleteMany()
  await prisma.class.deleteMany()
  await prisma.user.deleteMany()

  const adminPasswordHash = await bcrypt.hash('admin123', 10)
  const teacherPasswordHash = await bcrypt.hash('teacher123', 10)
  const studentPasswordHash = await bcrypt.hash('student123', 10)

  const admin = await prisma.user.create({
    data: {
      id: generateId(),
      name: 'Admin User',
      email: 'admin@cams.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      updatedAt: new Date(),
    },
  })

  const teacher = await prisma.user.create({
    data: {
      id: generateId(),
      name: 'Dr. Robert Lee',
      email: 'teacher@cams.com',
      passwordHash: teacherPasswordHash,
      role: 'TEACHER',
      updatedAt: new Date(),
      teacherProfile: {
        create: {
          id: generateId(),
          department: 'Mathematics',
        },
      },
    },
  })

  const student1 = await prisma.user.create({
    data: {
      id: generateId(),
      name: 'John Smith',
      email: 'student@cams.com',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
      updatedAt: new Date(),
      studentProfile: {
        create: {
          id: generateId(),
          rollNo: 'CS001',
          class: 'Class 10-A',
        },
      },
    },
  })

  const student2 = await prisma.user.create({
    data: {
      id: generateId(),
      name: 'Emma Wilson',
      email: 'emma@cams.com',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
      updatedAt: new Date(),
      studentProfile: {
        create: {
          id: generateId(),
          rollNo: 'CS002',
          class: 'Grade 10',
        },
      },
    },
  })

  const student3 = await prisma.user.create({
    data: {
      id: generateId(),
      name: 'Michael Brown',
      email: 'michael@cams.com',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
      updatedAt: new Date(),
      studentProfile: {
        create: {
          id: generateId(),
          rollNo: 'CS003',
          class: 'Grade 10',
        },
      },
    },
  })

  const class1 = await prisma.class.create({
    data: {
      id: generateId(),
      name: 'Grade 10',
    },
  })

  const class2 = await prisma.class.create({
    data: {
      id: generateId(),
      name: 'Grade 11',
    },
  })

  const mathSubject = await prisma.subject.create({
    data: {
      id: generateId(),
      name: 'Mathematics',
      code: 'MATH101',
    },
  })

  const physicsSubject = await prisma.subject.create({
    data: {
      id: generateId(),
      name: 'Physics',
      code: 'PHY101',
    },
  })

  const student1Profile = await prisma.studentProfile.findUnique({
    where: { userId: student1.id },
  })

  const student2Profile = await prisma.studentProfile.findUnique({
    where: { userId: student2.id },
  })

  const student3Profile = await prisma.studentProfile.findUnique({
    where: { userId: student3.id },
  })

  if (!student1Profile || !student2Profile || !student3Profile) {
    throw new Error('Student profiles not found')
  }

  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: teacher.id },
  })

  if (!teacherProfile) {
    throw new Error('Teacher profile not found')
  }

  await prisma.classSubject.create({
    data: {
      id: generateId(),
      classId: class1.id,
      subjectId: mathSubject.id,
      teacherId: teacherProfile.id,
    },
  })

  await prisma.enrollment.create({
    data: {
      id: generateId(),
      studentId: student1Profile.id,
      classId: class1.id,
    },
  })

  await prisma.enrollment.create({
    data: {
      id: generateId(),
      studentId: student2Profile.id,
      classId: class1.id,
    },
  })

  await prisma.enrollment.create({
    data: {
      id: generateId(),
      studentId: student3Profile.id,
      classId: class1.id,
    },
  })

  const mathExam = await prisma.exam.create({
    data: {
      id: generateId(),
      classId: class1.id,
      subjectId: mathSubject.id,
      title: 'Mathematics Midterm',
      examType: 'ONLINE',
      scheduledAt: new Date('2026-03-15T10:00:00Z'),
      totalMarks: 100,
      duration: '2 hours',
      createdByTeacherId: teacherProfile.id,
    },
  })

  await prisma.grade.create({
    data: {
      id: generateId(),
      studentId: student1Profile.id,
      examId: mathExam.id,
      marksObtained: 85,
      gradeLetter: 'A',
      remarks: 'Good performance',
      gradedByTeacherId: teacherProfile.id,
    },
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await prisma.attendanceRecord.create({
    data: {
      id: generateId(),
      studentId: student1Profile.id,
      classId: class1.id,
      date: today,
      status: 'PRESENT',
      markedByTeacherId: teacher.id,
    },
  })

  await prisma.attendanceRecord.create({
    data: {
      id: generateId(),
      studentId: student2Profile.id,
      classId: class1.id,
      date: today,
      status: 'PRESENT',
      markedByTeacherId: teacher.id,
    },
  })

  await prisma.attendanceRecord.create({
    data: {
      id: generateId(),
      studentId: student3Profile.id,
      classId: class1.id,
      date: today,
      status: 'LATE',
      markedByTeacherId: teacher.id,
    },
  })

  await prisma.calendarEvent.create({
    data: {
      id: generateId(),
      title: 'Mathematics Midterm Exam',
      description: 'Midterm examination for Grade 10 Mathematics',
      startAt: new Date('2026-03-15T10:00:00Z'),
      endAt: new Date('2026-03-15T12:00:00Z'),
      type: 'exam',
      audience: 'CLASS_ONLY',
      classId: class1.id,
    },
  })

  await prisma.calendarEvent.create({
    data: {
      id: generateId(),
      title: 'Spring Break',
      description: 'Week-long break for students and faculty',
      startAt: new Date('2026-03-25T00:00:00Z'),
      endAt: new Date('2026-04-01T23:59:59Z'),
      type: 'holiday',
      audience: 'ALL',
    },
  })

  await prisma.todoItem.create({
    data: {
      id: generateId(),
      userId: student1.id,
      title: 'Complete Math homework',
      isCompleted: false,
      updatedAt: new Date(),
    },
  })

  await prisma.todoItem.create({
    data: {
      id: generateId(),
      userId: student1.id,
      title: 'Study for Physics quiz',
      isCompleted: false,
      updatedAt: new Date(),
    },
  })

  await prisma.todoItem.create({
    data: {
      id: generateId(),
      userId: student1.id,
      title: 'Submit Chemistry lab report',
      isCompleted: true,
      completedAt: new Date(),
      updatedAt: new Date(),
    },
  })

  await prisma.todoItem.create({
    data: {
      id: generateId(),
      userId: student1.id,
      title: 'Read Chapter 5 for English',
      isCompleted: false,
      updatedAt: new Date(),
    },
  })

  console.log('✅ Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
