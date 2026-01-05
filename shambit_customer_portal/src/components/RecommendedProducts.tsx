'use client';

import { useState } from 'react';
import Link from 'next/link';

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
}

interface RecommendedProductsProps {
  products: Product[];
}

export function RecommendedProducts({ products }: RecommendedProductsProps) {
  const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set());

  const toggleWishlist = (productId: string) => {
    setWishlistItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const addToCart = (productId: string) => {
    // TODO: Implement cart functionality
    console.log('Adding to cart:', productId);
  };

  const renderStars = (rating: number = 0) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={i} className="material-symbols-outlined text-[16px] fill-1">star</span>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half" className="material-symbols-outlined text-[16px] fill-1 text-gray-300">star_half</span>
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="material-symbols-outlined text-[16px] fill-1 text-gray-300">star</span>
      );
    }

    return stars;
  };

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Recommended for You</h3>
          <p className="text-gray-500 text-sm mt-1">Based on your browsing history</p>
        </div>
        <button className="text-primary font-medium hover:underline">View All</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white dark:bg-surface-dark rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all group"
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg bg-gray-100">
              <div
                className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                style={{
                  backgroundImage: `url(${product.images[0] || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=400&fit=crop'})`
                }}
              />
              {product.discount && (
                <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  SALE
                </div>
              )}
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-red-500 flex items-center justify-center transition-colors shadow-sm ${
                  wishlistItems.has(product.id) ? 'text-red-500' : ''
                }`}
              >
                <span className="material-symbols-outlined text-lg">favorite</span>
              </button>
            </div>

            <div className="p-4">
              <Link href={`/products/${product.slug}`}>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 truncate mb-1 hover:text-primary transition-colors">
                  {product.name}
                </h4>
              </Link>
              <p className="text-xs text-gray-500 mb-2">{product.category?.name || 'General'}</p>

              <div className="flex items-center gap-2 mb-3">
                <div className="flex text-yellow-400 text-sm">
                  {renderStars(product.rating)}
                </div>
                <span className="text-xs text-gray-400">({product.reviewCount || 0})</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">${product.price}</span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-xs text-gray-400 line-through ml-1">${product.originalPrice}</span>
                  )}
                </div>
                <button
                  onClick={() => addToCart(product.id)}
                  className="text-primary hover:bg-primary/10 p-1.5 rounded-full transition-colors"
                  title="Add to cart"
                >
                  <span className="material-symbols-outlined">add_shopping_cart</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Fill with sample products if needed */}
        {Array.from({ length: Math.max(0, 10 - products.length) }, (_, index) => {
          const sampleProducts = [
            {
              id: `sample-${index}`,
              name: 'Organic Skin Care Set',
              slug: 'organic-skin-care-set',
              category: { name: 'Beauty & Personal Care' },
              price: 45,
              rating: 4,
              reviewCount: 85,
              images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuCAuvWKHbgvqO4a49wJCrsmHBZNa1UecOKR2Pm7T4hdzGfahdzVtd1SytB5HV6TrfaaR0s-0sFWnjFWJrV2htEdCAGEezLnzqYRPPbAYXmkUqTNiggyw3Gk7FUs-GgJtXJMf0n5GBcGlF-o8JeSaN4fmBxV0KWUax_jY5RFiU1jYd1cH1yGkT8rIv8s5VhLFwEVyqcXItZjP1MmV9U_mwjZfoJ4NFw3EFGvMNJ-vdA-YtPGJ_POQFdWwnELmjBCRQ-mGyiQKSTawT4']
            },
            {
              id: `sample-${index + 10}`,
              name: 'Urban Sneakers',
              slug: 'urban-sneakers',
              category: { name: 'Men\'s Footwear' },
              price: 89.99,
              rating: 5,
              reviewCount: 500,
              images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuDvGs00l3R7_zEBonhWmkRakvXCRrM_zRUxTZ4Uk6JvAXgv1h4dOHWTcKRTRGvRKS93GxSedysnyoUMp3d4vXHhCNdR6mC1NMFpJSgGvPiutgY14ZzW_EOD4DTzpHDIze_R-XQrowYjiA22z9lS9gaBeqC_EIynbPTjKk4SCulgl3ax9EMIYyz4eMcGpMZBchCBrv9BOajv1R7yNrqZV7TS10Ukz7sWSmX0VUn0hnG52qyv6npCa-tICCfsBcEUyv_UUblf1tUTvzA']
            },
            {
              id: `sample-${index + 20}`,
              name: 'Sport Runners',
              slug: 'sport-runners',
              category: { name: 'Sports & Outdoors' },
              price: 65,
              rating: 4,
              reviewCount: 45,
              images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuCks0KaSReRcgASvfgVxDt8ms4KRA18bthlQTtqzynkGtvVN-ZMPRExdH65-_oI42XFZ43Eu0NVqdQsRBrvcZh7RlJMJeKehCSGGeR_eev6nRXQxCxvxW4B2hROhlmWqZwC2gtr_M5p7ZUBBgu_6YHD4zx9mkTw4h9ys1M5--5KRKBjCbKGlXKhdaJnI8NserQBx3i_LOWxHoEcspl_rrb5Zm8gkEDpXsqFz_X9RhsO9EG-2SIQ-HZGeKR4xTcYRb_fH61UKkvRe4I']
            },
            {
              id: `sample-${index + 30}`,
              name: 'Polaroid Camera',
              slug: 'polaroid-camera',
              category: { name: 'Electronics' },
              price: 85,
              originalPrice: 100,
              rating: 5,
              reviewCount: 120,
              discount: 15,
              images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuAMfpsmZYke-ycqBGQlY1QucxoMK-to5A7qpIQ7BRbG8HKsbKiB14LkuElHzQpFTD7invoWzn_wdy4F1doapKNrx5vUD5dS9SV6uNs0CTR4nLWx_LXP_61el5jwOuvUIJgnuMpmZNRHqHg9BnIsdDKwJVeg4msp06bgG0ZB2ElcxyakWEBUuGNVg2XDsIhZZdW0-fRrsfwx7hYTWEtCDtTqHIa1xyDP3syNKjrux6aQwjgCRPHYj51qDrIuH4oCPtjuognxaGUWBWs']
            },
            {
              id: `sample-${index + 40}`,
              name: 'Office Gadgets',
              slug: 'office-gadgets',
              category: { name: 'Work from Home' },
              price: 210,
              rating: 4,
              reviewCount: 32,
              images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuDY2wjMDaIb1N6rOM62zTGA_wSkri7gMnGM-mAwLdgTDtn9RYlVtfXwEGTbfmmkxxW7RdP_y9jBhfGW5RrJhlgKuiYua8td36BoJxdGlrHQ2aU6hk1mCUsCg804X8cu9yxiKM3OBAAAL1IMhJjLs0bUDmHHuHhmG-CfHdz4JqT0w1lnK-55Ri7OD2sJXxR5HlHeJOQDPongzP17x8gnQMCQ1KTpx5KF7yF8SqWyYrkCX8fH-7T6z8JP4is_5vIUQ5-JRJ_C8-hOnh0']
            }
          ];

          const sample = sampleProducts[index % sampleProducts.length];

          return (
            <div
              key={sample.id}
              className="bg-white dark:bg-surface-dark rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all group opacity-90"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg bg-gray-100">
                <div
                  className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                  style={{ backgroundImage: `url(${sample.images[0]})` }}
                />
                {sample.discount && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    SALE
                  </div>
                )}
                <button
                  onClick={() => toggleWishlist(sample.id)}
                  className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-red-500 flex items-center justify-center transition-colors shadow-sm ${
                    wishlistItems.has(sample.id) ? 'text-red-500' : ''
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">favorite</span>
                </button>
              </div>

              <div className="p-4">
                <Link href={`/products/${sample.slug}`}>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 truncate mb-1 hover:text-primary transition-colors">
                    {sample.name}
                  </h4>
                </Link>
                <p className="text-xs text-gray-500 mb-2">{sample.category?.name}</p>

                <div className="flex items-center gap-2 mb-3">
                  <div className="flex text-yellow-400 text-sm">
                    {renderStars(sample.rating)}
                  </div>
                  <span className="text-xs text-gray-400">({sample.reviewCount})</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">${sample.price}</span>
                    {sample.originalPrice && (
                      <span className="text-xs text-gray-400 line-through ml-1">${sample.originalPrice}</span>
                    )}
                  </div>
                  <button
                    onClick={() => addToCart(sample.id)}
                    className="text-primary hover:bg-primary/10 p-1.5 rounded-full transition-colors"
                    title="Add to cart"
                  >
                    <span className="material-symbols-outlined">add_shopping_cart</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <button className="bg-white border border-gray-300 dark:bg-surface-dark dark:border-gray-700 text-gray-700 dark:text-gray-300 px-8 py-3 rounded-full hover:bg-gray-50 transition-colors inline-flex items-center gap-2 shadow-sm">
          <span className="material-symbols-outlined animate-spin">autorenew</span>
          Load More Products
        </button>
      </div>
    </div>
  );
}
