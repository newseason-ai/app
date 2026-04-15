/*
  Warnings:

  - You are about to drop the column `userId` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `templateId` on the `link_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `templates` table. All the data in the column will be lost.
  - Added the required column `user_id` to the `companies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `template_id` to the `link_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_id` to the `templates` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "link_tokens" DROP CONSTRAINT "link_tokens_templateId_fkey";

-- DropForeignKey
ALTER TABLE "templates" DROP CONSTRAINT "templates_companyId_fkey";

-- DropIndex
DROP INDEX "link_tokens_templateId_idx";

-- DropIndex
DROP INDEX "templates_companyId_idx";

-- AlterTable
ALTER TABLE "companies" DROP COLUMN "userId",
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "link_tokens" DROP COLUMN "templateId",
ADD COLUMN     "template_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "templates" DROP COLUMN "companyId",
ADD COLUMN     "company_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "link_tokens_template_id_idx" ON "link_tokens"("template_id");

-- CreateIndex
CREATE INDEX "templates_company_id_idx" ON "templates"("company_id");

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "link_tokens" ADD CONSTRAINT "link_tokens_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
