const PREFIX = "[maps]";

export function mapDebugEnabled(): boolean {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.localStorage.getItem("maps-debug") === "1";
  } catch {
    return false;
  }
}

export function logMap(message: string, fields?: Record<string, unknown>): void {
  if (!mapDebugEnabled()) {
    return;
  }
  console.info(PREFIX, message, fields ?? {});
}

export function logMapWarn(message: string, fields?: Record<string, unknown>): void {
  console.warn(PREFIX, message, fields ?? {});
}

export function logMapError(message: string, fields?: Record<string, unknown>): void {
  console.error(PREFIX, message, fields ?? {});
}
