-- CreateTable
CREATE TABLE "Site" (
    "id" SERIAL NOT NULL,
    "id_user" INTEGER NOT NULL,
    "url_site" TEXT NOT NULL,
    "auth_key" TEXT NOT NULL,
    "auth_url" TEXT NOT NULL,
    "auth_email" TEXT NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Site_url_site_key" ON "Site"("url_site");

-- CreateIndex
CREATE UNIQUE INDEX "Site_auth_key_key" ON "Site"("auth_key");

-- CreateIndex
CREATE UNIQUE INDEX "Site_auth_url_key" ON "Site"("auth_url");
