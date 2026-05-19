const { z } = require('zod');

const COURSE_TITLE_MIN = 5;
const COURSE_TITLE_MAX = 120;
const COURSE_FEATURE_MAX = 20;
const COURSE_FEATURE_TEXT_MAX = 80;

const courseSchema = z.object({
  title: z.string().trim().min(COURSE_TITLE_MIN).max(COURSE_TITLE_MAX),
  level: z.enum(['A1', 'A2', 'B1', 'B2']),
  description: z.string().optional(),
  short_description: z.string().max(500).optional(),
  price_inr: z.number().min(0),
  price_usd: z.number().min(0),
  duration_weeks: z.number().int().min(1).optional(),
  max_students: z.number().int().min(1).optional(),
  thumbnail_url: z.string().optional(),
  features: z
    .array(z.string().trim().min(2).max(COURSE_FEATURE_TEXT_MAX))
    .max(COURSE_FEATURE_MAX)
    .optional(),
});

const courseUpdateSchema = courseSchema.partial().extend({
  is_active: z.boolean().optional(),
});

module.exports = { courseSchema, courseUpdateSchema, COURSE_TITLE_MIN, COURSE_TITLE_MAX };