let opener: HTMLElement | null = null;

export function rememberNavigationOpener(link: HTMLAnchorElement) {
  const menu = link.closest('[role="menu"]');
  const triggerId = menu?.getAttribute("aria-labelledby");
  const trigger = triggerId ? document.getElementById(triggerId) : null;
  opener = trigger ?? link;
}

export function getNavigationOpener() {
  return opener?.isConnected ? opener : null;
}
