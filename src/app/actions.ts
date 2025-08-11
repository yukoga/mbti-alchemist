'use server';

import { mbtiDiagnosis, type MbtiDiagnosisInput, type MbtiDiagnosisOutput } from '@/ai/flows/mbti-diagnosis';

export async function diagnose(input: MbtiDiagnosisInput): Promise<MbtiDiagnosisOutput> {
  try {
    const result = await mbtiDiagnosis(input);
    return result;
  } catch (error) {
    console.error("AI diagnosis failed:", error);
    return {
      chatbotResponse: "I'm sorry, I encountered a critical error and can't continue the diagnosis right now. Please try restarting the session.",
      isFinalAnswer: true,
    };
  }
}
