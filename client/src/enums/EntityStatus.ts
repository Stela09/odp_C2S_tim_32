export const EntityStatus = {
    PENDING: "PENDING",
    CONFIRMED: "CONFIRMED",
    DISQUALIFIED: "DISQUALIFIED"
} as const;

export type EntityStatus = typeof EntityStatus[keyof typeof EntityStatus];