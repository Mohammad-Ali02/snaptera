/* Turns the "Launch SnapDox" controls live when SnapDox is running locally.
 *
 * SnapDox is a program on the visitor's own machine, not a hosted service, so
 * the page has to find out whether it is actually running before promising a
 * button will work.
 *
 * The probe is a no-cors fetch. We can't read an opaque response, but the
 * promise resolving at all proves something answered on the port — which is
 * the only fact we need. A normal fetch would fail even when SnapDox is up,
 * because it sends no cross-origin headers, and it should not: a local
 * converter has no business accepting commands from arbitrary websites.
 */
(() => {
  "use strict";

  const ORIGIN = "http://localhost:5000";
  const PROBE_PATH = "/api/targets/pdf";
  const TIMEOUT_MS = 2500;

  const running = async () => {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);
    try {
      await fetch(ORIGIN + PROBE_PATH, {
        mode: "no-cors",
        cache: "no-store",
        signal: abort.signal,
      });
      return true;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  };

  const setState = (state) => {
    document.querySelectorAll("[data-launch]").forEach((el) => {
      el.dataset.launch = state;
    });
  };

  const wireCopyButtons = () => {
    document.querySelectorAll("[data-copy]").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(button.dataset.copy);
          const original = button.textContent;
          button.textContent = "Copied";
          setTimeout(() => {
            button.textContent = original;
          }, 1600);
        } catch {
          // Clipboard access can be refused; the command is visible anyway.
        }
      });
    });
  };

  const wireLaunchButtons = (isUp) => {
    document.querySelectorAll("[data-launch-link]").forEach((link) => {
      link.addEventListener("click", (event) => {
        if (isUp) return; // let the browser open it normally
        // Opening a tab that can only show a connection error helps nobody.
        event.preventDefault();
        const help = document.getElementById("launch-help");
        if (help) {
          help.hidden = false;
          help.scrollIntoView({ behavior: "smooth", block: "center" });
          help.focus({ preventScroll: true });
        }
      });
    });
  };

  const start = async () => {
    if (!document.querySelector("[data-launch]")) return;
    wireCopyButtons();
    setState("checking");

    const isUp = await running();
    setState(isUp ? "running" : "stopped");
    wireLaunchButtons(isUp);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
