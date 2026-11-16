import { NextResponse } from 'next/server';

export async function GET() {
  const openApiDoc = {
    openapi: '3.1.0',
    info: {
      title: 'MegaBachatMart Platform API',
      description: 'Complete Hyperlocal E-Commerce Platform API for MegaBachatMart (mymbmart.com). Covers Storefront, Shop Partner Portal, SHG Producer Portal, Operations Admin, and VPC Internal Services.',
      version: '1.0.0',
      contact: {
        name: 'MegaBachatMart Engineering',
        email: 'api@mymbmart.com',
        url: 'https://mymbmart.com',
      },
    },
    servers: [
      { url: 'https://mymbmart.com/api/v1', description: 'Production Gateway' },
      { url: 'http://localhost:3000/api/v1', description: 'Local Development Server' },
    ],
    tags: [
      { name: 'Auth & OTP', description: 'Shared mobile OTP and JWT authentication across all portals' },
      { name: 'Routing & Availability', description: 'Pre-checkout store selection, distance evaluation, and delivery ETA' },
      { name: 'Orders & Dispatch', description: 'Lifecycle transitions, rider assignments, delivery OTP, pickup QR' },
      { name: 'Inventory & SKUs', description: 'Real-time stock ledger, FEFO batch reservations, and GRN purchasing' },
      { name: 'Admin Hyperlocal Engine', description: 'Scoring weights, anti-starvation rules, and decision audit logs' },
    ],
    paths: {
      '/auth/send-otp': {
        post: {
          tags: ['Auth & OTP'],
          summary: 'Send 6-digit verification code to customer, shop, or seller',
          operationId: 'sendOtp',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['identifier'],
                  properties: {
                    identifier: { type: 'string', example: '9876543210' },
                    action: { type: 'string', enum: ['SEND'], default: 'SEND' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'OTP successfully dispatched',
            },
          },
        },
      },
      '/routing/check-availability': {
        post: {
          tags: ['Routing & Availability'],
          summary: 'Pre-checkout candidate store discovery and ETA calculation',
          operationId: 'checkAvailability',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['pincode', 'items'],
                  properties: {
                    fulfilment_type: { type: 'string', enum: ['DELIVERY', 'PICKUP'], default: 'DELIVERY' },
                    pincode: { type: 'string', example: '834001' },
                    items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          sku_id: { type: 'string', example: 'MB-GRO-AASH-5K' },
                          quantity: { type: 'number', example: 2 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Eligible stores with calculated scores and distance' },
          },
        },
      },
      '/routing/route': {
        post: {
          tags: ['Routing & Availability'],
          summary: 'Primary order assignment and atomic stock reservation',
          operationId: 'routeOrder',
          responses: {
            '200': { description: 'Fulfilling shop assigned and soft reservation placed' },
            '409': { description: 'No shop available or concurrency race on last unit' },
          },
        },
      },
      '/routing/re-route': {
        post: {
          tags: ['Routing & Availability'],
          summary: 'Automatic fallback re-routing on rejection or SLA expiration',
          operationId: 'rerouteOrder',
          responses: {
            '200': { description: 'Order re-assigned to next-best candidate' },
            '409': { description: 'Max fallback attempts exceeded or no remaining stores' },
          },
        },
      },
      '/admin/routing/config': {
        get: {
          tags: ['Admin Hyperlocal Engine'],
          summary: 'Retrieve active 8-factor scoring weights and SLA parameters',
          responses: {
            '200': { description: 'Active configuration object' },
          },
        },
        put: {
          tags: ['Admin Hyperlocal Engine'],
          summary: 'Update scoring weights and SLAs (validated to sum to 1.00)',
          responses: {
            '200': { description: 'Configuration updated successfully' },
            '400': { description: 'Weights do not sum to 1.00' },
          },
        },
      },
      '/admin/routing/why-no-shop': {
        get: {
          tags: ['Admin Hyperlocal Engine'],
          summary: 'Diagnostics probe reporting filter failure breakdown per shop',
          parameters: [
            { name: 'pincode', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'sku_id', in: 'query', required: false, schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'Detailed exclusion analysis per store' },
          },
        },
      },
      '/admin/routing/audit': {
        get: {
          tags: ['Admin Hyperlocal Engine'],
          summary: 'Query routing audit log with millisecond latency and factor breakdowns',
          responses: {
            '200': { description: 'Paginated audit entries' },
          },
        },
      },
    },
  };

  return NextResponse.json(openApiDoc, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
  });
}
