/**
 * Validation utilities for data integrity and safety
 */
import { z } from 'zod';
import DOMPurify from 'dompurify';

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize text content (strip all HTML)
 */
export function sanitizeText(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}

/**
 * Validate and sanitize condition expressions
 */
export function validateCondition(condition: string): {
  valid: boolean;
  sanitized: string;
  error?: string;
} {
  try {
    // Strip dangerous characters
    const sanitized = condition
      .replace(/[;&|`$()]/g, '')
      .trim();

    // Basic validation: check for valid variable syntax
    if (sanitized && !/^[a-zA-Z_][a-zA-Z0-9_]*\s*(==|!=|>|<|>=|<=)\s*.+$/.test(sanitized)) {
      return {
        valid: false,
        sanitized,
        error: 'Invalid condition format. Use: variable operator value',
      };
    }

    return { valid: true, sanitized };
  } catch (error) {
    return {
      valid: false,
      sanitized: condition,
      error: error instanceof Error ? error.message : 'Validation failed',
    };
  }
}

/**
 * Clamp number within range
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Validate number is finite and not NaN
 */
export function validateNumber(
  value: unknown,
  fallback: number = 0
): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

/**
 * Generate unique ID with timestamp prefix to avoid collisions
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate story node data schema
 */
export const StoryNodeSchema = z.object({
  id: z.string(),
  type: z.enum(['start', 'dialogue', 'choice', 'branch', 'variable', 'end']),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Validate project data schema
 */
export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  type: z.enum(['raster', 'vector', 'story', 'character']),
  thumbnail: z.string(),
  width: z.number().positive(),
  height: z.number().positive(),
  fps: z.number().positive().optional(),
  createdAt: z.string(),
  modifiedAt: z.string(),
});

/**
 * Validate array has unique values
 */
export function hasUniqueValues<T>(arr: T[]): boolean {
  return new Set(arr).size === arr.length;
}

/**
 * Ensure array is within size limit
 */
export function enforceLimit<T>(
  arr: T[],
  limit: number,
  name: string = 'items'
): T[] {
  if (arr.length > limit) {
    console.warn(`${name} exceeds limit (${arr.length}/${limit}), truncating`);
    return arr.slice(0, limit);
  }
  return arr;
}

/**
 * Deep merge objects (lodash.merge alternative for simple cases)
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  source: Partial<T>
): T {
  const output = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = output[key];
      
      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === 'object'
      ) {
        output[key] = deepMerge(targetValue, sourceValue);
      } else {
        output[key] = sourceValue as T[Extract<keyof T, string>];
      }
    }
  }
  
  return output;
}

/**
 * Check if object is empty
 */
export function isEmpty(obj: unknown): boolean {
  if (obj === null || obj === undefined) return true;
  if (typeof obj !== 'object') return false;
  return Object.keys(obj).length === 0;
}
