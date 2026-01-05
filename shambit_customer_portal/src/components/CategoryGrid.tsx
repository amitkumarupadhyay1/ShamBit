'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { publicApiClient, safeApiCall } from '@/lib/api-client';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  localSellerCount?: number;
}

interface CategoryGridProps {
  categories: Category[];
}

const categoryConfig = {
  'Electronics': { icon: 'devices', color: 'blue', description: 'Mobiles, Laptops & More' },
  'Mobile Accessories': { icon: 'smartphone', color: 'indigo', description: 'Cases, Chargers & More' },
  'Fashion': { icon: 'checkroom', color: 'pink', description: 'Clothing & Accessories' },
  'Daily Essentials': { icon: 'local_grocery_store', color: 'green', description: 'Groceries & Household' },
  'Local Goods': { icon: 'store', color: 'orange', description: 'From Nearby Sellers' },
  'Home & Kitchen': { icon: 'home', color: 'purple', description: 'Furniture & Appliances' },
  'Health & Beauty': { icon: 'spa', color: 'rose', description: 'Personal Care' },
  'Sports & Fitness': { icon: 'fitness_center', color: 'emerald', description: 'Equipment & Gear' },
};

export function CategoryGrid({ categories }: CategoryGridProps) {
  const [localSellerCounts, setLocalSellerCounts] = useState<Record<string, number>>({});
  const [userLocation, setUserLocation] = useState('Delhi');

  useEffect(() => {
    // Fetch local seller counts for each category
    const fetchLocalSellerCounts = async () => {
      const fallbackData = {
        'Electronics': 45,
        'Mobile Accessories': 32,
        'Fashion': 28,
        'Daily Essentials': 67,
        'Local Goods': 89,
        'Home & Kitchen': 23,
        'Health & Beauty': 34,
        'Sports & Fitness': 18,
      };

      const counts = await safeApiCall(
        () => publicApiClient.get<Record<string, number>>(`/categories/local-sellers?location=${userLocation}`),
        fallbackData,
        'Failed to fetch local seller counts, using fallback data'
      );

      setLocalSellerCounts(counts);
    };

    fetchLocalSellerCounts();
  }, [userLocation]);

  // Use provided categories or fallback to default ones
  const displayCategories = categories.length > 0 ? categories : [
    { id: '1', name: 'Electronics', slug: 'electronics' },
    { id: '2', name: 'Mobile Accessories', slug: 'mobile-accessories' },
    { id: '3', name: 'Fashion', slug: 'fashion' },
    { id: '4', name: 'Daily Essentials', slug: 'daily-essentials' },
    { id: '5', name: 'Local Goods', slug: 'local-goods' },
    { id: '6', name: 'Home & Kitchen', slug: 'home-kitchen' },
    { id: '7', name: 'Health & Beauty', slug: 'health-beauty' },
    { id: '8', name: 'Sports & Fitness', slug: 'sports-fitness' },
  ];

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-neutral-900 mb-2">Shop by Category</h2>
          <p className="text-neutral-600">Discover products from local sellers near you</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
          {displayCategories.slice(0, 8).map((category) => {
            const config = categoryConfig[category.name as keyof typeof categoryConfig] || 
                          { icon: 'category', color: 'gray', description: 'Browse Products' };
            const sellerCount = localSellerCounts[category.name] || 0;

            return (
              <Link
                key={category.id}
                href={`/categories/${category.slug}?location=${userLocation}`}
                className="group relative bg-white rounded-2xl p-6 border border-neutral-200 hover:border-primary-300 hover:shadow-lg transition-all duration-300 text-center"
              >
                {/* Category Icon */}
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-${config.color}-50 flex items-center justify-center group-hover:bg-${config.color}-100 transition-colors`}>
                  <span className={`material-symbols-outlined text-3xl text-${config.color}-600`}>
                    {config.icon}
                  </span>
                </div>

                {/* Category Info */}
                <h3 className="font-semibold text-neutral-900 mb-1 group-hover:text-primary-600 transition-colors">
                  {category.name}
                </h3>
                <p className="text-xs text-neutral-500 mb-2">
                  {config.description}
                </p>

                {/* Local Seller Count */}
                {sellerCount > 0 && (
                  <div className="flex items-center justify-center gap-1 text-xs text-trust-green">
                    <span className="material-symbols-outlined text-sm">store</span>
                    <span>{sellerCount} local sellers</span>
                  </div>
                )}

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-primary-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            );
          })}
        </div>

        {/* View All Categories */}
        <div className="text-center mt-8">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold transition-colors"
          >
            View All Categories
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
