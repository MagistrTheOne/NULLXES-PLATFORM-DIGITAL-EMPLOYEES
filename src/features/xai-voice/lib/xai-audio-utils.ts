export function float32ToPcm16Base64(samples: Float32Array): string {
  const pcm = new Int16Array(samples.length);
  for (let index = 0; index < samples.length; index += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[index] ?? 0));
    pcm[index] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }

  const bytes = new Uint8Array(pcm.buffer);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]!);
  }

  return btoa(binary);
}

export function base64Pcm16ToFloat32(base64Audio: string): Float32Array {
  const binary = atob(base64Audio);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const pcm = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(pcm.length);
  for (let index = 0; index < pcm.length; index += 1) {
    float32[index] = pcm[index]! / (pcm[index]! < 0 ? 0x8000 : 0x7fff);
  }

  return float32;
}
