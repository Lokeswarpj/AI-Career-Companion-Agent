import crypto from 'crypto';

// In-memory store for pending registration OTPs
// Maps email -> { otp, fullName, passwordHash, expiresAt, createdAt, lastSentAt, attempts, maxAttempts }
const pendingRegistrations = new Map();

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Generate a secure 6-digit numeric OTP
 */
export function generateNumericOTP(length = 6) {
  // Cryptographically secure numeric OTP
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const range = max - min + 1;
  const randomBytes = crypto.randomBytes(4);
  const randomValue = randomBytes.readUInt32BE(0);
  const otp = min + (randomValue % range);
  return otp.toString();
}

/**
 * Store a pending registration OTP
 */
export function storeRegistrationOtp(email, fullName, passwordHash, customOtp = null) {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = pendingRegistrations.get(normalizedEmail);

  // Check rate limit / cooldown
  if (existing && Date.now() - existing.lastSentAt < RESEND_COOLDOWN_SECONDS * 1000) {
    const remaining = Math.ceil((RESEND_COOLDOWN_SECONDS * 1000 - (Date.now() - existing.lastSentAt)) / 1000);
    return {
      success: false,
      error: `Please wait ${remaining} seconds before requesting a new verification code.`,
      cooldownRemaining: remaining
    };
  }

  const otp = customOtp || generateNumericOTP(6);
  const now = Date.now();
  const expiresAt = now + OTP_TTL_MINUTES * 60 * 1000;

  pendingRegistrations.set(normalizedEmail, {
    otp,
    fullName: fullName.trim(),
    passwordHash,
    expiresAt,
    createdAt: now,
    lastSentAt: now,
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS
  });

  return {
    success: true,
    otp,
    expiresAt,
    expiresInMinutes: OTP_TTL_MINUTES
  };
}

/**
 * Verify submitted OTP for registration
 */
export function verifyRegistrationOtp(email, enteredOtp) {
  const normalizedEmail = email.toLowerCase().trim();
  const record = pendingRegistrations.get(normalizedEmail);

  if (!record) {
    return {
      success: false,
      error: 'No active verification request found. Please request a new code.'
    };
  }

  // Check expiration
  if (Date.now() > record.expiresAt) {
    pendingRegistrations.delete(normalizedEmail);
    return {
      success: false,
      error: 'Verification code has expired (valid for 10 minutes). Please request a new code.'
    };
  }

  // Check maximum failed attempts
  if (record.attempts >= record.maxAttempts) {
    pendingRegistrations.delete(normalizedEmail);
    return {
      success: false,
      error: 'Too many incorrect attempts. For security, please request a fresh verification code.'
    };
  }

  // Compare OTP
  const sanitizedEntered = (enteredOtp || '').toString().trim();
  if (record.otp !== sanitizedEntered) {
    record.attempts += 1;
    const remainingAttempts = record.maxAttempts - record.attempts;
    if (remainingAttempts <= 0) {
      pendingRegistrations.delete(normalizedEmail);
      return {
        success: false,
        error: 'Too many incorrect attempts. Please request a new verification code.'
      };
    }
    return {
      success: false,
      error: `Invalid verification code. ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining.`
    };
  }

  // Valid OTP!
  const registrationData = {
    email: normalizedEmail,
    fullName: record.fullName,
    passwordHash: record.passwordHash
  };

  // Clear pending OTP upon success
  pendingRegistrations.delete(normalizedEmail);

  return {
    success: true,
    data: registrationData
  };
}

/**
 * Check if a resend is allowed for an email
 */
export function getResendStatus(email) {
  const normalizedEmail = email.toLowerCase().trim();
  const record = pendingRegistrations.get(normalizedEmail);

  if (!record) {
    return { canResend: true, cooldownRemaining: 0 };
  }

  const elapsed = Date.now() - record.lastSentAt;
  const cooldownMs = RESEND_COOLDOWN_SECONDS * 1000;

  if (elapsed < cooldownMs) {
    return {
      canResend: false,
      cooldownRemaining: Math.ceil((cooldownMs - elapsed) / 1000)
    };
  }

  return { canResend: true, cooldownRemaining: 0 };
}

/**
 * Dev/testing helper to inspect current pending OTP (for automated test suite)
 */
export function getPendingOtpForTesting(email) {
  const normalizedEmail = email.toLowerCase().trim();
  const record = pendingRegistrations.get(normalizedEmail);
  return record ? record.otp : null;
}

/**
 * Clear all pending OTPs (for test teardown)
 */
export function clearAllOtpsForTesting() {
  pendingRegistrations.clear();
}
