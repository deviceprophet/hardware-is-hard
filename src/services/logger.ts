/**
 * Logging Service
 *
 * Centralized logging with configurable levels and optional external reporting.
 * Replaces console.log/error throughout the application.
 */

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4
}

interface LogEntry {
    level: LogLevel;
    message: string;
    data?: unknown;
    timestamp: Date;
    context?: string;
}

interface LoggerConfig {
    level: LogLevel;
    enableConsole: boolean;
    onError?: (entry: LogEntry) => void;
}

class Logger {
    private config: LoggerConfig = {
        level: LogLevel.INFO,
        enableConsole: true
    };

    private history: LogEntry[] = [];
    private readonly maxHistory = 100;

    configure(config: Partial<LoggerConfig>): void {
        this.config = { ...this.config, ...config };
    }

    private log(level: LogLevel, message: string, data?: unknown, context?: string): void {
        if (level < this.config.level) return;

        const entry: LogEntry = {
            level,
            message,
            data,
            timestamp: new Date(),
            context
        };

        // Store in history
        this.history.push(entry);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }

        // Console output
        if (this.config.enableConsole) {
            const prefix = context ? `[${context}]` : '';
            const levelStr = LogLevel[level];

            switch (level) {
                case LogLevel.DEBUG:
                    console.debug(`${levelStr} ${prefix}`, message, data ?? '');
                    break;
                case LogLevel.INFO:
                    console.info(`${levelStr} ${prefix}`, message, data ?? '');
                    break;
                case LogLevel.WARN:
                    console.warn(`${levelStr} ${prefix}`, message, data ?? '');
                    break;
                case LogLevel.ERROR:
                    console.error(`${levelStr} ${prefix}`, message, data ?? '');
                    break;
            }
        }

        // External error reporting
        if (level === LogLevel.ERROR && this.config.onError) {
            this.config.onError(entry);
        }
    }

    debug(message: string, data?: unknown, context?: string): void {
        this.log(LogLevel.DEBUG, message, data, context);
    }

    info(message: string, data?: unknown, context?: string): void {
        this.log(LogLevel.INFO, message, data, context);
    }

    warn(message: string, data?: unknown, context?: string): void {
        this.log(LogLevel.WARN, message, data, context);
    }

    error(message: string, data?: unknown, context?: string): void {
        this.log(LogLevel.ERROR, message, data, context);
    }

    getHistory(): readonly LogEntry[] {
        return [...this.history];
    }

    clearHistory(): void {
        this.history = [];
    }
}

// Singleton instance
export const logger = new Logger();

// Convenience function to create a scoped logger
export function createLogger(context: string) {
    return {
        debug: (message: string, data?: unknown) => logger.debug(message, data, context),
        info: (message: string, data?: unknown) => logger.info(message, data, context),
        warn: (message: string, data?: unknown) => logger.warn(message, data, context),
        error: (message: string, data?: unknown) => logger.error(message, data, context)
    };
}

export default logger;
