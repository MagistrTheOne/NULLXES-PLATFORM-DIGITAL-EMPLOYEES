/**
 * Emits Cloudflare Scrape Shield markers so Email Obfuscation does not rewrite
 * HTML between the markers (avoids React hydration #418 behind orange-cloud).
 *
 * @see https://developers.cloudflare.com/waf/tools/scrape-shield/email-address-obfuscation/
 */
export function CloudflareEmailOffOpen() {
  return (
    <span
      aria-hidden
      className="hidden"
      dangerouslySetInnerHTML={{ __html: "<!--email_off-->" }}
    />
  );
}

export function CloudflareEmailOffClose() {
  return (
    <span
      aria-hidden
      className="hidden"
      dangerouslySetInnerHTML={{ __html: "<!--/email_off-->" }}
    />
  );
}
