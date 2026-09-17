/**
 * Storage key shared by the zustand theme store and the blocking script in the
 * document head.
 *
 * Kept in its own module with no "use client" directive: importing it from a
 * client module would turn it into a client reference in the server component
 * that renders the script, corrupting the emitted JavaScript.
 */
export const THEME_STORAGE_KEY = "daisy-theme";
