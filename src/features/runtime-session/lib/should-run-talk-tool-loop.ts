const HANDOFF_PATTERN =
  /\b(hand[\s-]?off|transfer\s+to|pass\s+(?:this\s+)?to|another\s+(?:digital\s+)?employee|передай|переключ(?:и|ить)|переадрес)/iu;

const FOLLOW_UP_TASK_PATTERN =
  /\b(remind\s+me|follow[\s-]?up|create\s+(?:a\s+)?task|schedule\s+(?:a\s+)?|напомни|создай\s+задач|поставь\s+задач)/iu;

const MISSION_PATTERN =
  /\b(mission|missions|outbound|prospect(?:ing)?|assignment|assignments|campaign|outreach|lead|leads|task|tasks|очеред\w*|мисси\w*|задани\w*|задач\w*|поручени\w*|проспект\w*|аутрич|лид\w*|кампани\w*)/iu;

const CHAT_PLATFORM_STATUS_PATTERN =
  /\b(статус|status|progress|прогресс|updates?|success\s+rate|статистик\w*|что\s+(?:по|в\s+работе)|как\s+дела\s+с|чем\s+занят|твои?\s+задач|мои?\s+задач|what\s+(?:are\s+you|have\s+you\s+been)\s+working|what(?:'s|\s+is)\s+(?:on\s+)?(?:your\s+)?(?:plate|queue)|how\s+are\s+(?:the\s+)?missions|what(?:'s|\s+is)\s+(?:the\s+)?status)/iu;

const WEB_SEARCH_PATTERN =
  /\b(search\s+(?:the\s+)?web|look\s+up|find\s+(?:out\s+)?(?:the\s+)?latest|what(?:'s|\s+is)\s+(?:the\s+)?(?:latest|current)|current\s+(?:news|price|rate)|today(?:'s)?|right\s+now|news\s+about|weather|stock\s+price|курс|новости|найди\s+(?:в\s+)?(?:интернет|сети)|поищи|что\s+сейчас|актуальн)/iu;

export function shouldRunTalkWebSearch(lastUserMessage: string): boolean {
  const trimmed = lastUserMessage.trim();
  if (!trimmed) {
    return false;
  }

  return WEB_SEARCH_PATTERN.test(trimmed);
}

export function shouldRunMissionTools(lastUserMessage: string): boolean {
  const trimmed = lastUserMessage.trim();
  if (!trimmed) {
    return false;
  }

  return MISSION_PATTERN.test(trimmed);
}

/** Text chat (Conversations / sidebar): broader platform queries than voice. */
export function shouldRunChatToolLoop(lastUserMessage: string): boolean {
  const trimmed = lastUserMessage.trim();
  if (!trimmed) {
    return false;
  }

  return (
    shouldRunTalkToolLoop(trimmed) ||
    shouldRunMissionTools(trimmed) ||
    CHAT_PLATFORM_STATUS_PATTERN.test(trimmed)
  );
}

export function shouldRunTalkToolLoop(lastUserMessage: string): boolean {
  const trimmed = lastUserMessage.trim();
  if (!trimmed) {
    return false;
  }

  return (
    HANDOFF_PATTERN.test(trimmed) ||
    FOLLOW_UP_TASK_PATTERN.test(trimmed) ||
    shouldRunMissionTools(trimmed)
  );
}
