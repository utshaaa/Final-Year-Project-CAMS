CREATE TABLE IF NOT EXISTS `_QuestionType` (
    `id` INT NOT NULL AUTO_INCREMENT,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `_QuestionType`;

CREATE TABLE IF NOT EXISTS `Question` (
    `id` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `questionText` VARCHAR(191) NOT NULL,
    `questionType` ENUM('MCQ', 'TRUE_FALSE', 'SHORT_ANSWER', 'LONG_ANSWER') NOT NULL,
    `options` TEXT NULL,
    `correctAnswer` VARCHAR(191) NULL,
    `marks` INTEGER NOT NULL DEFAULT 1,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Question_examId_idx`(`examId`),
    INDEX `Question_order_idx`(`order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Answer` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `answerText` TEXT NOT NULL,
    `isCorrect` BOOLEAN NULL,
    `marksObtained` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Answer_questionId_idx`(`questionId`),
    INDEX `Answer_studentId_idx`(`studentId`),
    UNIQUE INDEX `Answer_questionId_studentId_key`(`questionId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Question` ADD CONSTRAINT `Question_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `Exam`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Answer` ADD CONSTRAINT `Answer_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Answer` ADD CONSTRAINT `Answer_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `StudentProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
