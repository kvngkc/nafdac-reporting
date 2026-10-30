export const HOTSPOT = {
  /** Complaints about the same product within the window that trigger an alert. */
  minComplaints: 5,
  windowDays: 7,
  /** Number of distinct states reporting the same product that triggers an alert. */
  minStates: 3,
};

export const UPLOADS = {
  maxFiles: 4,
  maxBytes: 5 * 1024 * 1024,
  allowedMime: ["image/jpeg", "image/png", "image/webp"] as const,
};

export const RATE_LIMIT = {
  /** Complaint submissions allowed per hashed IP per window. */
  submissions: 5,
  windowMinutes: 60,
};
