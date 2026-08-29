type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogFields {
  [key: string]: unknown;
}

function write(level: LogLevel, message: string, fields?: LogFields): void {
  const entry = {
    severity: level.toUpperCase(),
    message,
    timestamp: new Date().toISOString(),
    ...sanitize(fields),
  };
  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

function sanitize(fields?: LogFields): LogFields {
  if (!fields) {
    return {};
  }
  const forbidden = ["password", "privateKey", "secret", "authorization", "cardNumber", "cvc"];
  const clean: LogFields = {};
  for (const [key, value] of Object.entries(fields)) {
    if (forbidden.some((name) => key.toLowerCase().includes(name.toLowerCase()))) {
      clean[key] = "[redacted]";
      continue;
    }
    clean[key] = value;
  }
  return clean;
}

export const logger = {
  debug: (message: string, fields?: LogFields) => write("debug", message, fields),
  info: (message: string, fields?: LogFields) => write("info", message, fields),
  warn: (message: string, fields?: LogFields) => write("warn", message, fields),
  error: (message: string, fields?: LogFields) => write("error", message, fields),
};
