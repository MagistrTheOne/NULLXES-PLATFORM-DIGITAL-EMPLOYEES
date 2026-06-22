const HANDOFF_PATTERN =
  /\b(hand[\s-]?off|transfer\s+to|pass\s+(?:this\s+)?to|another\s+(?:digital\s+)?employee|передай|переключ(?:и|ить)|переадрес)/iu;

const FOLLOW_UP_TASK_PATTERN =
  /\b(remind\s+me|follow[\s-]?up|create\s+(?:a\s+)?task|schedule\s+(?:a\s+)?|напомни|создай\s+задач|поставь\s+задач)/iu;

export function shouldRunTalkToolLoop(lastUserMessage: string): boolean {
  const trimmed = lastUserMessage.trim();
  if (!trimmed) {
    return false;
  }

  return (
    HANDOFF_PATTERN.test(trimmed) || FOLLOW_UP_TASK_PATTERN.test(trimmed)
  );
}
