import { logger } from "@/lib/logging/logger";
import { getAdminAuth } from "./admin";

/**
 * Firebase Authentication templates cannot use our SES gold/ink HTML. They are a
 * separate, limited layout sent from Firebase (or custom SMTP). This app already
 * generates action links with the Admin SDK and sends branded mail itself, so
 * Firebase's default verification/reset letters should stay unused.
 *
 * The Admin SDK cannot turn those templates off. Enabling improved email privacy
 * is the closest project-level control; staff should also leave the Console
 * templates disabled / unused.
 */
export async function suppressFirebaseDefaultEmails(): Promise<void> {
  try {
    await getAdminAuth().projectConfigManager().updateProjectConfig({
      emailPrivacyConfig: { enableImprovedEmailPrivacy: true },
    });
    logger.info("firebase_email_privacy_enabled", {
      message: "Firebase default templates cannot use the restaurant theme; branded mail is sent by SES.",
    });
  } catch (error) {
    logger.info("firebase_email_privacy_skipped", {
      message: error instanceof Error ? error.message : "unavailable",
    });
  }
}
