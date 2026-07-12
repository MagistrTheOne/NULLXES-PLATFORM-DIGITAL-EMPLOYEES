import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/api/", "/login", "/register"],
    },
    sitemap: "https://www.nullxesdai.online/sitemap.xml",
    host: "https://www.nullxesdai.online",
  };
}
