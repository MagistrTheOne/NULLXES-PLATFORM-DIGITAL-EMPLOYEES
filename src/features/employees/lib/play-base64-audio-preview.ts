export function createAudioPreviewObjectUrl(input: {
  audioBase64: string;
  contentType: string;
}): string {
  const binary = atob(input.audioBase64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const blob = new Blob([bytes], { type: input.contentType });
  return URL.createObjectURL(blob);
}
