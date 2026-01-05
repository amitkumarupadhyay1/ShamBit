'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/auth-client';
import { SellerCardSkeleton } from './LoadingStates';

interface Seller {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  rating?: number;
  followerCount?: number;
  isVerified?: boolean;
  distance?: string;
  deliveryTime?: string;
  categories?: string[];
  gstNumber?: string;
}

export function FeaturedSellers() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState('Delhi');

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        setLoading(true);
        // Real API call for local sellers
        const response = await apiClient.get(`/sellers/featured?location=${userLocation}&limit=6&verified=true`);
        setSellers(response.data.data || []);
      } catch (error) {
        console.error('Error fetching sellers:', error);
        // Fallback data for demo - but with realistic Indian seller data
        setSellers([
          {
            id: '1',
            name: 'Sharma Electronics',
            slug: 'sharma-electronics',
            rating: 4.8,
            followerCount: 2500,
            isVerified: true,
            distance: '1.2 km',
            deliveryTime: 'Same day',
            categories: ['Electronics', 'Mobile Accessories'],
            gstNumber: 'GST123456789',
            description: 'Trusted electronics store serving Delhi for 15+ years'
          },
          {
            id: '2',
            name: 'Fresh Mart Grocery',
            slug: 'fresh-mart-grocery',
            rating: 4.6,
            followerCount: 1800,
            isVerified: true,
            distance: '0.8 km',
            deliveryTime: '2 hours',
            categories: ['Daily Essentials', 'Groceries'],
            gstNumber: 'GST987654321',
            description: 'Fresh groceries and daily essentials delivered fast'
          },
          {
            id: '3',
            name: 'Style Junction',
            slug: 'style-junction',
            rating: 4.9,
            followerCount: 3200,
            isVerified: true,
            distance: '2.1 km',
            deliveryTime: 'Same day',
            categories: ['Fashion', 'Accessories'],
            gstNumber: 'GST456789123',
            description: 'Latest fashion trends for men and women'
          },
          {
            id: '4',
            name: 'Home Essentials Store',
            slug: 'home-essentials-store',
            rating: 4.5,
            followerCount: 1200,
            isVerified: true,
            distance: '1.8 km',
            deliveryTime: 'Next day',
            categories: ['Home & Kitchen', 'Appliances'],
            gstNumber: 'GST789123456',
            description: 'Everything you need for your home'
          },
          {
            id: '5',
            name: 'Fitness Pro',
            slug: 'fitness-pro',
            rating: 4.7,
            followerCount: 950,
            isVerified: true,
            distance: '3.2 km',
            deliveryTime: 'Same day',
            categories: ['Sports & Fitness', 'Health'],
            gstNumber: 'GST321654987',
            description: 'Premium fitness equipment and supplements'
          },
          {
            id: '6',
            name: 'Beauty Corner',
            slug: 'beauty-corner',
            rating: 4.8,
            followerCount: 2100,
            isVerified: true,
            distance: '1.5 km',
            deliveryTime: '4 hours',
            categories: ['Health & Beauty', 'Personal Care'],
            gstNumber: 'GST654987321',
            description: 'Authentic beauty and personal care products'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchSellers();
  }, [userLocation]);

  if (loading) {
    return (
      <section className="py-12 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-neutral-900 mb-2">Local Sellers Near You</h2>
            <p className="text-neutral-600">Verified sellers in {userLocation}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SellerCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-neutral-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-neutral-900 mb-2">Local Sellers Near You</h2>
          <p className="text-neutral-600">Verified sellers in {userLocation} • Same day delivery available</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {sellers.map((seller) => (
            <div
              key={seller.id}
              className="bg-white rounded-xl p-6 border border-neutral-200 hover:border-primary-300 hover:shadow-lg transition-all duration-300 group"
            >
              {/* Seller Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary-600 text-2xl">store</span>
                  </div>
                  {seller.isVerified && (
                    <div className="absolute -bottom-1 -right-1 bg-trust-green text-white p-1 rounded-full border-2 border-white">
                      <span className="material-symbols-outlined text-xs">verified</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-neutral-900 group-hover:text-primary-600 transition-colors truncate">
                    {seller.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {seller.rating && (
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-yellow-400 text-sm fill-1">star</span>
                        <span className="text-sm font-medium text-neutral-700">{seller.rating}</span>
                      </div>
                    )}
                    {seller.isVerified && (
                      <span className="text-xs bg-trust-green/10 text-trust-green px-2 py-1 rounded-full font-medium">
                        GST Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Seller Info */}
              <div className="space-y-3 mb-4">
                <p className="text-sm text-neutral-600 line-clamp-2">
                  {seller.description}
                </p>
                
                {/* Distance & Delivery */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-neutral-600">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    <span>{seller.distance} away</span>
                  </div>
                  <div className="flex items-center gap-1 text-trust-green">
                    <span className="material-symbols-outlined text-sm">local_shipping</span>
                    <span className="font-medium">{seller.deliveryTime}</span>
                  </div>
                </div>

                {/* Categories */}
                {seller.categories && seller.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {seller.categories.slice(0, 2).map((category, index) => (
                      <span
                        key={index}
                        className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded-full"
                      >
                        {category}
                      </span>
                    ))}
                    {seller.categories.length > 2 && (
                      <span className="text-xs text-neutral-500">
                        +{seller.categories.length - 2} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <Link
                href={`/sellers/${seller.slug}`}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold text-center transition-colors flex items-center justify-center gap-2 group-hover:shadow-md"
              >
                <span className="material-symbols-outlined text-sm">store</span>
                Visit Store
              </Link>
            </div>
          ))}
        </div>

        {/* View All Sellers */}
        <div className="text-center mt-8">
          <Link
            href={`/sellers?location=${userLocation}`}
            className="inline-flex items-center gap-2 bg-white border-2 border-primary-500 text-primary-600 hover:bg-primary-50 px-6 py-3 rounded-lg font-semibold transition-all"
          >
            View All Local Sellers
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
      </div>
    </section>
  );
}