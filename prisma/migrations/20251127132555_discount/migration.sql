-- CreateTable
CREATE TABLE `publicAnnouncement` (
    `id` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `photo` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PeriodicDiscount` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `type` ENUM('PERCENT', 'AMOUNT') NOT NULL DEFAULT 'PERCENT',
    `value` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `frequency` ENUM('NONE', 'DAILY', 'WEEKLY', 'MONTHLY') NOT NULL DEFAULT 'NONE',
    `daysOfWeek` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
