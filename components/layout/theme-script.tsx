import { THEME_STORAGE_KEY } from "@/lib/stores/theme-key";

/**
 * Applies the stored theme before the first paint.
 *
 * Must render as a blocking script at the top of <head>: if it runs after the
 * stylesheet, the browser paints the default theme first and the page flashes.
 * It reads the key zustand `persist` writes:
 * `{ "state": { "theme": ... }, "version": n }`.
 */
const script = `
(function () {
  try {
    var root = document.documentElement;
    var query = window.matchMedia("(prefers-color-scheme: dark)");
    var read = function () {
      try {
        var raw = localStorage.getItem("${THEME_STORAGE_KEY}");
        var theme = raw && JSON.parse(raw).state.theme;
        return theme === "dark" || theme === "system" ? theme : "light";
      } catch (e) {
        return "light";
      }
    };
    var apply = function () {
      var theme = read();
      var dark = theme === "dark" || (theme === "system" && query.matches);
      root.classList.toggle("dark", dark);
      root.style.colorScheme = dark ? "dark" : "light";
    };
    apply();
    query.addEventListener("change", apply);
  } catch (e) {}
})();
`;

export function ThemeScript() {
  // No `id` and no `strategy`: React hoists identified scripts out of the head,
  // which reintroduces the flash. A plain inline script stays where rendered.
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
