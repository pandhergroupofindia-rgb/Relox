'use server';
/**
 * @fileOverview A Genkit flow for recommending videos based on user viewing history and available videos.
 *
 * - recommendContent - A function that handles the video recommendation process.
 * - ContentRecommendationInput - The input type for the recommendContent function.
 * - ContentRecommendationOutput - The return type for the recommendContent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VideoInfoSchema = z.object({
  id: z.string().describe('Unique identifier for the video.'),
  title: z.string().describe('Title of the video.'),
  description: z.string().optional().describe('Brief description of the video content.'),
  tags: z.array(z.string()).optional().describe('Keywords or categories associated with the video.'),
});

const ContentRecommendationInputSchema = z.object({
  viewedVideoIds: z.array(z.string()).describe('IDs of videos the user has watched.'),
  likedVideoIds: z.array(z.string()).describe('IDs of videos the user has liked.'),
  dislikedVideoIds: z.array(z.string()).describe('IDs of videos the user has disliked.'),
  availableVideos: z.array(VideoInfoSchema).describe('A list of available videos to recommend from, including their IDs, titles, descriptions, and tags.'),
});
export type ContentRecommendationInput = z.infer<typeof ContentRecommendationInputSchema>;

const ContentRecommendationOutputSchema = z.object({
  recommendedVideoIds: z.array(z.string()).describe('A list of IDs of recommended videos.'),
});
export type ContentRecommendationOutput = z.infer<typeof ContentRecommendationOutputSchema>;

export async function recommendContent(input: ContentRecommendationInput): Promise<ContentRecommendationOutput> {
  return contentRecommendationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'contentRecommendationPrompt',
  input: { schema: ContentRecommendationInputSchema },
  output: { schema: ContentRecommendationOutputSchema },
  prompt: `You are a sophisticated video recommendation AI for a platform like TikTok called "Relox". Your goal is to suggest new videos that a user would enjoy, based on their viewing and interaction history.

Consider the user's past preferences and content consumption patterns to provide highly relevant recommendations. Do NOT recommend videos that are already in the user's 'viewedVideoIds', 'likedVideoIds', or 'dislikedVideoIds' lists. Ensure the recommended videos are distinct and new to the user's history.

Here is the user's history:
- Viewed video IDs: {{{JSON.stringify viewedVideoIds}}}
- Liked video IDs: {{{JSON.stringify likedVideoIds}}}
- Disliked video IDs: {{{JSON.stringify dislikedVideoIds}}}

Here are the available videos you can recommend from. Provide only the IDs of the videos you recommend. The IDs must come exclusively from the provided 'availableVideos' list.
Available videos:
{{#each availableVideos}}
  - ID: {{this.id}}, Title: {{this.title}}, Description: {{this.description}}, Tags: {{JSON.stringify this.tags}}
{{/each}}

Based on this information, recommend a list of 5-10 video IDs that the user might like. The output must be a JSON object with a single key 'recommendedVideoIds' which is an array of strings (video IDs).

Example output:
{
  "recommendedVideoIds": ["video_id_1", "video_id_2", "video_id_3"]
}`,
});

const contentRecommendationFlow = ai.defineFlow(
  {
    name: 'contentRecommendationFlow',
    inputSchema: ContentRecommendationInputSchema,
    outputSchema: ContentRecommendationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
