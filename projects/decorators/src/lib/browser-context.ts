/**
 * Abstraction layer for browser context specific logic
 */
export class BrowserContext {
    public static getQueryParameters(): URLSearchParams {
        return new URLSearchParams(window.location.search);
    }

    public static getPath(): string {
        return window.location.pathname;
    }

    public static pushHistoryState(path: string) {
        window.history.pushState(path, "", path);
    }

    public static replaceHistoryState(path: string) {
        window.history.replaceState(path, "", path);
    }
}
