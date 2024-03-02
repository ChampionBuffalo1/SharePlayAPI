import { z } from 'zod';
import { eventMapping } from '../rtcRelay/messages';

const keys = Object.keys(eventMapping) as [string, ...string[]];

export const incomingRequest = z.object({
  op: z.enum(keys),
  d: z.record(z.string(), z.any()),
});

export type RequestContent = z.infer<typeof incomingRequest>;
