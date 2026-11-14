import { isApiError } from '../../api/errors';

/** One readable line for a failed request; server messages are kept as they are. */
export function describeError(error: unknown): string {
  if (isApiError(error)) {
    if (error.code === 'network_error') return 'The server could not be reached.';
    return error.message;
  }
  return error instanceof Error ? error.message : 'The request failed.';
}
