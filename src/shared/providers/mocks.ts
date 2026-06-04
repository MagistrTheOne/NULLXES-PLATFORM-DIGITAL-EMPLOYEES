import type { AvatarProvider } from "./avatar/interfaces";
import type { AvatarProviderId } from "./avatar/types";
import type { BrainProvider } from "./brain/interfaces";
import type { BrainProviderId } from "./brain/types";
import type { SessionProvider } from "./session/interfaces";
import type { SessionProviderId } from "./session/types";

function createMockAvatarProvider(providerId: AvatarProviderId): AvatarProvider {
  return {
    async createAvatar(input) {
      return {
        avatarId: `mock-avatar-${input.employeeId}`,
        providerId,
      };
    },
    async updateAvatar(input) {
      return { avatarId: input.avatarId, updated: true };
    },
    async deleteAvatar(input) {
      return { avatarId: input.avatarId, deleted: true };
    },
    async healthCheck() {
      return { healthy: true, providerId };
    },
  };
}

function createMockBrainProvider(providerId: BrainProviderId): BrainProvider {
  return {
    async generateResponse(input) {
      return {
        text: `mock-response:${input.prompt}`,
        providerId,
      };
    },
    async healthCheck() {
      return { healthy: true, providerId };
    },
  };
}

function createMockSessionProvider(
  providerId: SessionProviderId,
): SessionProvider {
  return {
    async createSession(input) {
      return {
        sessionId: `mock-session-${input.employeeId}`,
        providerId,
      };
    },
    async terminateSession(input) {
      return { sessionId: input.sessionId, terminated: true };
    },
    async healthCheck() {
      return { healthy: true, providerId };
    },
  };
}

export const mockAvatarProvider = createMockAvatarProvider("nullxes");
export const mockBrainProvider = createMockBrainProvider("nullxes");
export const mockSessionProvider = createMockSessionProvider("nullxes");
