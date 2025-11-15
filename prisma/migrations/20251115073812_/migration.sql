-- CreateTable
CREATE TABLE "books" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "isbn" TEXT NOT NULL,
    "publishedYear" INTEGER NOT NULL,
    "availabilityStatus" TEXT NOT NULL DEFAULT 'Available',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlists" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "bookId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "books_isbn_key" ON "books"("isbn");

-- CreateIndex
CREATE INDEX "books_author_idx" ON "books"("author");

-- CreateIndex
CREATE INDEX "books_publishedYear_idx" ON "books"("publishedYear");

-- CreateIndex
CREATE INDEX "books_availabilityStatus_idx" ON "books"("availabilityStatus");

-- CreateIndex
CREATE INDEX "books_deletedAt_idx" ON "books"("deletedAt");

-- CreateIndex
CREATE INDEX "wishlists_bookId_idx" ON "wishlists"("bookId");

-- CreateIndex
CREATE INDEX "wishlists_userId_idx" ON "wishlists"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "wishlists_userId_bookId_key" ON "wishlists"("userId", "bookId");

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
