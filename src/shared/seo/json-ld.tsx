import {
  absoluteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_OG_IMAGE,
  SITE_TAGLINE,
  SITE_TITLE_DEFAULT,
  SITE_URL,
} from "./site";

export type JsonLdGraph = Record<string, unknown> | Record<string, unknown>[];

export function siteJsonLdGraph(): Record<string, unknown> {
  const logoUrl = absoluteUrl("/ADEINA.jpg");
  const imageUrl = absoluteUrl(SITE_OG_IMAGE.url);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: logoUrl,
        },
        description: SITE_DESCRIPTION,
        sameAs: [],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: ["ru", "en"],
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/docs?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#software`,
        name: `${SITE_NAME} Digital Employees`,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: SITE_URL,
        image: imageUrl,
        description: SITE_DESCRIPTION,
        slogan: SITE_TAGLINE,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: "Evaluation plan available",
          url: absoluteUrl("/#pricing"),
        },
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#webpage`,
        url: SITE_URL,
        name: SITE_TITLE_DEFAULT,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#software` },
        description: SITE_DESCRIPTION,
        inLanguage: ["ru", "en"],
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: imageUrl,
        },
      },
    ],
  };
}

export function JsonLd({ data }: { data: JsonLdGraph }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
