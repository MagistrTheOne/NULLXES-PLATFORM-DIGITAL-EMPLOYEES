export function buildDefaultAvatarPrompt(name: string, role: string): string {
  const trimmedName = name.trim();
  const trimmedRole = role.trim();

  if (!trimmedName && !trimmedRole) {
    return "";
  }

  if (trimmedName && trimmedRole) {
    return `Professional portrait of ${trimmedName}, ${trimmedRole}. Confident, approachable, business attire, studio lighting.`;
  }

  if (trimmedName) {
    return `Professional portrait of ${trimmedName}. Confident, approachable, business attire, studio lighting.`;
  }

  return `Professional portrait for a ${trimmedRole}. Confident, approachable, business attire, studio lighting.`;
}

export function base64ToImageFile(input: {
  base64: string;
  mimeType: string;
  fileName: string;
}): File {
  const binary = atob(input.base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], input.fileName, { type: input.mimeType });
}
