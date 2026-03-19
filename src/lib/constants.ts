/**
 * Type-strict constants for user roles.
 * These mirror the Prisma `UserRole` enum and are used for
 * application-layer type safety (e.g. in JWT payloads, guards, etc.).
 */
export const USER_ROLES = ["PLAYER", "DUNGEON_MASTER", "ADMIN"] as const;

export type UserRoleType = (typeof USER_ROLES)[number];
