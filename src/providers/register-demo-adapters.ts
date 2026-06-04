import {
  registerAvatarProvider,
  registerBrainProvider,
} from "@/shared/providers";
import { createAnamAvatarAdapter } from "./avatar/anam";
import { createOpenAiBrainAdapter } from "./brain/openai";
import type { EmployeeProviderConfigs } from "./load-employee-provider-configs";

export function registerDemoProviderAdapters(
  configs: EmployeeProviderConfigs,
): void {
  registerBrainProvider(
    {
      id: "openai",
      name: "OpenAI",
      description: "OpenAI brain provider adapter for demo environments",
    },
    createOpenAiBrainAdapter(configs.brain.config),
  );

  registerAvatarProvider(
    {
      id: "anam",
      name: "Anam",
      description: "Anam avatar provider adapter for demo environments",
    },
    createAnamAvatarAdapter(configs.avatar.config),
  );
}
