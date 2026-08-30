import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    tool: z.string().optional(),
    affiliateProgram: z.string().optional(),
    affiliateUrl: z.string().url().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { articles };
