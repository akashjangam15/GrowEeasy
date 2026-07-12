"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retry = retry;
/**
 * Retry a function up to `maxRetries` times with exponential backoff.
 *
 * @param fn          - Async function to execute
 * @param maxRetries  - Maximum number of retry attempts (default 3)
 * @param baseDelayMs - Base delay in milliseconds (default 1000). Doubles each retry.
 * @returns             The result of `fn` on success
 * @throws              The last error if all retries are exhausted
 */
async function retry(fn, maxRetries = 3, baseDelayMs = 1000) {
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            console.warn(`[retry] Attempt ${attempt + 1}/${maxRetries} failed: ${lastError.message}`);
            if (attempt < maxRetries - 1) {
                const delay = baseDelayMs * Math.pow(2, attempt);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
}
//# sourceMappingURL=retry.js.map