'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/auth-client';
import { ProductCardSkeleton } from './LoadingStates';

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category?: { name: string };
  brand?: { name: string };
  rating?: number;
  reviewCount?: number;
  isFeatured?: boolean;
  discount?: number;
  tags?: string[];
  seller?: {
    name: string;
    distance?: string;
    isVerified?: boolean;
  };
  deliveryTime?: string;
  codAvailable?: boolean;
}

interface DealsSectionProps {
  products: Product[];
}

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 14,
    minutes: 20,
    seconds: 5,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          // Reset to next day
          return { hours: 23, minutes: 59, seconds: 59 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="material-symbols-outlined text-trust-orange">timer</span>
      <span className="text-lg font-mono text-white">
        {String(timeLeft.hours).padStart(2, '0')} : {String(timeLeft.minutes).padStart(2, '0')} : {String(timeLeft.seconds).padStart(2, '0')}
      </span>
    </div>
  );
}

export function DealsSection({ products }: DealsSectionProps) {
  const [deals, setDeals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true);
        // Real API call for deals
        const response = await apiClient.get('/products/deals?limit=6&location=Delhi');
        setDeals(response.data.data || []);
      } catch (error) {
        console.error('Error fetching deals:', error);
        // Fallback realistic Indian marketplace deals
        setDeals([
          {
            id: '1',
            name: 'Samsung Galaxy M34 5G',
            slug: 'samsung-galaxy-m34-5g',
            price: 16999,
            originalPrice: 20999,
            discount: 19,
            images: ['/api/placeholder/300/300'],
            category: { name: 'Mobile Phones' },
            rating: 4.3,
            reviewCount: 1250,
            seller: { name: 'Sharma Electronics', distance: '1.2 km', isVerified: true },
            deliveryTime: 'Same day',
            codAvailable: true,
            tags: ['bestseller']
          },
          {
            id: '2',
            name: 'boAt Airdopes 141',
            slug: 'boat-airdopes-141',
            price: 1299,
            originalPrice: 2990,
            discount: 57,
            images: ['/api/placeholder/300/300'],
            category: { name: 'Audio' },
            rating: 4.1,
            reviewCount: 8500,
            seller: { name: 'TechWorld Store', distance: '2.1 km', isVerified: true },
            deliveryTime: '4 hours',
            codAvailable: true,
            tags: ['hot-deal']
          },
          {
            id: '3',
            name: 'Prestige Deluxe Alpha Cooker',
            slug: 'prestige-deluxe-alpha-cooker',
            price: 1850,
            originalPrice: 2500,
            discount: 26,
            images: ['/api/placeholder/300/300'],
            category: { name: 'Kitchen Appliances' },
            rating: 4.5,
            reviewCount: 2100,
            seller: { name: 'Home Essentials', distance: '1.8 km', isVerified: true },
            deliveryTime: 'Same day',
            codAvailable: true,
            tags: ['limited-stock']
          },
          {
            id: '4',
            name: 'Puma Running Shoes',
            slug: 'puma-running-shoes',
            price: 2499,
            originalPrice: 4999,
            discount: 50,
            images: ['/api/placeholder/300/300'],
            category: { name: 'Footwear' },
            rating: 4.2,
            reviewCount: 890,
            seller: { name: 'Style Junction', distance: '2.1 km', isVerified: true },
            deliveryTime: 'Same day',
            codAvailable: true,
            tags: ['trending']
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-trust-orange to-trust-orange/80 rounded-2xl overflow-hidden">
            <div className="grid md:grid-cols-4 gap-6 p-6">
              <div className="md:col-span-1 text-white text-center md:text-left">
                <div className="h-32 flex flex-col justify-center">
                  <div className="animate-pulse bg-white/20 h-8 w-32 mx-auto md:mx-0 mb-4 rounded"></div>
                  <div className="animate-pulse bg-white/20 h-6 w-24 mx-auto md:mx-0 rounded"></div>
                </div>
              </div>
              <div className="md:col-span-3 grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="bg-gradient-to-r from-trust-orange to-trust-orange/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="grid md:grid-cols-4 gap-6 p-6">
            {/* Left Section - Timer */}
            <div className="md:col-span-1 text-white text-center md:text-left flex flex-col justify-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">⚡ Flash Deals</h2>
              <p className="text-white/90 mb-4 text-sm">Limited time offers from local sellers</p>
              <CountdownTimer />
              <Link
                href="/deals"
                className="bg-white text-trust-orange hover:bg-neutral-100 px-6 py-2 rounded-lg font-semibold text-sm transition-colors inline-flex items-center justify-center gap-2 mt-4"
              >
                View All Deals
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

            {/* Right Section - Products */}
            <div className="md:col-span-3">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {deals.slice(0, 4).map((product) => (
                  <div key={product.id} className="bg-white rounded-xl p-4 hover:shadow-lg transition-all group">
                    {/* Product Image */}
                    <div className="relative aspect-square bg-neutral-100 rounded-lg mb-3 overflow-hidden">
                      {product.discount && (
                        <div className="absolute top-2 left-2 bg-trust-green text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                          -{product.discount}%
                        </div>
                      )}
                      <div
                        className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                        style={{
                          backgroundImage: `url(${product.images[0] || '/api/placeholder/300/300'})`
                        }}
                      />
                    </div>

                    {/* Product Info */}
                    <div className="space-y-2">
                      <Link href={`/products/${product.slug}`}>
                        <h4 className="font-semibold text-neutral-900 text-sm line-clamp-2 hover:text-primary-600 transition-colors">
                          {product.name}
                        </h4>
                      </Link>

                      {/* Rating */}
                      {product.rating && (
                        <div className="flex items-center gap-1">
                          <div className="flex items-center">
                            <span className="material-symbols-outlined text-yellow-400 text-sm fill-1">star</span>
                            <span className="text-xs text-neutral-600 ml-1">{product.rating}</span>
                          </div>
                          <span className="text-xs text-neutral-500">({product.reviewCount})</span>
                        </div>
                      )}

                      {/* Price */}
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-neutral-900">₹{product.price.toLocaleString()}</span>
                        {product.originalPrice && (
                          <span className="text-sm text-neutral-400 line-through">₹{product.originalPrice.toLocaleString()}</span>
                        )}
                      </div>

                      {/* Seller & Delivery Info */}
                      {product.seller && (
                        <div className="text-xs text-neutral-600 space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">store</span>
                            <span>{product.seller.name}</span>
                            {product.seller.isVerified && (
                              <span className="material-symbols-outlined text-trust-green text-xs">verified</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">local_shipping</span>
                              <span>{product.deliveryTime}</span>
                            </div>
                            {product.codAvailable && (
                              <span className="bg-trust-green/10 text-trust-green px-2 py-1 rounded-full text-xs font-medium">
                                COD
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Status Tag */}
                      <div className="text-xs">
                        {product.tags?.includes('bestseller') && (
                          <span className="text-trust-green font-medium">🔥 Bestseller</span>
                        )}
                        {product.tags?.includes('hot-deal') && (
                          <span className="text-trust-orange font-medium">⚡ Hot Deal</span>
                        )}
                        {product.tags?.includes('limited-stock') && (
                          <span className="text-trust-red font-medium">⏰ Limited Stock</span>
                        )}
                        {product.tags?.includes('trending') && (
                          <span className="text-primary-600 font-medium">📈 Trending</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}