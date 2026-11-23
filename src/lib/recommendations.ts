// src/lib/recommendations.ts
// AI-Ready Recommendations & Visual Search Matching Engine

import { sampleProducts } from './data';
import type { ProductItem } from './types';

// Association rules for frequently bought together groceries
const COMPLEMENTARY_RULES: Record<string, string[]> = {
  'groceries': ['daily essentials', 'spices'],
  'staples': ['oil-ghee', 'masala-spices', 'dairy-breakfast'],
  'shg specials': ['groceries', 'spices'],
  'spices': ['groceries', 'shg specials'],
};

/**
 * Returns similar products based on category, unit proximity, and price tier proximity.
 */
export function getSimilarProducts(productId: string, limit: number = 4): ProductItem[] {
  const target = sampleProducts.find((p) => p.id === productId);
  if (!target) return sampleProducts.slice(0, limit);

  const scored = sampleProducts
    .filter((p) => p.id !== productId)
    .map((candidate) => {
      let score = 0;
      // Category match
      if (candidate.category === target.category) score += 5;
      // Producer match
      if (candidate.producerName && candidate.producerName === target.producerName) score += 3;
      // Unit match
      if (candidate.unit === target.unit) score += 2;
      // Price proximity (within 30%)
      const priceRatio = Math.abs(candidate.bachatPrice - target.bachatPrice) / target.bachatPrice;
      if (priceRatio < 0.3) score += 3;

      return { product: candidate, score };
    });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.product);
}

/**
 * Returns complementary items frequently added to cart alongside target item.
 */
export function getFrequentlyBoughtTogether(productId: string, limit: number = 3): ProductItem[] {
  const target = sampleProducts.find((p) => p.id === productId);
  if (!target) return [];

  const targetCat = target.category.toLowerCase();
  const complementaryCategories = COMPLEMENTARY_RULES[targetCat] || ['groceries', 'daily essentials'];

  const candidates = sampleProducts.filter(
    (p) => p.id !== productId && complementaryCategories.includes(p.category.toLowerCase())
  );

  return candidates.slice(0, limit);
}

/**
 * Visual Search match: takes optical image labels / tags extracted from photo input
 * and ranks matching catalog items.
 */
export function visualSearch(
  labels: string[],
  categoryHint?: string,
  limit: number = 6
): { products: ProductItem[]; confidence: number } {
  if (!labels || labels.length === 0) {
    return { products: sampleProducts.slice(0, limit), confidence: 0 };
  }

  const normalizedLabels = labels.map((l) => l.toLowerCase().trim());

  const scored = sampleProducts.map((p) => {
    let score = 0;
    const pText = `${p.name} ${p.category} ${p.producerName || ''} ${p.unit || ''}`.toLowerCase();

    for (const label of normalizedLabels) {
      if (pText.includes(label)) {
        score += 3;
      }
    }

    if (categoryHint && p.category.toLowerCase() === categoryHint.toLowerCase()) {
      score += 4;
    }

    return { product: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const matched = scored.filter((s) => s.score > 0).slice(0, limit);

  return {
    products: matched.length > 0 ? matched.map((m) => m.product) : sampleProducts.slice(0, limit),
    confidence: matched.length > 0 ? Math.min(1.0, (matched[0]?.score || 0) / 10) : 0.1,
  };
}
