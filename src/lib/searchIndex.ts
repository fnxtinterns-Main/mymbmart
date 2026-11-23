// src/lib/searchIndex.ts
// In-Memory Inverted Search Index & High-Speed Multi-Facet Catalog Filter

import { sampleProducts } from './data';
import type { ProductItem } from './types';

export interface FilterCriteria {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  shgOnly?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'savings_desc' | 'relevance';
}

class ProductSearchIndex {
  private invertedIndex: Map<string, Set<string>> = new Map();
  private productMap: Map<string, ProductItem> = new Map();
  private categoryMap: Map<string, Set<string>> = new Map();
  private isIndexed: boolean = false;

  public initialize(products: ProductItem[] = sampleProducts): void {
    this.invertedIndex.clear();
    this.productMap.clear();
    this.categoryMap.clear();

    for (const p of products) {
      this.productMap.set(p.id, p);

      // Category indexing
      const catKey = p.category.toLowerCase();
      if (!this.categoryMap.has(catKey)) {
        this.categoryMap.set(catKey, new Set());
      }
      this.categoryMap.get(catKey)!.add(p.id);

      // Tokenize searchable text (name, producerName, category, unit, sku)
      const textToTokenize = `${p.name} ${p.producerName || ''} ${p.category} ${p.unit || ''} ${p.sku || ''}`.toLowerCase();
      const tokens = textToTokenize.split(/[\s,.\-_/]+/).filter((t) => t.length >= 2);

      for (const token of tokens) {
        // Prefix n-grams for fast auto-complete (e.g. "tat", "tata")
        for (let len = 2; len <= Math.min(token.length, 6); len++) {
          const prefix = token.slice(0, len);
          if (!this.invertedIndex.has(prefix)) {
            this.invertedIndex.set(prefix, new Set());
          }
          this.invertedIndex.get(prefix)!.add(p.id);
        }
      }
    }

    this.isIndexed = true;
  }

  public search(criteria: FilterCriteria): { items: ProductItem[]; total: number } {
    if (!this.isIndexed) {
      this.initialize();
    }

    let candidateIds: Set<string> | null = null;

    // 1. Text Search Filter via Inverted Index
    if (criteria.query && criteria.query.trim()) {
      const qTokens = criteria.query.toLowerCase().trim().split(/[\s,.\-_/]+/).filter(t => t.length >= 2);
      
      for (const q of qTokens) {
        const matches = this.invertedIndex.get(q) || new Set<string>();
        if (candidateIds === null) {
          candidateIds = new Set(matches);
        } else {
          // Intersect candidate set (AND matching across query tokens)
          const next = new Set<string>();
          for (const id of candidateIds) {
            if (matches.has(id)) next.add(id);
          }
          candidateIds = next;
        }
      }
    }

    // 2. Category Filter
    if (criteria.category && criteria.category !== 'All') {
      const catKey = criteria.category.toLowerCase();
      const catMatches = this.categoryMap.get(catKey) || new Set<string>();
      if (candidateIds === null) {
        candidateIds = new Set(catMatches);
      } else {
        const next = new Set<string>();
        for (const id of candidateIds) {
          if (catMatches.has(id)) next.add(id);
        }
        candidateIds = next;
      }
    }

    // If no text or category filter was applied, consider all products
    const initialList: ProductItem[] = candidateIds === null 
      ? Array.from(this.productMap.values())
      : Array.from(candidateIds).map(id => this.productMap.get(id)!).filter(Boolean);

    // 3. Facet Filters: Price, Stock, SHG
    let filtered = initialList.filter((p) => {
      if (criteria.minPrice !== undefined && p.bachatPrice < criteria.minPrice) return false;
      if (criteria.maxPrice !== undefined && p.bachatPrice > criteria.maxPrice) return false;
      if (criteria.inStockOnly && !p.inStock) return false;
      if (criteria.shgOnly && !p.isSHG) return false;
      return true;
    });

    // 4. Sorting
    if (criteria.sortBy === 'price_asc') {
      filtered.sort((a, b) => a.bachatPrice - b.bachatPrice);
    } else if (criteria.sortBy === 'price_desc') {
      filtered.sort((a, b) => b.bachatPrice - a.bachatPrice);
    } else if (criteria.sortBy === 'savings_desc') {
      filtered.sort((a, b) => (b.mrp - b.bachatPrice) - (a.mrp - a.bachatPrice));
    }

    return {
      items: filtered,
      total: filtered.length,
    };
  }
}

export const searchIndex = new ProductSearchIndex();
