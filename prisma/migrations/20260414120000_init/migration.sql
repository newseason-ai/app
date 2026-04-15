-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('completed', 'abandoned', 'error');

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo_url" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "opening_prompt" TEXT NOT NULL,
    "directed_questions" JSONB NOT NULL,
    "target_duration_s" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "link_tokens" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "respondent_ref" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),

    CONSTRAINT "link_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "link_token_id" TEXT NOT NULL,
    "respondent_ref" TEXT,
    "vapi_call_id" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL,
    "duration_s" INTEGER,
    "audio_s3_key" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "follow_up_opt_in" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transcript_turns" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "speaker" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "turn_index" INTEGER NOT NULL,
    "started_at_s" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "transcript_turns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL,
    "source_quote" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE INDEX "templates_companyId_idx" ON "templates"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "link_tokens_token_key" ON "link_tokens"("token");

-- CreateIndex
CREATE INDEX "link_tokens_templateId_idx" ON "link_tokens"("templateId");

-- CreateIndex
CREATE INDEX "sessions_link_token_id_idx" ON "sessions"("link_token_id");

-- CreateIndex
CREATE INDEX "sessions_vapi_call_id_idx" ON "sessions"("vapi_call_id");

-- CreateIndex
CREATE INDEX "transcript_turns_session_id_idx" ON "transcript_turns"("session_id");

-- CreateIndex
CREATE INDEX "tags_session_id_idx" ON "tags"("session_id");

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "link_tokens" ADD CONSTRAINT "link_tokens_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_link_token_id_fkey" FOREIGN KEY ("link_token_id") REFERENCES "link_tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transcript_turns" ADD CONSTRAINT "transcript_turns_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
