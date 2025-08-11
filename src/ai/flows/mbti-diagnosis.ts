'use server';

/**
 * @fileOverview An MBTI personality diagnosis AI agent.
 *
 * - mbtiDiagnosis - A function that handles the MBTI diagnosis process.
 * - MbtiDiagnosisInput - The input type for the mbtiDiagnosis function.
 * - MbtiDiagnosisOutput - The return type for the mbtiDiagnosis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MbtiDiagnosisInputSchema = z.object({
  userInput: z.string().describe('The user input to the chatbot.'),
  conversationHistory: z
    .array(z.object({role: z.enum(['user', 'assistant']), content: z.string()}))
    .optional()
    .describe('The conversation history between the user and the chatbot.'),
  mbtiType: z.string().optional().describe('The current inferred MBTI type.'),
});
export type MbtiDiagnosisInput = z.infer<typeof MbtiDiagnosisInputSchema>;

const MbtiDiagnosisOutputSchema = z.object({
  chatbotResponse: z.string().describe('The response from the chatbot.'),
  mbtiType: z.string().optional().describe('The inferred MBTI type.'),
  isFinalAnswer: z.boolean().describe('Whether the chatbot has determined the final answer'),
});
export type MbtiDiagnosisOutput = z.infer<typeof MbtiDiagnosisOutputSchema>;

export async function mbtiDiagnosis(input: MbtiDiagnosisInput): Promise<MbtiDiagnosisOutput> {
  return mbtiDiagnosisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'mbtiDiagnosisPrompt',
  input: {schema: MbtiDiagnosisInputSchema},
  output: {schema: MbtiDiagnosisOutputSchema},
  prompt: `You are an MBTI personality diagnosis chatbot. Your goal is to determine the user's MBTI type through a series of questions. 

  Here's how you should conduct the conversation:
  1.  If this is the start of the conversation (no conversation history), your first response must be ONLY the following, with each language on a new line:
      Hello, I'm an MBTI diagnostic chatbot. Which language would you like to use?
      こんにちは、私はMBTI診断チャットボットです。どの言語を利用しますか？
      你好，我是一个MBTI诊断聊天机器人。你想用什么语言？
      Hola, soy un chatbot de diagnóstico MBTI. ¿Qué idioma te gustaría usar?
  2.  Once a language is chosen, continue the conversation ONLY in that language.
  3.  Ask the user questions related to different MBTI dichotomies (Introversion vs. Extraversion, Sensing vs. Intuition, Thinking vs. Feeling, Judging vs. Perceiving).
  4.  Adapt your questions based on the user's previous answers to efficiently narrow down the personality type.
  5.  Once you have enough information to make a determination, confirm the MBTI type with the user and provide a brief explanation.
  6.  If you are not confident, continue asking clarifying questions.

  Here is the conversation history so far:
  {{#each conversationHistory}}
  {{role}}: {{content}}
  {{/each}}

  User Input: {{{userInput}}}

  Based on the conversation so far, generate your next response. If you are not confident with the type, respond with isFinalAnswer=false, otherwise respond with the diagnosis and isFinalAnswer=true.
`,
});

const mbtiDiagnosisFlow = ai.defineFlow(
  {
    name: 'mbtiDiagnosisFlow',
    inputSchema: MbtiDiagnosisInputSchema,
    outputSchema: MbtiDiagnosisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
