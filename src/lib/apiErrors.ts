import { NextResponse } from 'next/server';

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export type ApiErrorCode = 
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'NO_SHOP_AVAILABLE'
  | 'SLOT_FULL'
  | 'OUT_OF_STOCK'
  | 'BUSINESS_RULE_VIOLATION'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';

export function createErrorResponse(
  status: number,
  code: ApiErrorCode,
  message: string,
  details: ApiErrorDetail[] = [],
  requestId?: string
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
        request_id: requestId || `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

export function handleCatchError(error: any, requestId?: string) {
  return createErrorResponse(
    500,
    'INTERNAL_ERROR',
    error?.message || 'An unexpected internal server error occurred',
    [],
    requestId
  );
}
