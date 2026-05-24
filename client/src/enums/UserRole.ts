export const UserRole = {
    USER: "player",
    ADMIN: "admin"
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];