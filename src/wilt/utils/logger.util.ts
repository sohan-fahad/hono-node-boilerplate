export enum LogLevel {
	ERROR = "error",
	WARN = "warn",
	INFO = "info",
	DEBUG = "debug",
}

// ANSI color codes for terminal output
const colors = {
	reset: "\x1b[0m",
	bright: "\x1b[1m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
	cyan: "\x1b[36m",
	gray: "\x1b[90m",
};

// HTTP status code colors
function getStatusColor(status: number): string {
	if (status >= 500) return colors.red;
	if (status >= 400) return colors.yellow;
	if (status >= 300) return colors.cyan;
	if (status >= 200) return colors.green;
	return colors.gray;
}

// HTTP method colors
function getMethodColor(method: string): string {
	switch (method) {
		case "GET":
			return colors.green;
		case "POST":
			return colors.blue;
		case "PUT":
			return colors.yellow;
		case "DELETE":
			return colors.red;
		case "PATCH":
			return colors.magenta;
		default:
			return colors.gray;
	}
}

export class Logger {
	private static instance: Logger;
	private logLevel: LogLevel;
	private enableColors: boolean;

	private constructor() {
		this.logLevel = LogLevel.INFO;
		this.enableColors = true; // Enable colors by default
	}

	public static getInstance(): Logger {
		if (!Logger.instance) {
			Logger.instance = new Logger();
		}
		return Logger.instance;
	}

	private shouldLog(level: LogLevel): boolean {
		const levels = Object.values(LogLevel);
		const currentLevelIndex = levels.indexOf(this.logLevel);
		const messageLevelIndex = levels.indexOf(level);
		return messageLevelIndex <= currentLevelIndex;
	}

	private formatMessage(level: LogLevel, message: string, context?: string): string {
		const timestamp = new Date().toISOString();
		const contextStr = context ? ` [${context}]` : "";
		const baseMessage = `[${timestamp}] ${level.toUpperCase()}${contextStr}: ${message}`;

		if (!this.enableColors) return baseMessage;

		const colorMap = {
			[LogLevel.ERROR]: colors.red,
			[LogLevel.WARN]: colors.yellow,
			[LogLevel.INFO]: colors.blue,
			[LogLevel.DEBUG]: colors.gray,
		};

		return `${colorMap[level]}${baseMessage}${colors.reset}`;
	}

	// HTTP request logging (like Hono's logger)
	http(method: string, path: string, status: number, duration: number, userAgent?: string): void {
		if (!this.shouldLog(LogLevel.INFO)) return;

		const methodColor = this.enableColors ? getMethodColor(method) : "";
		const statusColor = this.enableColors ? getStatusColor(status) : "";
		const reset = this.enableColors ? colors.reset : "";

		const methodStr = `${methodColor}${method}${reset}`;
		const statusStr = `${statusColor}${status}${reset}`;
		const durationStr = duration > 1000 ? `${colors.red}${duration}ms${reset}` : `${duration}ms`;

		const logMessage = `${methodStr} ${path} ${statusStr} ${durationStr}`;

		if (userAgent) {
			console.log(`${logMessage} - ${colors.gray}${userAgent}${reset}`);
		} else {
			console.log(logMessage);
		}
	}

	// Standard logging methods
	error(message: string, context?: string): void {
		if (this.shouldLog(LogLevel.ERROR)) {
			console.error(this.formatMessage(LogLevel.ERROR, message, context));
		}
	}

	warn(message: string, context?: string): void {
		if (this.shouldLog(LogLevel.WARN)) {
			console.warn(this.formatMessage(LogLevel.WARN, message, context));
		}
	}

	info(message: string, context?: string): void {
		if (this.shouldLog(LogLevel.INFO)) {
			console.info(this.formatMessage(LogLevel.INFO, message, context));
		}
	}

	debug(message: string, context?: string): void {
		if (this.shouldLog(LogLevel.DEBUG)) {
			console.debug(this.formatMessage(LogLevel.DEBUG, message, context));
		}
	}

	// Static methods for convenience
	static http(method: string, path: string, status: number, duration: number, userAgent?: string): void {
		Logger.getInstance().http(method, path, status, duration, userAgent);
	}

	static error(message: string, context?: string): void {
		Logger.getInstance().error(message, context);
	}

	static warn(message: string, context?: string): void {
		Logger.getInstance().warn(message, context);
	}

	static info(message: string, context?: string): void {
		Logger.getInstance().info(message, context);
	}

	static debug(message: string, context?: string): void {
		Logger.getInstance().debug(message, context);
	}

	// Configuration methods
	setLogLevel(level: LogLevel): void {
		this.logLevel = level;
	}

	setColors(enabled: boolean): void {
		this.enableColors = enabled;
	}
}

export const logger = Logger.getInstance();
