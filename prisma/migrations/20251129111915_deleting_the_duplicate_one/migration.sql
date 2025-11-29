/*
  Warnings:

  - You are about to drop the column `currency` on the `periodicdiscount` table. All the data in the column will be lost.
  - You are about to drop the column `daysOfWeek` on the `periodicdiscount` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `periodicdiscount` table. All the data in the column will be lost.
  - You are about to drop the column `frequency` on the `periodicdiscount` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `periodicdiscount` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `periodicdiscount` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `periodicdiscount` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `periodicdiscount` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `periodicdiscount` table. All the data in the column will be lost.
  - Added the required column `courseId` to the `periodicDiscount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discountRate` to the `periodicDiscount` table without a default value. This is not possible if the table is not empty.
  - Made the column `endDate` on table `periodicdiscount` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `periodicdiscount` DROP COLUMN `currency`,
    DROP COLUMN `daysOfWeek`,
    DROP COLUMN `description`,
    DROP COLUMN `frequency`,
    DROP COLUMN `isActive`,
    DROP COLUMN `title`,
    DROP COLUMN `type`,
    DROP COLUMN `updatedAt`,
    DROP COLUMN `value`,
    ADD COLUMN `courseId` VARCHAR(191) NOT NULL,
    ADD COLUMN `discountRate` INTEGER NOT NULL,
    MODIFY `endDate` DATETIME(3) NOT NULL;

-- AddForeignKey
ALTER TABLE `periodicDiscount` ADD CONSTRAINT `periodicDiscount_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
