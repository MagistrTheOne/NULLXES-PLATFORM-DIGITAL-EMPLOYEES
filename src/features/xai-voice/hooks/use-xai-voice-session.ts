"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { XaiVoiceSessionUpdate } from "@/features/xai-voice/lib/build-xai-voice-session-update";
import {
  base64Pcm16ToFloat32,
  float32ToPcm16Base64,
} from "@/features/xai-voice/lib/xai-audio-utils";

const CHUNK_DURATION_MS = 100;
const TARGET_SAMPLE_RATE = 24000;

export type XaiVoiceSessionState =
  | "idle"
  | "connecting"
  | "live"
  | "error"
  | "ended";

type XaiVoiceSessionPayload = {
  clientSecret: string;
  websocketUrl: string;
  agentId: string;
  bindConsoleAgent: boolean;
  session: XaiVoiceSessionUpdate;
};

export function useXaiVoiceSession(input: {
  employeeId: string;
  sessionId?: string;
  enabled: boolean;
}) {
  const [state, setState] = useState<XaiVoiceSessionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const playbackQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const currentPlaybackRef = useRef<AudioBufferSourceNode | null>(null);
  const assistantLineRef = useRef("");
  const sessionPayloadRef = useRef<XaiVoiceSessionPayload | null>(null);
  const isSessionConfiguredRef = useRef(false);
  const isConfiguringSessionRef = useRef(false);

  const stopPlayback = useCallback(() => {
    if (currentPlaybackRef.current) {
      try {
        currentPlaybackRef.current.stop();
        currentPlaybackRef.current.disconnect();
      } catch {
        // already stopped
      }
      currentPlaybackRef.current = null;
    }
    playbackQueueRef.current = [];
    isPlayingRef.current = false;
  }, []);

  const playNextChunk = useCallback((audioContext: AudioContext) => {
    if (playbackQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      currentPlaybackRef.current = null;
      return;
    }

    const chunk = playbackQueueRef.current.shift()!;
    const audioBuffer = audioContext.createBuffer(
      1,
      chunk.length,
      audioContext.sampleRate,
    );
    audioBuffer.getChannelData(0).set(chunk);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    currentPlaybackRef.current = source;
    source.onended = () => {
      if (currentPlaybackRef.current === source) {
        currentPlaybackRef.current = null;
      }
      playNextChunk(audioContext);
    };
    source.start();
  }, []);

  const playAudio = useCallback(
    (base64Audio: string) => {
      const audioContext = audioContextRef.current;
      if (!audioContext) {
        return;
      }

      playbackQueueRef.current.push(base64Pcm16ToFloat32(base64Audio));
      if (!isPlayingRef.current) {
        isPlayingRef.current = true;
        playNextChunk(audioContext);
      }
    },
    [playNextChunk],
  );

  const executeToolCall = useCallback(
    async (toolName: string, argumentsJson: string): Promise<string> => {
      const response = await fetch("/api/talk/xai-voice/execute-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: input.employeeId,
          sessionId: input.sessionId,
          toolName,
          argumentsJson,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? "Tool execution failed");
      }

      const payload = (await response.json()) as { output?: string };
      return payload.output ?? "";
    },
    [input.employeeId, input.sessionId],
  );

  const stopCapture = useCallback(() => {
    processorRef.current?.disconnect();
    processorRef.current = null;
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  const disconnect = useCallback(() => {
    stopCapture();
    stopPlayback();
    wsRef.current?.close();
    wsRef.current = null;
    sessionPayloadRef.current = null;
    isSessionConfiguredRef.current = false;
    isConfiguringSessionRef.current = false;
    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, [stopCapture, stopPlayback]);

  const configureSession = useCallback((ws: WebSocket) => {
    const payload = sessionPayloadRef.current;
    if (!payload || isConfiguringSessionRef.current || isSessionConfiguredRef.current) {
      return;
    }

    isConfiguringSessionRef.current = true;
    ws.send(
      JSON.stringify({
        type: "session.update",
        session: {
          ...payload.session,
          audio: {
            input: {
              format: { type: "audio/pcm", rate: TARGET_SAMPLE_RATE },
            },
            output: {
              format: { type: "audio/pcm", rate: TARGET_SAMPLE_RATE },
            },
          },
        },
      }),
    );
  }, []);

  const handleServerEvent = useCallback(
    (event: Record<string, unknown>, ws: WebSocket) => {
      const type = typeof event.type === "string" ? event.type : "";

      if (
        (type === "session.created" || type === "conversation.created") &&
        !isSessionConfiguredRef.current
      ) {
        configureSession(ws);
      }

      if (type === "session.updated") {
        isSessionConfiguredRef.current = true;
        isConfiguringSessionRef.current = false;
      }

      if (type === "response.output_audio.delta" && typeof event.delta === "string") {
        playAudio(event.delta);
      }

      if (
        type === "response.output_audio_transcript.delta" &&
        typeof event.delta === "string"
      ) {
        assistantLineRef.current += event.delta;
        setTranscript((current) => {
          const next = [...current];
          if (next.at(-1)?.startsWith("Assistant:")) {
            next[next.length - 1] = `Assistant: ${assistantLineRef.current}`;
          } else {
            next.push(`Assistant: ${assistantLineRef.current}`);
          }
          return next;
        });
      }

      if (type === "response.done") {
        assistantLineRef.current = "";
      }

      if (type === "input_audio_buffer.speech_started") {
        stopPlayback();
      }

      if (type === "response.function_call_arguments.done") {
        const toolName = typeof event.name === "string" ? event.name : "";
        const callId = typeof event.call_id === "string" ? event.call_id : "";
        const args =
          typeof event.arguments === "string" ? event.arguments : "{}";

        if (!toolName || !callId || ws.readyState !== WebSocket.OPEN) {
          return;
        }

        void executeToolCall(toolName, args)
          .then((output) => {
            if (ws.readyState !== WebSocket.OPEN) {
              return;
            }

            ws.send(
              JSON.stringify({
                type: "conversation.item.create",
                item: {
                  type: "function_call_output",
                  call_id: callId,
                  output,
                },
              }),
            );
            ws.send(JSON.stringify({ type: "response.create" }));
          })
          .catch((toolError: unknown) => {
            if (ws.readyState !== WebSocket.OPEN) {
              return;
            }

            const message =
              toolError instanceof Error
                ? toolError.message
                : "Tool execution failed";

            ws.send(
              JSON.stringify({
                type: "conversation.item.create",
                item: {
                  type: "function_call_output",
                  call_id: callId,
                  output: message,
                },
              }),
            );
            ws.send(JSON.stringify({ type: "response.create" }));
          });
      }

      if (type === "conversation.item.added" && event.item && typeof event.item === "object") {
        const item = event.item as {
          role?: string;
          content?: Array<{ type?: string; transcript?: string }>;
        };
        if (item.role === "user" && Array.isArray(item.content)) {
          for (const content of item.content) {
            if (content.type === "input_audio" && content.transcript?.trim()) {
              const line = content.transcript.trim();
              setTranscript((current) => [...current, `You: ${line}`]);
            }
          }
        }
      }
    },
    [configureSession, executeToolCall, playAudio, stopPlayback],
  );

  const startCapture = useCallback(async (ws: WebSocket) => {
    const audioContext = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE });
    audioContextRef.current = audioContext;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    mediaStreamRef.current = stream;

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const source = audioContext.createMediaStreamSource(stream);
    sourceRef.current = source;

    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    let buffers: Float32Array[] = [];
    let totalSamples = 0;
    const chunkSizeSamples =
      (audioContext.sampleRate * CHUNK_DURATION_MS) / 1000;

    processor.onaudioprocess = (processEvent) => {
      if (
        ws.readyState !== WebSocket.OPEN ||
        !isSessionConfiguredRef.current
      ) {
        return;
      }

      const input = processEvent.inputBuffer.getChannelData(0);
      buffers.push(new Float32Array(input));
      totalSamples += input.length;

      while (totalSamples >= chunkSizeSamples) {
        const chunk = new Float32Array(chunkSizeSamples);
        let offset = 0;

        while (offset < chunkSizeSamples && buffers.length > 0) {
          const buffer = buffers[0]!;
          const needed = chunkSizeSamples - offset;
          const available = buffer.length;

          if (available <= needed) {
            chunk.set(buffer, offset);
            offset += available;
            totalSamples -= available;
            buffers.shift();
          } else {
            chunk.set(buffer.subarray(0, needed), offset);
            buffers[0] = buffer.subarray(needed);
            offset += needed;
            totalSamples -= needed;
          }
        }

        ws.send(
          JSON.stringify({
            type: "input_audio_buffer.append",
            audio: float32ToPcm16Base64(chunk),
          }),
        );
      }
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
  }, []);

  const waitForSessionConfigured = useCallback(
    (ws: WebSocket, timeoutMs = 8000) =>
      new Promise<void>((resolve, reject) => {
        if (isSessionConfiguredRef.current) {
          resolve();
          return;
        }

        const timeout = window.setTimeout(() => {
          ws.removeEventListener("message", onMessage);
          reject(new Error("xAI voice session configuration timed out"));
        }, timeoutMs);

        const onMessage = (messageEvent: MessageEvent) => {
          try {
            const event = JSON.parse(String(messageEvent.data)) as Record<
              string,
              unknown
            >;
            if (event.type === "session.updated") {
              window.clearTimeout(timeout);
              ws.removeEventListener("message", onMessage);
              resolve();
            }
          } catch {
            // ignore
          }
        };

        ws.addEventListener("message", onMessage);
      }),
    [],
  );

  const start = useCallback(async () => {
    if (!input.enabled) {
      return;
    }

    setError(null);
    setTranscript([]);
    assistantLineRef.current = "";
    setState("connecting");
    disconnect();

    try {
      const response = await fetch("/api/talk/xai-voice/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: input.employeeId,
          sessionId: input.sessionId,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? "Failed to start xAI voice session");
      }

      const payload = (await response.json()) as XaiVoiceSessionPayload;
      sessionPayloadRef.current = payload;

      const ws = new WebSocket(payload.websocketUrl, [
        `xai-client-secret.${payload.clientSecret}`,
      ]);
      wsRef.current = ws;

      await new Promise<void>((resolve, reject) => {
        ws.onopen = () => resolve();
        ws.onerror = () => reject(new Error("xAI voice WebSocket failed"));
      });

      ws.onmessage = (messageEvent) => {
        try {
          const event = JSON.parse(String(messageEvent.data)) as Record<
            string,
            unknown
          >;
          handleServerEvent(event, ws);
        } catch {
          // ignore malformed events
        }
      };

      ws.onclose = () => {
        setState((current) => (current === "live" ? "ended" : current));
      };

      configureSession(ws);
      await waitForSessionConfigured(ws);
      await startCapture(ws);
      setState("live");
    } catch (startError: unknown) {
      disconnect();
      setState("error");
      setError(
        startError instanceof Error
          ? startError.message
          : "Failed to start xAI voice call",
      );
    }
  }, [
    configureSession,
    disconnect,
    handleServerEvent,
    input.employeeId,
    input.enabled,
    input.sessionId,
    startCapture,
    waitForSessionConfigured,
  ]);

  const stop = useCallback(() => {
    disconnect();
    setState("ended");
  }, [disconnect]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    state,
    error,
    transcript,
    start,
    stop,
    isLive: state === "live",
  };
}
