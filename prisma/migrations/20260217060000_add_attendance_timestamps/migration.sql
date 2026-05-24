SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'AttendanceRecord'
    AND COLUMN_NAME = 'createdAt');

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `AttendanceRecord` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)',
    'SELECT "Column createdAt already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'AttendanceRecord'
    AND COLUMN_NAME = 'updatedAt');

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `AttendanceRecord` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)',
    'SELECT "Column updatedAt already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'AttendanceRecord'
    AND INDEX_NAME = 'AttendanceRecord_classId_date_idx');

SET @sql = IF(@index_exists = 0,
    'CREATE INDEX `AttendanceRecord_classId_date_idx` ON `AttendanceRecord`(`classId`, `date`)',
    'SELECT "Index AttendanceRecord_classId_date_idx already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
