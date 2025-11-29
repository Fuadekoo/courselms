-- AlterTable
ALTER TABLE `order` MODIFY `paymentType` ENUM('chapa', 'stripe', 'free') NOT NULL;
