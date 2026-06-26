"use client";

import { useMemo, type ReactNode } from "react";
import { MessageList, WithComponents } from "stream-chat-react";
import { NullxesComposerUI } from "./nullxes-composer";
import { NullxesDateSeparator } from "./nullxes-date-separator";
import { NullxesEmptyState } from "./nullxes-empty-state";
import { NullxesMessage } from "./nullxes-message";
import {
  NullxesMessageListWrapper,
  NullxesScrollArea,
} from "./nullxes-scroll-area";
import { NullxesTypingIndicator } from "./nullxes-typing-indicator";
import type { NullxesStreamWorkspaceConfig } from "./types";

function NullComponent() {
  return null;
}

export function createNullxesStreamOverrides(config: NullxesStreamWorkspaceConfig) {
  const Message = () => (
    <NullxesMessage
      surface={config.surface}
      agentDisplayName={config.agentDisplayName}
      viewerName={config.viewerName}
      viewerImage={config.viewerImage}
    />
  );

  const MessageComposerUI = () => (
    <NullxesComposerUI
      surface={config.surface}
      placeholder={config.composerPlaceholder}
    />
  );

  const EmptyStateIndicator = () => (
    <NullxesEmptyState message={config.emptyMessage} />
  );

  return {
    Message,
    MessageComposerUI,
    DateSeparator: NullxesDateSeparator,
    TypingIndicator: NullxesTypingIndicator,
    EmptyStateIndicator,
    Avatar: NullComponent,
    MessageActions: NullComponent,
    NotificationList: NullComponent,
    NewMessageNotification: NullComponent,
    UnreadMessagesNotification: NullComponent,
    ScrollToLatestMessageButton: NullComponent,
    MessageListMainPanel: NullxesScrollArea,
    MessageListWrapper: NullxesMessageListWrapper,
    LoadingErrorIndicator: NullComponent,
  };
}

export function NullxesStreamWorkspace({
  config,
  children,
}: {
  config: NullxesStreamWorkspaceConfig;
  children: ReactNode;
}) {
  const overrides = useMemo(
    () => createNullxesStreamOverrides(config),
    [
      config.agentDisplayName,
      config.composerPlaceholder,
      config.emptyMessage,
      config.surface,
      config.viewerImage,
      config.viewerName,
    ],
  );

  return <WithComponents overrides={overrides}>{children}</WithComponents>;
}

export function NullxesMessageList() {
  return <MessageList noGroupByUser />;
}
