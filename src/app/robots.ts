import type { MetadataRoute } from "next";
import { SITE_URL } from "@/shared/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/dashboard",
          "/dashboard/",
          "/api/",
          "/login",
          "/register",
          "/settings",
          "/billing",
          "/accept-invite",
          "/analytics",
          "/employees",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
