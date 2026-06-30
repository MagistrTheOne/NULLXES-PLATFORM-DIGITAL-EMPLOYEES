import { DocsAssistantChat } from "../_components/docs-assistant-chat";

export default function DocsAssistantPage() {
  return (
    <article className="flex flex-col gap-8">
      <header id="assistant" className="scroll-mt-24">
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Чат с ассистентом
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          Yuki Nakora отвечает на частые вопросы по документации NULLXES Digital
          Employees: установка, исходный код, миссии, LLM и персональные данные.
          Для сложных запросов используйте контакты правообладателя.
        </p>
      </header>

      <DocsAssistantChat />

      <section
        id="contacts"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6 text-sm text-white/60"
      >
        <h3 className="font-medium text-white">Контакты правообладателя</h3>
        <ul className="mt-4 space-y-2">
          <li>
            Руководитель:{" "}
            <span className="text-white">Онюшко Максим Олегович</span> (Maxim
            Onyushko)
          </li>
          <li>
            Email:{" "}
            <a href="mailto:ceo@nullxes.com" className="text-white underline">
              ceo@nullxes.com
            </a>
          </li>
          <li>
            Telegram:{" "}
            <a
              href="https://t.me/MagistrTheOne"
              className="text-white underline"
              target="_blank"
              rel="noreferrer"
            >
              @MagistrTheOne
            </a>
          </li>
        </ul>
      </section>
    </article>
  );
}
