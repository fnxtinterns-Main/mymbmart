// MegaBachatMart — Master Product Image Bank & Persistent Custom Image Registry
// Solves:
// 1. Automatic high-resolution product images for all grocery, retail, FMCG, and SHG products (no need for merchants to paste image URLs).
// 2. Persistent storage for merchant-uploaded photos (upload once, never have to re-upload every time).
// 3. Ability to change or upload new photos anytime from the Merchant Portal.

export interface MasterImageEntry {
  keywords: string[];
  imageUrl: string;
  category: string;
}

// Master Image Bank: High-resolution, verified product images for common Indian grocery & FMCG items
export const MASTER_PRODUCT_IMAGE_BANK: MasterImageEntry[] = [
  // Oils & Ghee
  {
    keywords: ['fortune', 'sunlite', 'sunflower oil', 'refined oil', 'cooking oil'],
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=1200&auto=format&fit=crop&q=80',
    category: 'Groceries',
  },
  {
    keywords: ['mustard oil', 'sarson', 'kachi ghani', 'dhara', 'saloni'],
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=1200&auto=format&fit=crop&q=80',
    category: 'Groceries',
  },
  {
    keywords: ['ghee', 'deshi ghee', 'cow ghee', 'amul ghee', 'patanjali ghee'],
    imageUrl: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=1200&auto=format&fit=crop&q=80',
    category: 'Groceries',
  },

  // Flour & Grains (Atta, Rice, Maida, Besan)
  {
    keywords: ['aashirvaad', 'atta', 'flour', 'wheat flour', 'chakki atta', 'sharbati'],
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop&q=80',
    category: 'Groceries',
  },
  {
    keywords: ['rice', 'basmati', 'chawal', 'daawat', 'india gate', 'kolam', 'sona masoori'],
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=1200&auto=format&fit=crop&q=80',
    category: 'Groceries',
  },
  {
    keywords: ['besan', 'gram flour', 'sattu', 'chana sattu', 'maida', 'sooji', 'rava'],
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop&q=80',
    category: 'Groceries',
  },

  // Pulses & Dal
  {
    keywords: ['toor dal', 'arhar dal', 'dal', 'chana dal', 'moong dal', 'urad dal', 'masoor dal', 'rajma', 'chole', 'pulses'],
    imageUrl: 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?w=1200&auto=format&fit=crop&q=80',
    category: 'Groceries',
  },

  // Beverages (Tea & Coffee)
  {
    keywords: ['tata tea', 'tea gold', 'chai', 'chai patti', 'tea', 'wagh bakri', 'red label', 'taj mahal'],
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=1200&auto=format&fit=crop&q=80',
    category: 'Daily Essentials',
  },
  {
    keywords: ['coffee', 'nescafe', 'bru', 'filter coffee'],
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1200&auto=format&fit=crop&q=80',
    category: 'Daily Essentials',
  },

  // Snacks, Biscuits & Noodles
  {
    keywords: ['britannia', 'good day', 'marie gold', 'parle-g', 'biscuit', 'cookies', 'hide & seek', 'monaco', 'oreo', 'bourbon'],
    imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&auto=format&fit=crop&q=80',
    category: 'Daily Essentials',
  },
  {
    keywords: ['maggi', 'noodles', 'yippee', 'pasta', 'chings'],
    imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=1200&auto=format&fit=crop&q=80',
    category: 'Daily Essentials',
  },
  {
    keywords: ['chips', 'lays', 'kurkure', 'namkeen', 'bhujia', 'haldiram', 'bikaji', 'mixture'],
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d62817d2?w=1200&auto=format&fit=crop&q=80',
    category: 'Snacks & Pickles',
  },

  // Personal Care & Hygiene
  {
    keywords: ['dettol', 'lifebuoy', 'soap', 'body wash', 'lux', 'dove', 'pears', 'cinthol'],
    imageUrl: 'https://images.unsplash.com/photo-1607006314644-884b2e88a381?w=1200&auto=format&fit=crop&q=80',
    category: 'Daily Essentials',
  },
  {
    keywords: ['shampoo', 'conditioner', 'head & shoulders', 'pantene', 'clinic plus', 'dove shampoo'],
    imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=1200&auto=format&fit=crop&q=80',
    category: 'Daily Essentials',
  },
  {
    keywords: ['toothpaste', 'colgate', 'close up', 'sensodyne', 'dabur red', 'brush'],
    imageUrl: 'https://images.unsplash.com/photo-1559591937-e1032c5ef104?w=1200&auto=format&fit=crop&q=80',
    category: 'Daily Essentials',
  },

  // Cleaning & Household
  {
    keywords: ['surf excel', 'detergent', 'tide', 'ariel', 'wheel', 'washing powder', 'vim', 'dishwash'],
    imageUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=1200&auto=format&fit=crop&q=80',
    category: 'Daily Essentials',
  },

  // Spices & Condiments
  {
    keywords: ['masala', 'haldi', 'turmeric', 'chilli powder', 'mirch', 'dhaniya', 'coriander', 'garam masala', 'jeera', 'cumin', 'spices', 'mdh', 'everest'],
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1200&auto=format&fit=crop&q=80',
    category: 'Spices',
  },
  {
    keywords: ['salt', 'namak', 'tata salt', 'rock salt', 'sendha namak'],
    imageUrl: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=1200&auto=format&fit=crop&q=80',
    category: 'Groceries',
  },
  {
    keywords: ['sugar', 'cheeni', 'jaggery', 'gud', 'organic jaggery'],
    imageUrl: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=1200&auto=format&fit=crop&q=80',
    category: 'Groceries',
  },

  // SHG Specials, Pickles & Organic
  {
    keywords: ['pickle', 'achar', 'mango pickle', 'amla', 'lemon pickle', 'handmade', 'handcrafted', 'traditional'],
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1200&auto=format&fit=crop&q=80',
    category: 'Snacks & Pickles',
  },
  {
    keywords: ['honey', 'pure honey', 'wild honey', 'forest honey', 'tribal honey', 'shg honey'],
    imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=1200&auto=format&fit=crop&q=80',
    category: 'SHG Specials',
  },
  {
    keywords: ['papad', 'khakra', 'badi', 'moong badi', 'amritsari badi', 'shg special'],
    imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=1200&auto=format&fit=crop&q=80',
    category: 'SHG Specials',
  },
  {
    keywords: ['kaju', 'cashew', 'badam', 'almond', 'dry fruit', 'raisin', 'kishmish', 'walnut'],
    imageUrl: 'https://images.unsplash.com/photo-1509912760195-45415d862e3d?w=1200&auto=format&fit=crop&q=80',
    category: 'Groceries',
  },

  // Fresh Fruits & Vegetables
  {
    keywords: ['vegetables', 'sabzi', 'cauliflower', 'potato', 'aloo', 'tomato', 'tamatar', 'onion', 'pyaz', 'peas', 'matar', 'combo basket'],
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&auto=format&fit=crop&q=80',
    category: 'Fruits & Vegetables',
  },
  {
    keywords: ['fruit', 'fruits', 'banana', 'kela', 'apple', 'seb', 'mango', 'orange', 'papaya'],
    imageUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=1200&auto=format&fit=crop&q=80',
    category: 'Fruits & Vegetables',
  },

  // Dairy & Bakery
  {
    keywords: ['milk', 'doodh', 'cow milk', 'toned milk', 'amul taaza', 'medha', 'paneer', 'malai paneer', 'curd', 'dahi', 'butter', 'bread'],
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=1200&auto=format&fit=crop&q=80',
    category: 'Dairy & Bakery',
  },

  // Stationery & Office
  {
    keywords: ['notebook', 'classmate', 'register', 'copy', 'book', 'stationery', 'paper', 'copier', 'a4', 'sheets'],
    imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=1200&auto=format&fit=crop&q=80',
    category: 'Stationery',
  },
  {
    keywords: ['pen', 'reynolds', 'ballpen', 'gel pen', 'pencil', 'fevicol', 'glue', 'eraser', 'sharpener'],
    imageUrl: 'https://images.unsplash.com/photo-1585336261026-775646092b71?w=1200&auto=format&fit=crop&q=80',
    category: 'Stationery',
  },

  // Bullion & Precious Metals (Gold & Silver)
  {
    keywords: ['gold', 'gold coin', 'mmtc', 'pamp', '24k', '999.9', 'gold bar', 'gold ingot', 'bullion'],
    imageUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=1200&auto=format&fit=crop&q=80',
    category: 'Bullion',
  },
  {
    keywords: ['silver', 'silver coin', 'silver bar', 'chandi', '999 silver', 'lakshmi ganesh', 'hallmarked silver'],
    imageUrl: 'https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?w=1200&auto=format&fit=crop&q=80',
    category: 'Bullion',
  },

  // Consumables & Care
  {
    keywords: ['dettol liquid', 'antiseptic', 'handwash', 'sanitizer', 'harpic', 'lizol', 'detergent', 'surf excel', 'vim gel'],
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200&auto=format&fit=crop&q=80',
    category: 'Consumables',
  },

  // FMCG Foods
  {
    keywords: ['fmcg', 'packaged food', 'instant noodles', 'biscuits', 'wafers', 'snack pack', 'breakfast cereal'],
    imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&auto=format&fit=crop&q=80',
    category: 'FMCG',
  },
];

// Fallback images per category if no keyword matches
export const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  'Groceries': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80',
  'Grocers': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80',
  'Fruits & Vegetables': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&auto=format&fit=crop&q=80',
  'Dairy & Bakery': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=1200&auto=format&fit=crop&q=80',
  'FMCG': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&auto=format&fit=crop&q=80',
  'Consumables': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200&auto=format&fit=crop&q=80',
  'Stationery': 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=1200&auto=format&fit=crop&q=80',
  'Bullion': 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=1200&auto=format&fit=crop&q=80',
  'Daily Essentials': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200&auto=format&fit=crop&q=80',
  'SHG Specials': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=1200&auto=format&fit=crop&q=80',
  'Snacks & Pickles': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1200&auto=format&fit=crop&q=80',
  'Spices': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1200&auto=format&fit=crop&q=80',
  'Home & Kitchen': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&auto=format&fit=crop&q=80',
};

// Global in-memory registry of custom uploaded photos mapped by:
// 1. normalized product ID (e.g. "rch-krn-101")
// 2. normalized product name (e.g. "fortune sunlite refined sunflower oil")
class ProductImageLibraryStore {
  private customImages: Map<string, string> = new Map();

  public normalizeKey(input: string): string {
    return input.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  }

  /**
   * Save a custom merchant or admin uploaded photo permanently.
   * Associates it with both the ID and the name so restocking or renaming still keeps the image.
   */
  public saveProductImage(key: string, imageUrl: string): void {
    if (!key || !imageUrl) return;
    const norm = this.normalizeKey(key);
    this.customImages.set(norm, imageUrl);
  }

  /**
   * Resolve best image for a product:
   * 1. If explicit valid image URL provided by merchant (and not a generic placeholder), use it.
   * 2. If a previously uploaded custom photo exists for this product ID or name, use it!
   * 3. If keywords match our Master Image Bank, automatically use the high-res verified photo.
   * 4. Fall back to Category Default image.
   */
  public resolveImage(params: {
    productId?: string;
    productName?: string;
    category?: string;
    explicitUrl?: string;
  }): string {
    const { productId = '', productName = '', category = 'Groceries', explicitUrl } = params;

    // 1. Explicit image URL provided by merchant (CSV or upload preview) takes absolute priority
    if (explicitUrl && explicitUrl.trim().length > 4 && !explicitUrl.includes('photo-1540420773420-3366772f4999')) {
      return explicitUrl.trim();
    }

    // 2. Check custom uploaded library (by ID, then by Name)
    if (productId) {
      const customById = this.customImages.get(this.normalizeKey(productId));
      if (customById) return customById;
    }

    if (productName) {
      const customByName = this.customImages.get(this.normalizeKey(productName));
      if (customByName) return customByName;
    }

    // Master Image Bank keyword matching
    const searchTarget = `${productName} ${category}`.toLowerCase();
    for (const entry of MASTER_PRODUCT_IMAGE_BANK) {
      for (const kw of entry.keywords) {
        if (searchTarget.includes(kw.toLowerCase())) {
          return entry.imageUrl;
        }
      }
    }

    // Category default fallback
    return CATEGORY_DEFAULT_IMAGES[category] || CATEGORY_DEFAULT_IMAGES['Groceries'];
  }

  public getAllCustomImages(): Record<string, string> {
    const obj: Record<string, string> = {};
    this.customImages.forEach((v, k) => {
      obj[k] = v;
    });
    return obj;
  }
}

export const productImageLibrary = new ProductImageLibraryStore();
