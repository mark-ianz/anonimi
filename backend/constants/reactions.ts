export const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "👍", "🔥"] as const;

export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export const isReactionEmoji = (value: string): value is ReactionEmoji =>
  REACTION_EMOJIS.includes(value as ReactionEmoji);
