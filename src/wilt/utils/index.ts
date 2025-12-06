import type { Context } from "hono";
import { getCookie } from "hono/cookie";

export function replaceTemplatePlaceholders(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] !== undefined ? String(data[key]) : match;
    });
}

/**
    * Extracts device/IP info from request
    */
export function extractRequestMetadata(c: Context<any>) {
    return {
        ipAddress: getCookie(c, "x-client-ip"),
        macAddress: getCookie(c, "x-client-mac"),
        deviceId: getCookie(c, "x-client-device"),
    };
}