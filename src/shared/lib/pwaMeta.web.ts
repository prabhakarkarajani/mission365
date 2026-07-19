/**
 * Injects PWA manifest/meta tags at runtime instead of via a custom root
 * HTML template (app/+html.tsx), since that mechanism only applies when
 * `web.output` is "static" or "server" — this app uses the default "single"
 * SPA output because Expo's static export can't serve dynamic routes like
 * /habits/[habitId] on a direct load/refresh without extra host-specific
 * rewrite config. This runs once and works regardless of output mode.
 */
function addLink(rel: string, href: string) {
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  document.head.appendChild(link);
}

function addMeta(name: string, content: string) {
  const meta = document.createElement('meta');
  meta.name = name;
  meta.content = content;
  document.head.appendChild(meta);
}

let injected = false;

export function injectPwaMeta(): void {
  if (injected) return;
  injected = true;

  document.title = 'Mission365';
  addLink('manifest', '/manifest.json');
  addLink('apple-touch-icon', '/apple-touch-icon.png');
  addMeta('theme-color', '#4F46E5');
  addMeta('apple-mobile-web-app-capable', 'yes');
  addMeta('apple-mobile-web-app-status-bar-style', 'default');
  addMeta('apple-mobile-web-app-title', 'Mission365');
}
