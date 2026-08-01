-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "height" INTEGER,
ADD COLUMN     "type" TEXT,
ADD COLUMN     "uploadedById" TEXT,
ADD COLUMN     "width" INTEGER;

-- AlterTable
ALTER TABLE "ProductMediaAttachment" ADD COLUMN     "attributeValueId" TEXT;

-- CreateIndex
CREATE INDEX "Media_uploadedById_idx" ON "Media"("uploadedById");

-- CreateIndex
CREATE INDEX "ProductMediaAttachment_attributeValueId_idx" ON "ProductMediaAttachment"("attributeValueId");

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMediaAttachment" ADD CONSTRAINT "ProductMediaAttachment_attributeValueId_fkey" FOREIGN KEY ("attributeValueId") REFERENCES "AttributeValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
