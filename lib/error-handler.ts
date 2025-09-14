// Enhanced error handling and rate limiting for WordPress API

export interface APIError {
  code: string;
  message: string;
  status: number;
  retryable: boolean;
  retryAfter?: number;
}

export class WordPressAPIError extends Error {
  public code: string;
  public status: number;
  public retryable: boolean;
  public retryAfter?: number;

  constructor(error: APIError) {
    super(error.message);
    this.name = 'WordPressAPIError';
    this.code = error.code;
    this.status = error.status;
    this.retryable = error.retryable;
    this.retryAfter = error.retryAfter;
  }
}

// Rate limiting implementation
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }

  getRetryAfter(key: string): number {
    const requests = this.requests.get(key) || [];
    if (requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...requests);
    return Math.ceil((oldestRequest + this.windowMs - Date.now()) / 1000);
  }
}

export const rateLimiter = new RateLimiter();

// Error classification and handling
export function classifyError(error: any): APIError {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    
    switch (status) {
      case 400:
        return {
          code: 'BAD_REQUEST',
          message: data?.message || 'Invalid request parameters',
          status,
          retryable: false
        };
      
      case 401:
        return {
          code: 'UNAUTHORIZED',
          message: 'Authentication failed. Please check your credentials.',
          status,
          retryable: false
        };
      
      case 403:
        return {
          code: 'FORBIDDEN',
          message: 'Access denied. Please check your permissions.',
          status,
          retryable: false
        };
      
      case 404:
        return {
          code: 'NOT_FOUND',
          message: 'Resource not found',
          status,
          retryable: false
        };
      
      case 429:
        return {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again later.',
          status,
          retryable: true,
          retryAfter: parseInt(error.response.headers['retry-after'] || '60')
        };
      
      case 500:
        return {
          code: 'SERVER_ERROR',
          message: 'Internal server error. Please try again later.',
          status,
          retryable: true,
          retryAfter: 30
        };
      
      case 502:
      case 503:
      case 504:
        return {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Service temporarily unavailable. Please try again later.',
          status,
          retryable: true,
          retryAfter: 60
        };
      
      default:
        return {
          code: 'UNKNOWN_ERROR',
          message: data?.message || 'An unexpected error occurred',
          status,
          retryable: status >= 500
        };
    }
  }
  
  if (error.code === 'ECONNREFUSED') {
    return {
      code: 'CONNECTION_REFUSED',
      message: 'Cannot connect to WordPress site. Please check the URL and try again.',
      status: 0,
      retryable: true,
      retryAfter: 30
    };
  }
  
  if (error.code === 'ETIMEDOUT') {
    return {
      code: 'TIMEOUT',
      message: 'Request timed out. Please try again.',
      status: 0,
      retryable: true,
      retryAfter: 30
    };
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: error.message || 'An unexpected error occurred',
    status: 0,
    retryable: false
  };
}

// Retry logic with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const apiError = classifyError(error);
      
      if (!apiError.retryable || attempt === maxRetries) {
        throw new WordPressAPIError(apiError);
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      const retryAfter = apiError.retryAfter ? apiError.retryAfter * 1000 : delay;
      
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${retryAfter}ms...`, apiError.message);
      await new Promise(resolve => setTimeout(resolve, retryAfter));
    }
  }
  
  throw new WordPressAPIError(classifyError(lastError));
}

// Request interceptor with rate limiting
export function createRequestInterceptor() {
  return (config: any) => {
    const key = 'wordpress-api'; // You could make this more specific per user/site
    
    if (!rateLimiter.isAllowed(key)) {
      const retryAfter = rateLimiter.getRetryAfter(key);
      throw new WordPressAPIError({
        code: 'RATE_LIMITED',
        message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        status: 429,
        retryable: true,
        retryAfter
      });
    }
    
    return config;
  };
}

// Response interceptor for error handling
export function createResponseInterceptor() {
  return (response: any) => response;
}

export function createErrorInterceptor() {
  return (error: any) => {
    const apiError = classifyError(error);
    throw new WordPressAPIError(apiError);
  };
}

// User-friendly error messages
export function getErrorMessage(error: any): string {
  if (error instanceof WordPressAPIError) {
    return error.message;
  }
  
  const apiError = classifyError(error);
  return apiError.message;
}

// Error recovery suggestions
export function getErrorRecoverySuggestion(error: any): string | null {
  if (error instanceof WordPressAPIError) {
    switch (error.code) {
      case 'UNAUTHORIZED':
        return 'Please check your WordPress username and application password.';
      case 'FORBIDDEN':
        return 'Please ensure your WordPress user has the necessary permissions.';
      case 'RATE_LIMITED':
        return 'Please wait a moment before making another request.';
      case 'CONNECTION_REFUSED':
        return 'Please verify the WordPress site URL is correct and the site is accessible.';
      case 'SERVER_ERROR':
        return 'The WordPress site is experiencing issues. Please try again later.';
      default:
        return null;
    }
  }
  
  return null;
}

// Error logging
export function logError(error: any, context?: string) {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    context,
    error: error instanceof WordPressAPIError ? {
      code: error.code,
      message: error.message,
      status: error.status,
      retryable: error.retryable
    } : {
      message: error.message,
      stack: error.stack
    }
  };
  
  console.error('WordPress API Error:', errorInfo);
  
  // In production, you might want to send this to a logging service
  // e.g., Sentry, LogRocket, etc.
}

// Network status monitoring
export class NetworkMonitor {
  private isOnline: boolean = navigator.onLine;
  private listeners: Set<(online: boolean) => void> = new Set();

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });
  }

  addListener(listener: (online: boolean) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOnline));
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }
}

export const networkMonitor = new NetworkMonitor();
