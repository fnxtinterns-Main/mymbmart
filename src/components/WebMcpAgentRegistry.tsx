'use client';

import { useEffect } from 'react';

/**
 * WebMCP In-Browser Agent Tools Registry
 * Exposes WebMCP tools to autonomous in-browser AI agents
 * (SEP-1649 / W3C Web Model Context Protocol)
 */
export function WebMcpAgentRegistry() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const tools = [
      {
        name: 'search_catalog',
        description: 'Search MegaBachatMart grocery, staples, and SHG products with live prices and stock availability.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Product, category, or brand name' },
            category: { type: 'string', description: 'Optional category filter' },
          },
          required: ['query'],
        },
        execute: async (args: { query: string; category?: string }) => {
          try {
            const res = await fetch(`/api/products?q=${encodeURIComponent(args.query || '')}&cat=${encodeURIComponent(args.category || '')}`);
            return await res.json();
          } catch (e: any) {
            return { error: e.message };
          }
        },
      },
      {
        name: 'check_serviceability',
        description: 'Check whether a 6-digit Indian pincode is eligible for 20-30 minute quick commerce delivery.',
        inputSchema: {
          type: 'object',
          properties: {
            pincode: { type: 'string', description: '6-digit Indian postal pincode' },
          },
          required: ['pincode'],
        },
        execute: async (args: { pincode: string }) => {
          try {
            const res = await fetch(`/api/location/serviceability?pincode=${encodeURIComponent(args.pincode)}`);
            return await res.json();
          } catch (e: any) {
            return { error: e.message };
          }
        },
      },
      {
        name: 'get_partner_terms',
        description: 'Get zero-commission merchant onboarding terms, required KYC documents, and daily T+1 payout rules.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
        execute: async () => ({
          platformCommission: '0%',
          settlementCycle: 'Daily T+1 guaranteed into bank account',
          acceptedMerchants: ['Local Retail Shops', 'Women Self-Help Groups (SHGs)', 'Farmer Cooperatives'],
          onboardingPortalUrl: 'https://partners.mymbmart.com',
          helpline: '+91 9801506511',
          officialEmail: 'support@mymbmart.com',
        }),
      },
    ];

    // Expose in window object
    (window as any).__webmcp_tools__ = tools;

    // Register with navigator.modelContext if agent browser environment supports it
    const modelContext = (navigator as any).modelContext || (window as any).modelContext;
    if (modelContext && typeof modelContext.registerTool === 'function') {
      try {
        tools.forEach((tool) => {
          modelContext.registerTool(tool);
        });
        console.log('[WebMCP] Registered 3 in-browser agent tools');
      } catch (err) {
        console.warn('[WebMCP] Failed to register tools with modelContext:', err);
      }
    }
  }, []);

  return (
    <div className="sr-only" aria-hidden="true">
      {/* Semantic WebMCP Form Annotations for In-Browser Agent Discovery */}
      <form
        id="webmcp-search-form"
        {...({
          toolname: "search_groceries",
          tooldescription: "Search products, live discounts, and stock availability on MegaBachatMart",
        } as Record<string, string>)}
        data-toolname="search_groceries"
        data-tooldescription="Search products, live discounts, and stock availability on MegaBachatMart"
        action="/shop"
        method="GET"
      >
        <input type="text" name="q" placeholder="Search rice, dal, oil, tea..." />
        <button type="submit">Search</button>
      </form>
    </div>
  );
}
