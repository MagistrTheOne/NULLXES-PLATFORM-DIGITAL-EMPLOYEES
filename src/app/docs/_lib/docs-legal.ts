export const DOCS_REPOSITORY_URL =
  "https://github.com/MagistrTheOne/NULLXES-PLATFORM-DIGITAL-EMPLOYEES.git";

export const DOCS_REPOSITORY_CLONE = `git clone ${DOCS_REPOSITORY_URL}
cd NULLXES-PLATFORM-DIGITAL-EMPLOYEES
npm install`;

/** Legal entity — ООО «НУЛЛЕКСЕС» (EGRUL / Rusprofile). */
export const DOCS_LEGAL_ENTITY = {
  shortName: 'ООО "НУЛЛЕКСЕС"',
  fullName: 'ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "НУЛЛЕКСЕС"',
  brand: "NULLXES",
  ogrn: "1262300017209",
  inn: "2311391270",
  kpp: "231101001",
  okpo: "85219177",
  registeredAt: "22.04.2026",
  director: "Онюшко Максим Олегович",
  directorTitle: "Генеральный директор",
  directorEn: "Maxim Onyushko",
  email: "ceo@nullxes.com",
  telegram: "@MagistrTheOne",
  telegramUrl: "https://t.me/MagistrTheOne",
  domain: "nullxesdai.online",
  siteUrl: "https://www.nullxesdai.online",
  docsUrl: "https://www.nullxesdai.online/docs",
  address:
    "350022, Краснодарский край, г. Краснодар, ул. Черкасская, д. 131, помещ. 1012",
  addressShort: "г. Краснодар, ул. Черкасская, 131, помещ. 1012",
  rusprofileUrl: "https://www.rusprofile.ru/id/1262300017209",
  activity: "Разработка компьютерного программного обеспечения (62.01)",
} as const;
