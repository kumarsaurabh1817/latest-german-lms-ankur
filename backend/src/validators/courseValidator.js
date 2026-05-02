const { z } = require('zod');

const courseSchema = z.object({
  title: z.string().min(3),
  level: z.enum(['A1', 'A2', 'B1', 'B2']),
  description: z.string().optional(),
  short_description: z.string().max(500).optional(),
  price_inr: z.number().min(0),
  price_usd: z.number().min(0),
  duration_weeks: z.number().int().min(1).optional(),
  max_students: z.number().int().min(1).optional(),
  thumbnail_url: z.string().optional(),
});

module.exports = { courseSchema };