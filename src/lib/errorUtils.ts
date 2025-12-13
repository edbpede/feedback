import type { ErrorDetails } from "@lib/types";

/** Error categories for user-friendly error messages */
export type ErrorCategory =
  | "network"
  | "timeout"
  | "rateLimit"
  | "serverError"
  | "authError"
  | "modelUnavailable"
  | "badRequest"
  | "unknown";

/** Error information for UI display */
export interface ErrorInfo {
  category: ErrorCategory;
  titleKey: string;
  messageKey: string;
  icon: string;
  retryable: boolean;
}

/** Custom error class with structured error information */
export class ApiError extends Error {
  readonly status: number;
  readonly category: ErrorCategory;
  readonly retryable: boolean;

  constructor(status: number, message: string, retryable: boolean = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.category = categorizeError(status);
    this.retryable = retryable;
  }
}

/**
 * Categorize an HTTP status code into a user-friendly error category.
 * Status 0 indicates a network error (fetch failed).
 */
export function categorizeError(status: number, errorDetails?: ErrorDetails): ErrorCategory {
  // Network errors (status 0 means fetch failed)
  if (status === 0) {
    return "network";
  }

  // Check for specific error types from API response
  if (errorDetails?.type === "model_unavailable" || errorDetails?.code === "model_not_found") {
    return "modelUnavailable";
  }

  // Map HTTP status codes to categories
  switch (status) {
    case 408:
      return "timeout";
    case 429:
      return "rateLimit";
    case 500:
    case 502:
    case 503:
    case 504:
      return "serverError";
    case 401:
    case 403:
      return "authError";
    case 400:
      return "badRequest";
    case 404:
      return "modelUnavailable";
    default:
      return "unknown";
  }
}

/** Error info lookup table */
const errorInfoMap: Record<ErrorCategory, ErrorInfo> = {
  network: {
    category: "network",
    titleKey: "errors.network.title",
    messageKey: "errors.network.message",
    icon: "i-carbon-wifi-off",
    retryable: true,
  },
  timeout: {
    category: "timeout",
    titleKey: "errors.timeout.title",
    messageKey: "errors.timeout.message",
    icon: "i-carbon-timer",
    retryable: true,
  },
  rateLimit: {
    category: "rateLimit",
    titleKey: "errors.rateLimit.title",
    messageKey: "errors.rateLimit.message",
    icon: "i-carbon-hourglass",
    retryable: true,
  },
  serverError: {
    category: "serverError",
    titleKey: "errors.serverError.title",
    messageKey: "errors.serverError.message",
    icon: "i-carbon-warning-alt",
    retryable: true,
  },
  authError: {
    category: "authError",
    titleKey: "errors.authError.title",
    messageKey: "errors.authError.message",
    icon: "i-carbon-locked",
    retryable: false,
  },
  modelUnavailable: {
    category: "modelUnavailable",
    titleKey: "errors.modelUnavailable.title",
    messageKey: "errors.modelUnavailable.message",
    icon: "i-carbon-machine-learning-model",
    retryable: false,
  },
  badRequest: {
    category: "badRequest",
    titleKey: "errors.badRequest.title",
    messageKey: "errors.badRequest.message",
    icon: "i-carbon-warning",
    retryable: false,
  },
  unknown: {
    category: "unknown",
    titleKey: "errors.unknown.title",
    messageKey: "errors.unknown.message",
    icon: "i-carbon-warning-hex",
    retryable: true,
  },
};

/**
 * Get error display information for a given error category.
 */
export function getErrorInfo(category: ErrorCategory): ErrorInfo {
  return errorInfoMap[category];
}
