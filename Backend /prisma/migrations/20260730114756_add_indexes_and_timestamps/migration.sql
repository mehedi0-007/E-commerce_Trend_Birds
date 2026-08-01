/*
  Warnings:

  - Added the required column `updatedAt` to the `ProductMediaAttachment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProductCategory" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ProductMediaAttachment" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ProductVariantAttribute" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "RolePermission" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Brand_logoId_idx" ON "Brand"("logoId");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE INDEX "Category_imageId_idx" ON "Category"("imageId");

-- CreateIndex
CREATE INDEX "Permission_groupId_idx" ON "Permission"("groupId");

-- CreateIndex
CREATE INDEX "Product_brandId_idx" ON "Product"("brandId");

-- CreateIndex
CREATE INDEX "ProductMediaAttachment_productId_idx" ON "ProductMediaAttachment"("productId");

-- CreateIndex
CREATE INDEX "ProductMediaAttachment_variantId_idx" ON "ProductMediaAttachment"("variantId");

-- CreateIndex
CREATE INDEX "ProductMediaAttachment_mediaId_idx" ON "ProductMediaAttachment"("mediaId");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE INDEX "User_roleId_idx" ON "User"("roleId");
