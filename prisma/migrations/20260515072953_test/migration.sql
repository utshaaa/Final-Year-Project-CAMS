/*
  Warnings:

  - You are about to drop the column `section` on the `class` table. All the data in the column will be lost.
  - You are about to drop the column `section` on the `studentprofile` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studentId]` on the table `enrollment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `answer` DROP FOREIGN KEY `Answer_questionId_fkey`;

-- DropForeignKey
ALTER TABLE `answer` DROP FOREIGN KEY `Answer_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `attendancerecord` DROP FOREIGN KEY `AttendanceRecord_classId_fkey`;

-- DropForeignKey
ALTER TABLE `attendancerecord` DROP FOREIGN KEY `AttendanceRecord_markedByTeacherId_fkey`;

-- DropForeignKey
ALTER TABLE `attendancerecord` DROP FOREIGN KEY `AttendanceRecord_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `calendarevent` DROP FOREIGN KEY `CalendarEvent_classId_fkey`;

-- DropForeignKey
ALTER TABLE `classsubject` DROP FOREIGN KEY `ClassSubject_classId_fkey`;

-- DropForeignKey
ALTER TABLE `classsubject` DROP FOREIGN KEY `ClassSubject_subjectId_fkey`;

-- DropForeignKey
ALTER TABLE `classsubject` DROP FOREIGN KEY `ClassSubject_teacherId_fkey`;

-- DropForeignKey
ALTER TABLE `enrollment` DROP FOREIGN KEY `Enrollment_classId_fkey`;

-- DropForeignKey
ALTER TABLE `enrollment` DROP FOREIGN KEY `Enrollment_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `exam` DROP FOREIGN KEY `Exam_classId_fkey`;

-- DropForeignKey
ALTER TABLE `exam` DROP FOREIGN KEY `Exam_createdByTeacherId_fkey`;

-- DropForeignKey
ALTER TABLE `exam` DROP FOREIGN KEY `Exam_subjectId_fkey`;

-- DropForeignKey
ALTER TABLE `grade` DROP FOREIGN KEY `Grade_examId_fkey`;

-- DropForeignKey
ALTER TABLE `grade` DROP FOREIGN KEY `Grade_gradedByTeacherId_fkey`;

-- DropForeignKey
ALTER TABLE `grade` DROP FOREIGN KEY `Grade_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `question` DROP FOREIGN KEY `Question_examId_fkey`;

-- DropForeignKey
ALTER TABLE `studentprofile` DROP FOREIGN KEY `StudentProfile_userId_fkey`;

-- DropForeignKey
ALTER TABLE `teacherprofile` DROP FOREIGN KEY `TeacherProfile_userId_fkey`;

-- DropForeignKey
ALTER TABLE `todoitem` DROP FOREIGN KEY `TodoItem_userId_fkey`;

-- DropIndex
DROP INDEX `Enrollment_studentId_classId_key` ON `enrollment`;

-- AlterTable
ALTER TABLE `attendancerecord` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `calendarevent` ADD COLUMN `subjectId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `class` DROP COLUMN `section`;

-- AlterTable
ALTER TABLE `studentprofile` DROP COLUMN `section`;

-- CreateTable
CREATE TABLE `message` (
    `id` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `receiverId` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `readAt` DATETIME(3) NULL,

    INDEX `message_senderId_idx`(`senderId`),
    INDEX `message_receiverId_idx`(`receiverId`),
    INDEX `message_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `calendarevent_subjectId_idx` ON `calendarevent`(`subjectId`);

-- CreateIndex
CREATE UNIQUE INDEX `enrollment_studentId_key` ON `enrollment`(`studentId`);

-- AddForeignKey
ALTER TABLE `studentprofile` ADD CONSTRAINT `studentprofile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacherprofile` ADD CONSTRAINT `teacherprofile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classsubject` ADD CONSTRAINT `classsubject_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classsubject` ADD CONSTRAINT `classsubject_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classsubject` ADD CONSTRAINT `classsubject_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `teacherprofile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollment` ADD CONSTRAINT `enrollment_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollment` ADD CONSTRAINT `enrollment_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `studentprofile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam` ADD CONSTRAINT `exam_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam` ADD CONSTRAINT `exam_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam` ADD CONSTRAINT `exam_createdByTeacherId_fkey` FOREIGN KEY (`createdByTeacherId`) REFERENCES `teacherprofile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question` ADD CONSTRAINT `question_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exam`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `answer` ADD CONSTRAINT `answer_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `answer` ADD CONSTRAINT `answer_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `studentprofile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grade` ADD CONSTRAINT `grade_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exam`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grade` ADD CONSTRAINT `grade_gradedByTeacherId_fkey` FOREIGN KEY (`gradedByTeacherId`) REFERENCES `teacherprofile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grade` ADD CONSTRAINT `grade_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `studentprofile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendancerecord` ADD CONSTRAINT `attendancerecord_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendancerecord` ADD CONSTRAINT `attendancerecord_markedByTeacherId_fkey` FOREIGN KEY (`markedByTeacherId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendancerecord` ADD CONSTRAINT `attendancerecord_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `studentprofile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calendarevent` ADD CONSTRAINT `calendarevent_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calendarevent` ADD CONSTRAINT `calendarevent_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `todoitem` ADD CONSTRAINT `todoitem_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message` ADD CONSTRAINT `message_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message` ADD CONSTRAINT `message_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RedefineIndex
CREATE INDEX `answer_questionId_idx` ON `answer`(`questionId`);
DROP INDEX `Answer_questionId_idx` ON `answer`;

-- RedefineIndex
CREATE UNIQUE INDEX `answer_questionId_studentId_key` ON `answer`(`questionId`, `studentId`);
DROP INDEX `Answer_questionId_studentId_key` ON `answer`;

-- RedefineIndex
CREATE INDEX `answer_studentId_idx` ON `answer`(`studentId`);
DROP INDEX `Answer_studentId_idx` ON `answer`;

-- RedefineIndex
CREATE INDEX `attendancerecord_classId_date_idx` ON `attendancerecord`(`classId`, `date`);
DROP INDEX `AttendanceRecord_classId_date_idx` ON `attendancerecord`;

-- RedefineIndex
CREATE INDEX `attendancerecord_date_idx` ON `attendancerecord`(`date`);
DROP INDEX `AttendanceRecord_date_idx` ON `attendancerecord`;

-- RedefineIndex
CREATE INDEX `attendancerecord_markedByTeacherId_idx` ON `attendancerecord`(`markedByTeacherId`);
DROP INDEX `AttendanceRecord_markedByTeacherId_fkey` ON `attendancerecord`;

-- RedefineIndex
CREATE UNIQUE INDEX `attendancerecord_studentId_classId_date_key` ON `attendancerecord`(`studentId`, `classId`, `date`);
DROP INDEX `AttendanceRecord_studentId_classId_date_key` ON `attendancerecord`;

-- RedefineIndex
CREATE INDEX `attendancerecord_studentId_idx` ON `attendancerecord`(`studentId`);
DROP INDEX `AttendanceRecord_studentId_idx` ON `attendancerecord`;

-- RedefineIndex
CREATE INDEX `calendarevent_classId_idx` ON `calendarevent`(`classId`);
DROP INDEX `CalendarEvent_classId_idx` ON `calendarevent`;

-- RedefineIndex
CREATE INDEX `calendarevent_startAt_idx` ON `calendarevent`(`startAt`);
DROP INDEX `CalendarEvent_startAt_idx` ON `calendarevent`;

-- RedefineIndex
CREATE INDEX `calendarevent_type_idx` ON `calendarevent`(`type`);
DROP INDEX `CalendarEvent_type_idx` ON `calendarevent`;

-- RedefineIndex
CREATE INDEX `class_name_idx` ON `class`(`name`);
DROP INDEX `Class_name_idx` ON `class`;

-- RedefineIndex
CREATE UNIQUE INDEX `class_name_key` ON `class`(`name`);
DROP INDEX `Class_name_key` ON `class`;

-- RedefineIndex
CREATE INDEX `classsubject_classId_idx` ON `classsubject`(`classId`);
DROP INDEX `ClassSubject_classId_idx` ON `classsubject`;

-- RedefineIndex
CREATE UNIQUE INDEX `classsubject_classId_subjectId_key` ON `classsubject`(`classId`, `subjectId`);
DROP INDEX `ClassSubject_classId_subjectId_key` ON `classsubject`;

-- RedefineIndex
CREATE INDEX `classsubject_subjectId_idx` ON `classsubject`(`subjectId`);
DROP INDEX `ClassSubject_subjectId_idx` ON `classsubject`;

-- RedefineIndex
CREATE INDEX `classsubject_teacherId_idx` ON `classsubject`(`teacherId`);
DROP INDEX `ClassSubject_teacherId_idx` ON `classsubject`;

-- RedefineIndex
CREATE INDEX `enrollment_classId_idx` ON `enrollment`(`classId`);
DROP INDEX `Enrollment_classId_idx` ON `enrollment`;

-- RedefineIndex
CREATE INDEX `enrollment_studentId_idx` ON `enrollment`(`studentId`);
DROP INDEX `Enrollment_studentId_idx` ON `enrollment`;

-- RedefineIndex
CREATE INDEX `exam_archived_idx` ON `exam`(`archived`);
DROP INDEX `Exam_archived_idx` ON `exam`;

-- RedefineIndex
CREATE INDEX `exam_classId_idx` ON `exam`(`classId`);
DROP INDEX `Exam_classId_idx` ON `exam`;

-- RedefineIndex
CREATE INDEX `exam_createdByTeacherId_idx` ON `exam`(`createdByTeacherId`);
DROP INDEX `Exam_createdByTeacherId_idx` ON `exam`;

-- RedefineIndex
CREATE INDEX `exam_scheduledAt_idx` ON `exam`(`scheduledAt`);
DROP INDEX `Exam_scheduledAt_idx` ON `exam`;

-- RedefineIndex
CREATE INDEX `exam_subjectId_idx` ON `exam`(`subjectId`);
DROP INDEX `Exam_subjectId_idx` ON `exam`;

-- RedefineIndex
CREATE INDEX `grade_examId_idx` ON `grade`(`examId`);
DROP INDEX `Grade_examId_idx` ON `grade`;

-- RedefineIndex
CREATE INDEX `grade_gradedByTeacherId_idx` ON `grade`(`gradedByTeacherId`);
DROP INDEX `Grade_gradedByTeacherId_idx` ON `grade`;

-- RedefineIndex
CREATE UNIQUE INDEX `grade_studentId_examId_key` ON `grade`(`studentId`, `examId`);
DROP INDEX `Grade_studentId_examId_key` ON `grade`;

-- RedefineIndex
CREATE INDEX `grade_studentId_idx` ON `grade`(`studentId`);
DROP INDEX `Grade_studentId_idx` ON `grade`;

-- RedefineIndex
CREATE INDEX `question_examId_idx` ON `question`(`examId`);
DROP INDEX `Question_examId_idx` ON `question`;

-- RedefineIndex
CREATE INDEX `question_order_idx` ON `question`(`order`);
DROP INDEX `Question_order_idx` ON `question`;

-- RedefineIndex
CREATE INDEX `studentprofile_rollNo_idx` ON `studentprofile`(`rollNo`);
DROP INDEX `StudentProfile_rollNo_idx` ON `studentprofile`;

-- RedefineIndex
CREATE INDEX `studentprofile_userId_idx` ON `studentprofile`(`userId`);
DROP INDEX `StudentProfile_userId_idx` ON `studentprofile`;

-- RedefineIndex
CREATE UNIQUE INDEX `studentprofile_userId_key` ON `studentprofile`(`userId`);
DROP INDEX `StudentProfile_userId_key` ON `studentprofile`;

-- RedefineIndex
CREATE UNIQUE INDEX `subject_code_key` ON `subject`(`code`);
DROP INDEX `Subject_code_key` ON `subject`;

-- RedefineIndex
CREATE INDEX `subject_name_idx` ON `subject`(`name`);
DROP INDEX `Subject_name_idx` ON `subject`;

-- RedefineIndex
CREATE UNIQUE INDEX `subject_name_key` ON `subject`(`name`);
DROP INDEX `Subject_name_key` ON `subject`;

-- RedefineIndex
CREATE INDEX `teacherprofile_userId_idx` ON `teacherprofile`(`userId`);
DROP INDEX `TeacherProfile_userId_idx` ON `teacherprofile`;

-- RedefineIndex
CREATE UNIQUE INDEX `teacherprofile_userId_key` ON `teacherprofile`(`userId`);
DROP INDEX `TeacherProfile_userId_key` ON `teacherprofile`;

-- RedefineIndex
CREATE INDEX `todoitem_isCompleted_idx` ON `todoitem`(`isCompleted`);
DROP INDEX `TodoItem_isCompleted_idx` ON `todoitem`;

-- RedefineIndex
CREATE INDEX `todoitem_userId_idx` ON `todoitem`(`userId`);
DROP INDEX `TodoItem_userId_idx` ON `todoitem`;

-- RedefineIndex
CREATE INDEX `user_email_idx` ON `user`(`email`);
DROP INDEX `User_email_idx` ON `user`;

-- RedefineIndex
CREATE UNIQUE INDEX `user_email_key` ON `user`(`email`);
DROP INDEX `User_email_key` ON `user`;

-- RedefineIndex
CREATE INDEX `user_role_idx` ON `user`(`role`);
DROP INDEX `User_role_idx` ON `user`;
