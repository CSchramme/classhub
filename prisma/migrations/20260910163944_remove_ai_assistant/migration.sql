-- AlterEnum
BEGIN;
CREATE TYPE "AuditAction_new" AS ENUM ('USER_CREATED', 'USER_DISABLED', 'USER_ENABLED', 'USER_ASSIGNED_TO_CLASS', 'USER_REMOVED_FROM_CLASS', 'PASSWORD_RESET_REQUESTED', 'PASSWORD_CHANGE_REQUIRED', 'FILE_UPLOADED', 'FILE_DELETED');
ALTER TABLE "AuditLog" ALTER COLUMN "action" TYPE "AuditAction_new" USING ("action"::text::"AuditAction_new");
ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "public"."AuditAction_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('HOMEWORK_CREATED', 'EXAM_UPCOMING', 'EVENT_REMINDER', 'ANNOUNCEMENT', 'CLOUD_ACTIVITY');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PermissionKey_new" AS ENUM ('CLOUD_ACCESS', 'CLASS_ACCESS', 'FILE_UPLOAD', 'ADVANCED_FEATURES');
ALTER TABLE "UserPermission" ALTER COLUMN "key" TYPE "PermissionKey_new" USING ("key"::text::"PermissionKey_new");
ALTER TYPE "PermissionKey" RENAME TO "PermissionKey_old";
ALTER TYPE "PermissionKey_new" RENAME TO "PermissionKey";
DROP TYPE "public"."PermissionKey_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "AIConversation" DROP CONSTRAINT "AIConversation_userId_fkey";

-- DropForeignKey
ALTER TABLE "AIMessage" DROP CONSTRAINT "AIMessage_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "AIUsageLog" DROP CONSTRAINT "AIUsageLog_userId_fkey";

-- DropTable
DROP TABLE "AIConversation";

-- DropTable
DROP TABLE "AIMessage";

-- DropTable
DROP TABLE "AIUsageLog";

-- DropTable
DROP TABLE "SystemSettings";

-- DropEnum
DROP TYPE "AiActionStatus";

-- DropEnum
DROP TYPE "AiMessageRole";

