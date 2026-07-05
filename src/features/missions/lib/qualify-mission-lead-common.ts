export function evidenceInResearch(
  text: string | undefined,
  research: string,
): boolean {
  const snippet = text?.trim();
  if (!snippet) {
    return false;
  }

  return research.toLowerCase().includes(snippet.toLowerCase());
}

export function companyContextWindow(
  companyName: string,
  research: string,
): string | null {
  const company = companyName.trim();
  if (!company) {
    return null;
  }

  const index = research.toLowerCase().indexOf(company.toLowerCase());
  if (index === -1) {
    return null;
  }

  return research.slice(Math.max(0, index - 200), index + 400);
}
