import type { Metadata } from "next";
import {
  absoluteUrl,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_OG_IMAGE,
  SITE_TITLE_DEFAULT,
  SITE_URL,
} from "./site";

export type PageSeoInput = {
  title: string;
  description?: string;
  path?: string;
  /** Absolute title (no "| NULLXES" template). */
  absoluteTitle?: boolean;
  image?: {
    url: string;
    width?: number;
    height?: number;
    alt?: string;
  };
  noIndex?: boolean;
  keywords?: string[];
};

export function buildPageMetadata(input: PageSeoInput): Metadata {
  const description = input.description?.trim() || SITE_DESCRIPTION;
  const path = input.path ?? "/";
  const canonical = absoluteUrl(path);
  const title = input.absoluteTitle
    ? { absolute: input.title }
    : input.title;
  const image = input.image ?? SITE_OG_IMAGE;
  const ogImageUrl = image.url.startsWith("http")
    ? image.url
    : absoluteUrl(image.url);

  return {
    title,
    description,
    keywords: input.keywords,
    alternates: {
      canonical,
      languages: {
        ru: canonical,
        en: canonical,
        "x-default": canonical,
      },
    },
    openGraph: {
      type: "website",
      locale: "ru_RU",
      alternateLocale: ["en_US"],
      url: canonical,
      siteName: SITE_NAME,
      title: input.absoluteTitle ? input.title : `${input.title} | ${SITE_NAME}`,
      description,
      images: [
        {
          url: ogImageUrl,
          width: image.width ?? SITE_OG_IMAGE.width,
          height: image.height ?? SITE_OG_IMAGE.height,
          alt: image.alt ?? SITE_OG_IMAGE.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: input.absoluteTitle ? input.title : `${input.title} | ${SITE_NAME}`,
      description,
      images: [ogImageUrl],
    },
    robots: input.noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : { index: true, follow: true },
  };
}

export function buildRootMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    applicationName: SITE_NAME,
    title: {
      default: SITE_TITLE_DEFAULT,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    keywords: [...SITE_KEYWORDS],
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: "technology",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    icons: {
      icon: [{ url: "/favicon.ico" }],
      apple: [{ url: "/ADEINA.jpg", sizes: "1024x1024", type: "image/jpeg" }],
    },
    openGraph: {
      type: "website",
      locale: "ru_RU",
      alternateLocale: ["en_US"],
      url: SITE_URL,
      siteName: SITE_NAME,
      title: SITE_TITLE_DEFAULT,
      description: SITE_DESCRIPTION,
      images: [
        {
          url: SITE_OG_IMAGE.url,
          width: SITE_OG_IMAGE.width,
          height: SITE_OG_IMAGE.height,
          alt: SITE_OG_IMAGE.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_TITLE_DEFAULT,
      description: SITE_DESCRIPTION,
      images: [SITE_OG_IMAGE.url],
    },
    alternates: {
      canonical: SITE_URL,
      languages: {
        ru: SITE_URL,
        en: SITE_URL,
        "x-default": SITE_URL,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}
