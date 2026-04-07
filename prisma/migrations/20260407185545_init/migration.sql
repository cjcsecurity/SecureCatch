-- CreateTable
CREATE TABLE "PhishingAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "jiraTicketId" TEXT NOT NULL,
    "jiraTicketKey" TEXT NOT NULL,
    "jiraTicketUrl" TEXT,
    "jiraSummary" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "reportedByEmail" TEXT NOT NULL,
    "activityDate" DATETIME,
    "googleMessageId" TEXT,
    "rfc2822MessageId" TEXT,
    "rawEmailHeaders" TEXT,
    "rawEmailBody" TEXT,
    "extractedLinks" TEXT,
    "vtSenderDomain" TEXT,
    "vtSenderDomainScore" TEXT,
    "vtSenderIp" TEXT,
    "vtSenderIpScore" TEXT,
    "vtUrlScores" TEXT,
    "aiClassification" TEXT,
    "aiConfidenceScore" INTEGER,
    "aiReasoning" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "analystAction" TEXT,
    "analystNote" TEXT,
    "remediatedAt" DATETIME,
    "closedAt" DATETIME,
    "purgeResults" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "PhishingAlert_jiraTicketId_key" ON "PhishingAlert"("jiraTicketId");
