import type { BrainProvider } from "@/entities/digital-employee";

export type TalkBrainRequestConfig = {
  brainProvider: BrainProvider;
  model: string;
  brainModelLabel: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  employeeName: string;
  employeeRole: string;
  enabledToolSlugs: string[];
};
