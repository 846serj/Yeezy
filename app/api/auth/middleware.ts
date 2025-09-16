import { NextResponse } from 'next/server';

export function addCorsHeaders(response: NextResponse) {
  // Allow requests from any origin in development
  const origin = process.env.NODE_ENV === 'development' ? '*' : process.env.ALLOWED_ORIGIN || '*';
  
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  if (origin !== '*') {
    response.headers.set('Vary', 'Origin');
  }
  
  return response;
}
