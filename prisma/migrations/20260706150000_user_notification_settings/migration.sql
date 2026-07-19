-- Add UserNotificationSettings table for notification preferences
-- Users can customize which types of notifications they receive

CREATE TABLE IF NOT EXISTS "UserNotificationSettings" (
  id                      TEXT PRIMARY KEY,
  "userId"                TEXT NOT NULL UNIQUE REFERENCES "User"(id) ON DELETE CASCADE,
  "feedbackNotifications" BOOLEAN NOT NULL DEFAULT true,
  "milestoneNotifications" BOOLEAN NOT NULL DEFAULT true,
  "taskNotifications"     BOOLEAN NOT NULL DEFAULT false,
  "githubIntegration"     BOOLEAN NOT NULL DEFAULT false,
  "auditMode"             BOOLEAN NOT NULL DEFAULT false,
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user_id 
  ON "UserNotificationSettings"("userId");
