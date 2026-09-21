const DEFAULT_AVATAR = {
  url: 'https://cdn.aurora-profiles.dev/avatars/default.png',
  initials: '?',
  source: 'fallback',
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryable(error) {
  if (error?.name === 'AbortError') {
    return true;
  }

  const status = error?.status ?? error?.response?.status;

  // Retry 429 and 5xx
  if (status === 429 || (status >= 500 && status <= 599)) {
    return true;
  }

  // Network errors have no HTTP status
  if (status == null) {
    return true;
  }

  // Do not retry other 4xx errors
  return false;
}

async function withTimeout(operation, timeoutMs) {
  const controller = new AbortController();

  let timer;

  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();

      const error = new Error('Operation timed out');
      error.name = 'AbortError';
      reject(error);
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      operation(controller.signal),
      timeoutPromise,
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function withRetry(operation, options = {}) {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 25;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      // Don't retry non-retryable errors
      if (!isRetryable(error)) {
        throw error;
      }

      // Final attempt
      if (attempt === maxAttempts - 1) {
        throw error;
      }

      // Exponential backoff
      await sleep(baseDelayMs * 2 ** attempt);
    }
  }
}

async function getProfileWithAvatar(authorId, avatarClient, options = {}) {
  const timeoutMs = options.timeoutMs ?? 200;
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 25;

  try {
    const avatar = await withRetry(
      () =>
        withTimeout(
          signal => avatarClient.getAvatar(authorId, signal),
          timeoutMs
        ),
      {
        maxAttempts,
        baseDelayMs,
      }
    );

    return {
      authorId,
      avatar,
      degraded: false,
    };
  } catch (error) {
    return {
      authorId,
      avatar: DEFAULT_AVATAR,
      degraded: true,
    };
  }
}

module.exports = {
  DEFAULT_AVATAR,
  sleep,
  isRetryable,
  withTimeout,
  withRetry,
  getProfileWithAvatar,
};