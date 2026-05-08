import { z } from 'zod'

export const TabSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  favIconUrl: z.string().url().optional(),
})
export type Tab = z.infer<typeof TabSchema>

export const SpaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  tabs: z.array(TabSchema),
  createdAt: z.number(),
  updatedAt: z.number(),
})
export type Space = z.infer<typeof SpaceSchema>

export const DatabaseSchema = z.object({
  version: z.literal(1),
  spaces: z.array(SpaceSchema),
})
export type Database = z.infer<typeof DatabaseSchema>

export const EMPTY_DB: Database = { version: 1, spaces: [] }

export type ParseResult =
  | { ok: true; db: Database }
  | { ok: false; raw: unknown }

export function safeParseDatabase(raw: unknown): ParseResult {
  const result = DatabaseSchema.safeParse(raw)
  if (result.success) return { ok: true, db: result.data }
  return { ok: false, raw }
}
