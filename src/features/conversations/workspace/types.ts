export type NullxesWorkspaceSurface = "talk" | "conversations";

export type NullxesMessageContext = {
  agentDisplayName: string;
  viewerName?: string;
  viewerImage?: string | null;
};

export type NullxesStreamWorkspaceConfig = NullxesMessageContext & {
  surface: NullxesWorkspaceSurface;
  emptyMessage: string;
  composerPlaceholder?: string;
  agentRole?: string;
};
