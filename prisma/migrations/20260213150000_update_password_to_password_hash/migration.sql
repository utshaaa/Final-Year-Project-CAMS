ALTER TABLE `User` ADD COLUMN `passwordHash` VARCHAR(191) NULL;

UPDATE `User` SET `passwordHash` = `password` WHERE `password` IS NOT NULL;

ALTER TABLE `User` MODIFY COLUMN `passwordHash` VARCHAR(191) NOT NULL;

ALTER TABLE `User` DROP COLUMN `password`;
