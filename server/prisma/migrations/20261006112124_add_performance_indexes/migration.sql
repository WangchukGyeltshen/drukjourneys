-- CreateIndex
CREATE INDEX "bookings_userId_createdAt_idx" ON "bookings"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "bookings_packageId_idx" ON "bookings"("packageId");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "documents_userId_uploadedAt_idx" ON "documents"("userId", "uploadedAt");

-- CreateIndex
CREATE INDEX "documents_status_uploadedAt_idx" ON "documents"("status", "uploadedAt");

-- CreateIndex
CREATE INDEX "guide_assignments_guideId_idx" ON "guide_assignments"("guideId");

-- CreateIndex
CREATE INDEX "guide_assignments_vehicleId_idx" ON "guide_assignments"("vehicleId");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "packages_isActive_createdAt_idx" ON "packages"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "packages_dzongkhag_idx" ON "packages"("dzongkhag");

-- CreateIndex
CREATE INDEX "packages_category_idx" ON "packages"("category");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "reviews_userId_idx" ON "reviews"("userId");

-- CreateIndex
CREATE INDEX "support_inquiries_createdAt_idx" ON "support_inquiries"("createdAt");
