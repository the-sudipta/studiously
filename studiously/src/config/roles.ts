export const ALLOWED_ROLES = ['admin', 'member'] as const;
export type Role = (typeof ALLOWED_ROLES)[number];
