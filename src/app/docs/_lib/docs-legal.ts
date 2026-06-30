export const DOCS_REPOSITORY_URL =
  "https://github.com/MagistrTheOne/NULLXES-PLATFORM-DIGITAL-EMPLOYEES.git";

export const DOCS_ASSISTANT = {
  name: "Yuki Nakora",
  role: "Ассистент документации · FAQ",
  initials: "YN",
  avatarUrl: process.env.NEXT_PUBLIC_YUKI_AVATAR_URL ?? "",
} as const;

export const DOCS_REPOSITORY_CLONE = `git clone ${DOCS_REPOSITORY_URL}
cd NULLXES-PLATFORM-DIGITAL-EMPLOYEES
npm install`;

export const DOCS_LEGAL_ENTITY = {
  shortName: 'ООО "НУЛЛЕКСЕС"',
  fullName:
    'ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "НУЛЛЕКСЕС"',
  brand: "NULLXES",
  ogrn: "1262300017209",
  inn: "2311391270",
  kpp: "231101001",
  registeredAt: "22.04.2026",
  director: "Онюшко Максим Олегович",
  directorEn: "Maxim Onyushko",
  email: "ceo@nullxes.com",
  telegram: "@MagistrTheOne",
  domain: "nullxesdai.online",
  docsUrl: "https://www.nullxesdai.online/docs",
} as const;
