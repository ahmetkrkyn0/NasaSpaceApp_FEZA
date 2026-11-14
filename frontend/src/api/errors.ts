/**
 * One error type for every failed call. Server errors keep the server's `code` and `message`
 * (ADR-0004, "Hata yanıtı"); failures that never reached a valid server answer get a client code.
 */

import type { ServerErrorCode } from './types';

/** Codes produced on this side, never by the server. */
export type ClientErrorCode =
  /** The request did not reach the server (offline, proxy down, CORS). */
  | 'network_error'
  /** The server answered with an error status but without the contract's error body. */
  | 'http_error'
  /** The server answered 2xx but the body could not be read as expected. */
  | 'invalid_response'
  /** The request was cancelled with an AbortSignal. */
  | 'aborted';

export type ApiErrorCode = ServerErrorCode | ClientErrorCode;

export class ApiError extends Error {
  /** Server code (`site_not_found`, `invalid_parameter`, ...) or a client code. Unknown server codes are kept as is. */
  readonly code: ApiErrorCode | string;
  /** HTTP status, or `null` when there was no HTTP answer. */
  readonly status: number | null;

  constructor(code: ApiErrorCode | string, message: string, status: number | null = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

function readErrorBody(text: string): { code: string; message: string } | null {
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const error = (parsed as { error?: unknown }).error;
    if (typeof error !== 'object' || error === null) return null;
    const { code, message } = error as { code?: unknown; message?: unknown };
    if (typeof code !== 'string' || typeof message !== 'string') return null;
    return { code, message };
  } catch {
    return null;
  }
}

/**
 * Turns a non-2xx answer into an ApiError. The contract body
 * `{ "error": { "code", "message" } }` is kept exactly; anything else becomes `http_error`.
 */
export function errorFromResponse(status: number, statusText: string, bodyText: string): ApiError {
  const body = readErrorBody(bodyText);
  if (body) return new ApiError(body.code, body.message, status);
  const label = statusText ? `${status} ${statusText}` : String(status);
  return new ApiError('http_error', `The server answered ${label} without an error body.`, status);
}

/** Wraps anything thrown by `fetch` or by reading a body. */
export function errorFromThrown(thrown: unknown): ApiError {
  if (thrown instanceof ApiError) return thrown;
  if (typeof thrown === 'object' && thrown !== null && (thrown as { name?: unknown }).name === 'AbortError') {
    return new ApiError('aborted', 'The request was cancelled.');
  }
  const detail = thrown instanceof Error ? thrown.message : String(thrown);
  return new ApiError('network_error', `Cannot reach the server: ${detail}`);
}
