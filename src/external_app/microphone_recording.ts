/*
Apps can record the microphone themselves and hand the audio to the frontend.
Used when the frontend has no secure context, where browsers block microphone access.
*/

import type { HASSDomEvent } from "../common/dom/fire_event";
import type {
  ExternalMessaging,
  ExternalMicrophoneRecording,
} from "./external_messaging";

export const canAppRecordMicrophone = (external?: ExternalMessaging) =>
  Boolean(external?.config.hasMicrophoneRecording);

/**
 * Asks the app to start recording the microphone.
 * Resolves with the session ID once recording, rejects with `{ code, message }`.
 */
export const startAppMicrophoneRecording = async (
  external: ExternalMessaging
): Promise<string> => {
  const { session_id } =
    await external.sendMessage<"microphone/recording/start">({
      type: "microphone/recording/start",
    });
  return session_id;
};

/**
 * Stops the recording and resolves with it. Also collects a recording the app
 * already ended by itself, rejects with `{ code: "not_found" }` once collected.
 */
export const stopAppMicrophoneRecording = (
  external: ExternalMessaging,
  sessionId: string
): Promise<ExternalMicrophoneRecording> =>
  external.sendMessage<"microphone/recording/stop">({
    type: "microphone/recording/stop",
    payload: { session_id: sessionId },
  });

export const appMicrophoneRecordingToBlob = (
  recording: ExternalMicrophoneRecording
): Blob =>
  new Blob([Uint8Array.from(atob(recording.audio), (c) => c.charCodeAt(0))], {
    type: recording.mime_type,
  });

/**
 * Calls `callback` when the app ends a recording without the frontend stopping it.
 * Returns a function to unsubscribe.
 */
export const subscribeAppMicrophoneRecordingStopped = (
  callback: (stopped: HASSDomEvents["microphone-recording-stopped"]) => void
): (() => void) => {
  const listener = (
    ev: HASSDomEvent<HASSDomEvents["microphone-recording-stopped"]>
  ) => callback(ev.detail);
  window.addEventListener("microphone-recording-stopped", listener);
  return () =>
    window.removeEventListener("microphone-recording-stopped", listener);
};
