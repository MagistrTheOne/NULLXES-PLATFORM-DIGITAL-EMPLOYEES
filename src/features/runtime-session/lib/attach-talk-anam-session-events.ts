import {
  AnamEvent,
  ConnectionClosedCode,
  MessageRole,
  type AnamClient,
  type MessageStreamEvent,
} from "@anam-ai/js-sdk";
import type {
  TalkMicPermission,
  TalkPipelineState,
} from "../context/talk-anam-context";

export function attachTalkAnamSessionEvents(input: {
  anamClient: AnamClient;
  setPipelineState: (state: TalkPipelineState) => void;
  setMicPermission: (state: TalkMicPermission) => void;
  syncMicFromClient: () => void;
  ensureMicActive: () => void;
  onConnectionClosed: (reason: ConnectionClosedCode, details?: string) => void;
}): () => void {
  const onMicPending = () => {
    input.setMicPermission("pending");
  };

  const onMicGranted = () => {
    input.setMicPermission("granted");
    input.ensureMicActive();
    input.syncMicFromClient();
  };

  const onMicDenied = () => {
    input.setMicPermission("denied");
  };

  const onInputAudioStarted = () => {
    input.setMicPermission("granted");
    input.ensureMicActive();
    input.syncMicFromClient();
  };

  const onUserSpeechStarted = () => {
    input.setPipelineState("listening");
  };

  const onUserSpeechEnded = () => {
    input.setPipelineState("thinking");
  };

  const onMessageStream = (event: MessageStreamEvent) => {
    if (event.role === MessageRole.PERSONA && event.content.trim()) {
      input.setPipelineState("speaking");
      return;
    }

    if (event.role === MessageRole.USER && event.endOfSpeech) {
      input.setPipelineState("thinking");
    }
  };

  const onConnectionClosed = (
    reason: ConnectionClosedCode,
    details?: string,
  ) => {
    input.setPipelineState("idle");
    input.onConnectionClosed(reason, details);
  };

  input.anamClient.addListener(AnamEvent.MIC_PERMISSION_PENDING, onMicPending);
  input.anamClient.addListener(AnamEvent.MIC_PERMISSION_GRANTED, onMicGranted);
  input.anamClient.addListener(AnamEvent.MIC_PERMISSION_DENIED, onMicDenied);
  input.anamClient.addListener(
    AnamEvent.INPUT_AUDIO_STREAM_STARTED,
    onInputAudioStarted,
  );
  input.anamClient.addListener(
    AnamEvent.USER_SPEECH_STARTED,
    onUserSpeechStarted,
  );
  input.anamClient.addListener(AnamEvent.USER_SPEECH_ENDED, onUserSpeechEnded);
  input.anamClient.addListener(
    AnamEvent.MESSAGE_STREAM_EVENT_RECEIVED,
    onMessageStream,
  );
  input.anamClient.addListener(AnamEvent.CONNECTION_CLOSED, onConnectionClosed);

  return () => {
    input.anamClient.removeListener(
      AnamEvent.MIC_PERMISSION_PENDING,
      onMicPending,
    );
    input.anamClient.removeListener(
      AnamEvent.MIC_PERMISSION_GRANTED,
      onMicGranted,
    );
    input.anamClient.removeListener(AnamEvent.MIC_PERMISSION_DENIED, onMicDenied);
    input.anamClient.removeListener(
      AnamEvent.INPUT_AUDIO_STREAM_STARTED,
      onInputAudioStarted,
    );
    input.anamClient.removeListener(
      AnamEvent.USER_SPEECH_STARTED,
      onUserSpeechStarted,
    );
    input.anamClient.removeListener(
      AnamEvent.USER_SPEECH_ENDED,
      onUserSpeechEnded,
    );
    input.anamClient.removeListener(
      AnamEvent.MESSAGE_STREAM_EVENT_RECEIVED,
      onMessageStream,
    );
    input.anamClient.removeListener(
      AnamEvent.CONNECTION_CLOSED,
      onConnectionClosed,
    );
  };
}
