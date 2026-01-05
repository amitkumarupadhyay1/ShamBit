'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { HeroBanner } from '@/components/HeroBanner';
import { CategoryGrid } from '@/components/CategoryGrid';
import { DealsSection } from '@/components/DealsSection';
import { MembershipCTA } from '@/components/MembershipCTA';
import { FeaturedSellers } from '@/components/FeaturedSellers';
import { RecommendedProducts } from '@/components/RecommendedProducts';
import { TrustBadges } from '@/components/TrustBadges';
import { PageLoadingSkeleton } from '@/components/LoadingStates';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';
import { LazySection } from '@/components/LazySection';
import { publicApiClient, safeApiCall, ApiResponse } from '@/lib/api-client';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category?: Category;
  brand?: { name: string };
  rating?: number;
  reviewCount?: number;
  isFeatured?: boolean;
  discount?: number;
  tags?: string[];
}

interface Banner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  position: string;
  isActive: boolean;
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHomePageData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Real API calls with proper error handling using the new public API client
        const [categoriesData, featuredData, bannersData, recommendedData] = await Promise.all([
          safeApiCall(
            () => publicApiClient.get<ApiResponse<Category[]>>('/categories?limit=8&status=ACTIVE'),
            { data: [] },
            'Failed to fetch categories'
          ),
          safeApiCall(
            () => publicApiClient.get<ApiResponse<Product[]>>('/products/featured?limit=4'),
            { data: [] },
            'Failed to fetch featured products'
          ),
          safeApiCall(
            () => publicApiClient.get<ApiResponse<Banner[]>>('/banners?position=hero&active=true'),
            { data: [] },
            'Failed to fetch banners'
          ),
          safeApiCall(
            () => publicApiClient.get<ApiResponse<Product[]>>('/products?limit=10&sortBy=createdAt&sortOrder=desc'),
            { data: [] },
            'Failed to fetch recommended products'
          ),
        ]);

        // Set the data from API responses
        setCategories(categoriesData.data || []);
        setFeaturedProducts(featuredData.data || []);
        setBanners(bannersData.data || []);
        setRecommendedProducts(recommendedData.data || []);

      } catch (error) {
        console.error('Error fetching homepage data:', error);
        setError('Failed to load some content. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchHomePageData();
  }, []);

  if (loading) {
    return <PageLoadingSkeleton />;
  }

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-text-main-light dark:text-text-main-dark antialiased">
      <PerformanceMonitor />
      <Header />

      <main className="min-h-screen">
        {/* Error Banner */}
        {error && (
          <div className="bg-trust-red/10 border border-trust-red/20 text-trust-red px-4 py-3 text-center">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Hero Banner Section */}
        <HeroBanner banners={banners} />

        {/* Trust Badges Section - Mobile Optimized */}
        <section className="py-6 sm:py-8 bg-neutral-50">
          <div className="container mx-auto px-4">
            <TrustBadges variant="horizontal" />
          </div>
        </section>

        {/* Shop by Category */}
        <CategoryGrid categories={categories} />

        {/* Flash Deals Section */}
        <LazySection fallback={<div className="h-96 bg-white animate-pulse" />}>
          <DealsSection products={featuredProducts} />
        </LazySection>

        {/* Local Sellers Spotlight */}
        <LazySection fallback={<div className="h-80 bg-neutral-50 animate-pulse" />}>
          <FeaturedSellers />
        </LazySection>

        {/* Premium Membership CTA */}
        <LazySection fallback={<div className="h-64 bg-white animate-pulse" />}>
          <MembershipCTA />
        </LazySection>

        {/* Recommended Products */}
        <LazySection fallback={<div className="h-96 bg-neutral-50 animate-pulse" />}>
          <RecommendedProducts products={recommendedProducts} />
        </LazySection>

        {/* Additional Trust Section - Mobile Optimized */}
        <LazySection fallback={<div className="h-80 bg-neutral-50 animate-pulse" />}>
          <section className="py-8 sm:py-12 bg-neutral-50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">Why Choose ShamBit?</h2>
                <p className="text-neutral-600 max-w-2xl mx-auto text-sm sm:text-base">
                  India's most trusted local marketplace with a bit of goodness in every deal
                </p>
              </div>
              <TrustBadges variant="grid" />
            </div>
          </section>
        </LazySection>
      </main>

      {/* Footer */}
      <footer className="bg-[#0f172a] text-gray-300 py-12 md:pt-20 md:pb-10 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 xl:gap-12 mb-16">
            <div className="lg:col-span-1">
              <a className="flex items-center gap-2 mb-6 group" href="#">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary-500 text-white shadow-lg group-hover:bg-primary-600 transition-colors">
                  <span className="material-symbols-outlined text-[24px]">shopping_bag</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tighter text-white">ShamBit</h2>
                  <p className="text-xs text-gray-400 italic -mt-1">A bit of goodness in every deal</p>
                </div>
              </a>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                India's most trusted local marketplace. We connect you with verified sellers near you for fast, reliable, and affordable shopping.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="material-symbols-outlined text-base">location_on</span>
                <span>Serving 100+ cities across India</span>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-base text-white mb-6 tracking-wide uppercase text-xs">About ShamBit</h3>
              <ul className="space-y-3 text-sm">
                <li><a className="hover:text-primary-400 transition-colors" href="/about">About Us</a></li>
                <li><a className="hover:text-primary-400 transition-colors" href="/careers">Careers</a></li>
                <li><a className="hover:text-primary-400 transition-colors" href="/press">Press</a></li>
                <li><a className="hover:text-primary-400 transition-colors" href="/investors">Investors</a></li>
                <li><a className="hover:text-primary-400 transition-colors" href="/blog">ShamBit Stories</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-base text-white mb-6 tracking-wide uppercase text-xs">Help & Support</h3>
              <ul className="space-y-3 text-sm">
                <li><a className="hover:text-primary-400 transition-colors" href="/shipping">Shipping Info</a></li>
                <li><a className="hover:text-primary-400 transition-colors" href="/returns">Returns & Exchange</a></li>
                <li><a className="hover:text-primary-400 transition-colors" href="/how-to-order">How to Order</a></li>
                <li><a className="hover:text-primary-400 transition-colors" href="/track-order">Track Order</a></li>
                <li><a className="hover:text-primary-400 transition-colors" href="/buying-guide">Buying Guide</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-base text-white mb-6 tracking-wide uppercase text-xs">Customer Care</h3>
              <ul className="space-y-3 text-sm">
                <li><a className="hover:text-primary-400 transition-colors" href="/contact">Contact Us</a></li>
                <li><a className="hover:text-primary-400 transition-colors" href="/faq">FAQ</a></li>
                <li><a className="hover:text-primary-400 transition-colors" href="/terms">Terms of Service</a></li>
                <li><a className="hover:text-primary-400 transition-colors" href="/privacy">Privacy Policy</a></li>
                <li><a className="hover:text-primary-400 transition-colors" href="/report">Report Issue</a></li>
              </ul>
            </div>
            <div className="lg:col-span-1">
              <h3 className="font-bold text-base text-white mb-6 tracking-wide uppercase text-xs">Connect with Us</h3>
              <div className="flex gap-3 mb-8">
                <a aria-label="Facebook" className="size-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-all text-gray-400" href="#">
                  <span className="material-symbols-outlined text-[20px]">public</span>
                </a>
                <a aria-label="Instagram" className="size-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#E4405F] hover:text-white transition-all text-gray-400" href="#">
                  <span className="material-symbols-outlined text-[20px]">camera_alt</span>
                </a>
                <a aria-label="Twitter" className="size-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#1DA1F2] hover:text-white transition-all text-gray-400" href="#">
                  <span className="material-symbols-outlined text-[20px]">alternate_email</span>
                </a>
                <a aria-label="LinkedIn" className="size-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#0A66C2] hover:text-white transition-all text-gray-400" href="#">
                  <span className="material-symbols-outlined text-[20px]">business_center</span>
                </a>
              </div>
              <h4 className="font-semibold text-sm text-white mb-3">Subscribe to our newsletter</h4>
              <form className="flex w-full">
                <input 
                  className="w-full bg-gray-800 border-none text-sm px-4 py-2.5 rounded-l-lg focus:ring-1 focus:ring-primary-500 text-white placeholder-gray-500 outline-none" 
                  placeholder="Your email" 
                  type="email"
                />
                <button 
                  className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-r-lg transition-colors flex items-center justify-center" 
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
              </form>
            </div>
          </div>
          
          {/* Payment Methods & Security */}
          <div className="border-t border-gray-800 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-trust-green">lock</span>
                <span className="text-sm font-medium text-gray-400">100% Secure Payment • SSL Encrypted</span>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                <div className="h-8 w-12 bg-white rounded flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity">
                  <span className="font-black text-[#1a1f71] text-xs italic tracking-tighter">VISA</span>
                </div>
                <div className="h-8 w-12 bg-white rounded flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity overflow-hidden relative">
                  <div className="absolute left-2 size-4 rounded-full bg-[#eb001b] mix-blend-multiply"></div>
                  <div className="absolute right-2 size-4 rounded-full bg-[#f79e1b] mix-blend-multiply"></div>
                </div>
                <div className="h-8 w-12 bg-white rounded flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity">
                  <span className="font-bold text-[#003087] text-[10px] italic">PayPal</span>
                </div>
                <div className="h-8 w-12 bg-white rounded flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity gap-0.5">
                  <span className="material-symbols-outlined text-black text-[14px]">account_balance</span>
                  <span className="font-bold text-black text-[8px]">UPI</span>
                </div>
                <div className="h-8 w-12 bg-white rounded flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity gap-0.5">
                  <span className="font-bold text-gray-500 text-[10px]"><span className="text-blue-500">G</span>Pay</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <p>© 2024 ShamBit Inc. All rights reserved. • A bit of goodness in every deal</p>
            <div className="flex flex-wrap justify-center gap-6 md:gap-8">
              <a className="hover:text-primary-400 transition-colors" href="/privacy">Privacy Policy</a>
              <a className="hover:text-primary-400 transition-colors" href="/terms">Terms of Use</a>
              <a className="hover:text-primary-400 transition-colors" href="/sitemap">Sitemap</a>
              <a className="hover:text-primary-400 transition-colors" href="/security">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}