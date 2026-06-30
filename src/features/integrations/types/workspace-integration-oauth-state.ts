export type WorkspaceIntegrationOAuthState = {
  slack: {
    oauthConfigured: boolean;
    connected: boolean;
  };
  teams: {
    oauthConfigured: boolean;
    connected: boolean;
  };
};
