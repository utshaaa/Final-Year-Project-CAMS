import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

function generateId(): string {
  return randomBytes(16).toString('hex')
}

async function main() {
  const adminPasswordHash = await bcrypt.hash('admin123', 10)
  const teacherPasswordHash = await bcrypt.hash('teacher123', 10)
  const studentPasswordHash = await bcrypt.hash('student123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cams.com' },
    update: {
      name: 'Admin User',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
    create: {
      id: generateId(),
      name: 'Admin User',
      email: 'admin@cams.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  })

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@cams.com' },
    update: {
      name: 'Dr. Robert Lee',
      passwordHash: teacherPasswordHash,
      role: 'TEACHER',
      teacherProfile: {
        upsert: {
          create: {
            id: generateId(),
            department: 'Mathematics',
          },
          update: {
            department: 'Mathematics',
          },
        },
      },
    },
    create: {
      id: generateId(),
      name: 'Dr. Robert Lee',
      email: 'teacher@cams.com',
      passwordHash: teacherPasswordHash,
      role: 'TEACHER',
      teacherProfile: {
        create: {
          id: generateId(),
          department: 'Mathematics',
        },
      },
    },
    include: {
      teacherProfile: true,
    },
  })

  const student = await prisma.user.upsert({
    where: { email: 'student@cams.com' },
    update: {
      name: 'John Smith',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
      studentProfile: {
        upsert: {
          create: {
            id: generateId(),
            rollNo: 'CS001',
            class: 'Grade 10',
          },
          update: {
            rollNo: 'CS001',
            class: 'Grade 10',
          },
        },
      },
    },
    create: {
      id: generateId(),
      name: 'John Smith',
      email: 'student@cams.com',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
      studentProfile: {
        create: {
          id: generateId(),
          rollNo: 'CS001',
          class: 'Grade 10',
        },
      },
    },
    include: {
      studentProfile: true,
    },
  })

  const classRecord = await prisma.class.upsert({
    where: { name: 'Grade 10' },
    update: {},
    create: {
      id: generateId(),
      name: 'Grade 10',
    },
  })

  const subject = await prisma.subject.upsert({
    where: { name: 'Mathematics' },
    update: {
      code: 'MATH101',
    },
    create: {
      id: generateId(),
      name: 'Mathematics',
      code: 'MATH101',
    },
  })

  const teacherProfile =
    teacher.teacherProfile ??
    (await prisma.teacherProfile.findUnique({ where: { userId: teacher.id } }))

  const studentProfile =
    student.studentProfile ??
    (await prisma.studentProfile.findUnique({ where: { userId: student.id } }))

  if (!teacherProfile || !studentProfile) {
    throw new Error('Failed to create required teacher/student profiles')
  }

  await prisma.classSubject.upsert({
    where: {
      classId_subjectId: {
        classId: classRecord.id,
        subjectId: subject.id,
      },
    },
    update: {
      teacherId: teacherProfile.id,
    },
    create: {
      id: generateId(),
      classId: classRecord.id,
      subjectId: subject.id,
      teacherId: teacherProfile.id,
    },
  })

  await prisma.enrollment.upsert({
    where: {
      studentId: studentProfile.id,
    },
    update: {
      classId: classRecord.id,
    },
    create: {
      id: generateId(),
      studentId: studentProfile.id,
      classId: classRecord.id,
    },
  })

  console.log('Login credentials seeded:')
  console.log('Admin: admin@cams.com / admin123')
  console.log('Teacher: teacher@cams.com / teacher123')
  console.log('Student: student@cams.com / student123')
}

main()
  .catch((error) => {
    console.error('Failed to seed login credentials:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
