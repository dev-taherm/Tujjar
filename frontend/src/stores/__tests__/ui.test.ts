import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../index";

describe("useUIStore", () => {
  beforeEach(() => {
    useUIStore.setState({
      sidebarOpen: true,
      theme: "system",
    });
  });

  describe("sidebar", () => {
    it("has sidebar open by default", () => {
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });

    it("toggles sidebar", () => {
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(false);

      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });

    it("sets sidebar open", () => {
      useUIStore.getState().setSidebarOpen(false);
      expect(useUIStore.getState().sidebarOpen).toBe(false);

      useUIStore.getState().setSidebarOpen(true);
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });
  });

  describe("theme", () => {
    it("defaults to system theme", () => {
      expect(useUIStore.getState().theme).toBe("system");
    });

    it("sets theme to light", () => {
      useUIStore.getState().setTheme("light");
      expect(useUIStore.getState().theme).toBe("light");
    });

    it("sets theme to dark", () => {
      useUIStore.getState().setTheme("dark");
      expect(useUIStore.getState().theme).toBe("dark");
    });

    it("sets theme back to system", () => {
      useUIStore.getState().setTheme("light");
      useUIStore.getState().setTheme("system");
      expect(useUIStore.getState().theme).toBe("system");
    });
  });
});
