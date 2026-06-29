const HANDOFF_PATTERN =
  /\b(hand[\s-]?off|transfer\s+to|pass\s+(?:this\s+)?to|another\s+(?:digital\s+)?employee|передай|переключ(?:и|ить)|переадрес)/iu;

const FOLLOW_UP_TASK_PATTERN =
  /\b(remind\s+me|follow[\s-]?up|create\s+(?:a\s+)?task|schedule\s+(?:a\s+)?|напомни|создай\s+задач|поставь\s+задач)/iu;

const WEB_SEARCH_PATTERN =
  /\b(search\s+(?:the\s+)?web|look\s+up|find\s+(?:out\s+)?(?:the\s+)?latest|what(?:'s|\s+is)\s+(?:the\s+)?(?:latest|current)|current\s+(?:news|price|rate)|today(?:'s)?|right\s+now|news\s+about|weather|stock\s+price|курс|новости|найди\s+(?:в\s+)?(?:интернет|сети)|поищи|что\s+сейчас|актуальн)/iu;

export function shouldRunTalkWebSearch(lastUserMessage: string): boolean {
  const trimmed = lastUserMessage.trim();
  if (!trimmed) {
    return false;
  }

  return WEB_SEARCH_PATTERN.test(trimmed);
}

export function shouldRunTalkToolLoop(lastUserMessage: string): boolean {
  const trimmed = lastUserMessage.trim();
  if (!trimmed) {
    return false;
  }

  return (
    HANDOFF_PATTERN.test(trimmed) || FOLLOW_UP_TASK_PATTERN.test(trimmed)
  );
}
