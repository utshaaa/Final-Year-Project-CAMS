ALTER TABLE `Exam` ADD COLUMN `archived` BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX `Exam_archived_idx` ON `Exam`(`archived`);
