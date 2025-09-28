interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

class PixabayRateLimiter {
  private rateLimitInfo: RateLimitInfo | null = null;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;

  async makeRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      // Check if we have rate limit info and if we're rate limited
      if (this.rateLimitInfo && this.rateLimitInfo.remaining <= 0) {
        const waitTime = this.rateLimitInfo.reset * 1000 - Date.now();
        if (waitTime > 0) {
          console.log(`⏰ [PIXABAY RATE LIMITER] Rate limited. Waiting ${waitTime}ms`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }

      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('❌ [PIXABAY RATE LIMITER] Request failed:', error);
        }
      }
    }

    this.isProcessing = false;
  }

  updateRateLimit(headers: Headers) {
    const limit = headers.get('X-RateLimit-Limit');
    const remaining = headers.get('X-RateLimit-Remaining');
    const reset = headers.get('X-RateLimit-Reset');

    if (limit && remaining && reset) {
      this.rateLimitInfo = {
        limit: parseInt(limit),
        remaining: parseInt(remaining),
        reset: parseInt(reset)
      };
      
      console.log(`📊 [PIXABAY RATE LIMITER] Rate limit updated: ${remaining}/${limit} remaining, resets at ${new Date(parseInt(reset) * 1000).toISOString()}`);
    }
  }

  getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }
}

export const pixabayRateLimiter = new PixabayRateLimiter();

export async function handlePixabayError(error: any, context: string): Promise<never> {
  console.error(`❌ [PIXABAY ERROR] ${context}:`, error);
  
  if (error.status === 429) {
    throw new Error('Rate limit exceeded. Please try again later.');
  } else if (error.status === 400) {
    throw new Error('Invalid request parameters.');
  } else if (error.status === 401) {
    throw new Error('Invalid API key.');
  } else if (error.status === 403) {
    throw new Error('API access forbidden.');
  } else if (error.status >= 500) {
    throw new Error('Pixabay service is temporarily unavailable.');
  } else {
    throw new Error('Failed to fetch from Pixabay API.');
  }
}
