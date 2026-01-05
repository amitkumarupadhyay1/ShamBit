'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { UserMenu } from './UserMenu';
import { MobileNav, MobileNavTrigger } from './MobileNav';
import { apiClient } from '@/lib/auth-client';

interface SearchSuggestion {
  id: string;
  name: string;
  type: 'product' | 'category' | 'seller';
  slug: string;
  location?: string;
}

export function Header() {
  const { isAuthenticated, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [userLocation, setUserLocation] = useState('Delhi');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get user location for local-first experience
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In real implementation, reverse geocode to get city name
          setUserLocation('Your Location');
        },
        () => {
          setUserLocation('Delhi'); // Fallback
        }
      );
    }
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length > 2) {
        try {
          // Real API call for search suggestions
          const response = await apiClient.get(`/search/autocomplete?q=${encodeURIComponent(searchQuery)}&location=${userLocation}`);
          setSuggestions(response.data || []);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          // Fallback suggestions for demo
          setSuggestions([
            { id: '1', name: 'Mobile Accessories', type: 'category', slug: 'mobile-accessories' },
            { id: '2', name: 'Electronics Store Near You', type: 'seller', slug: 'electronics-store', location: '2km away' }
          ]);
          setShowSuggestions(true);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, userLocation]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}&location=${userLocation}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-neutral-200">
      {/* Mobile Navigation */}
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Trust Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 text-white text-xs py-2 text-center font-medium">
        <div className="container mx-auto px-4 flex items-center justify-center gap-4 sm:gap-6">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">verified</span>
            <span className="hidden sm:inline">100% Secure Payments</span>
            <span className="sm:hidden">Secure</span>
          </div>
          <div className="hidden sm:flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">local_shipping</span>
            <span>Same Day Delivery Available</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">currency_rupee</span>
            <span className="hidden sm:inline">Cash on Delivery</span>
            <span className="sm:hidden">COD</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-8">
          {/* Mobile Menu Trigger */}
          <MobileNavTrigger onClick={() => setMobileNavOpen(true)} />
          {/* Logo & Tagline - Mobile Optimized */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="relative">
              <Image
                src="/logo.png"
                alt="ShamBit Logo"
                width={40}
                height={40}
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                priority
                loading="eager"
              />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-primary-600 tracking-tight">ShamBit</h1>
              <p className="text-[10px] sm:text-xs text-neutral-600 font-medium -mt-0.5 sm:-mt-1 italic leading-tight">
                A bit of goodness in every deal
              </p>
            </div>
          </Link>

          {/* Location Selector */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-neutral-500">location_on</span>
            <div>
              <p className="text-xs text-neutral-500">Deliver to</p>
              <p className="font-medium text-neutral-700">{userLocation}</p>
            </div>
          </div>

          {/* Search Bar - Mobile Optimized */}
          <div className="flex-1 max-w-2xl relative" ref={searchRef}>
            <form onSubmit={handleSearch}>
              <div className="flex w-full items-center rounded-lg bg-neutral-50 border border-neutral-200 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100 transition-all overflow-hidden">
                <div className="pl-3 sm:pl-4 text-neutral-400">
                  <span className="material-symbols-outlined text-lg sm:text-xl">search</span>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none py-2.5 sm:py-3 px-2 sm:px-3 text-sm text-neutral-800 placeholder:text-neutral-500 focus:ring-0 focus:outline-none"
                  placeholder="Search products, brands..."
                  onFocus={() => searchQuery.length > 2 && setShowSuggestions(true)}
                />
                <button
                  type="submit"
                  className="bg-primary-500 hover:bg-primary-600 text-white px-3 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold transition-colors"
                >
                  <span className="hidden sm:inline">Search</span>
                  <span className="sm:hidden material-symbols-outlined text-lg">search</span>
                </button>
              </div>
            </form>

            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 w-full bg-white shadow-xl rounded-b-lg border border-t-0 border-neutral-200 z-50">
                <div className="p-2">
                  {suggestions.slice(0, 5).map((suggestion) => (
                    <Link
                      key={suggestion.id}
                      href={`/${suggestion.type}/${suggestion.slug}`}
                      className="px-3 py-2 hover:bg-neutral-50 rounded cursor-pointer flex items-center gap-3 text-sm"
                      onClick={() => setShowSuggestions(false)}
                    >
                      <span className="material-symbols-outlined text-neutral-400 text-lg">
                        {suggestion.type === 'product' ? 'inventory_2' :
                         suggestion.type === 'category' ? 'category' : 'store'}
                      </span>
                      <div className="flex-1">
                        <span className="text-neutral-800">{suggestion.name}</span>
                        {suggestion.location && (
                          <span className="text-xs text-neutral-500 ml-2">{suggestion.location}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Actions - Mobile Optimized */}
          <div className="flex items-center gap-2 sm:gap-4 text-sm font-medium shrink-0">
            {!isAuthenticated ? (
              <Link 
                href="/auth/signin" 
                className="flex items-center gap-1 hover:text-primary-600 transition-colors p-1"
              >
                <span className="material-symbols-outlined text-lg">person</span>
                <span className="hidden md:block">Sign In</span>
              </Link>
            ) : (
              <UserMenu />
            )}
            
            <Link 
              href="/wishlist" 
              className="flex items-center gap-1 hover:text-primary-600 transition-colors relative p-1"
            >
              <span className="material-symbols-outlined text-lg">favorite</span>
              <span className="hidden lg:block">Wishlist</span>
            </Link>
            
            <Link 
              href="/orders" 
              className="flex items-center gap-1 hover:text-primary-600 transition-colors p-1"
            >
              <span className="material-symbols-outlined text-lg">receipt_long</span>
              <span className="hidden lg:block">Orders</span>
            </Link>
            
            <Link 
              href="/cart" 
              className="flex items-center gap-1 sm:gap-2 bg-primary-500 text-white px-2 sm:px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors shadow-sm relative"
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">shopping_cart</span>
              <span className="hidden sm:block">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-trust-orange text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="border-t border-neutral-200 bg-white hidden md:block">
        <div className="container mx-auto px-4">
          <ul className="flex items-center justify-between text-sm font-medium text-neutral-700">
            <li className="relative group py-3">
              <Link href="/categories/electronics" className="hover:text-primary-600 flex items-center gap-1 transition-colors">
                Electronics <span className="material-symbols-outlined text-lg">expand_more</span>
              </Link>
            </li>
            <li className="py-3">
              <Link href="/categories/mobile-accessories" className="hover:text-primary-600 transition-colors">
                Mobile & Accessories
              </Link>
            </li>
            <li className="py-3">
              <Link href="/categories/fashion" className="hover:text-primary-600 transition-colors">
                Fashion
              </Link>
            </li>
            <li className="py-3">
              <Link href="/categories/daily-essentials" className="hover:text-primary-600 transition-colors">
                Daily Essentials
              </Link>
            </li>
            <li className="py-3">
              <Link href="/categories/local-goods" className="hover:text-primary-600 transition-colors">
                Local Goods
              </Link>
            </li>
            <li className="py-3">
              <Link href="/sellers" className="hover:text-primary-600 transition-colors">
                Local Sellers
              </Link>
            </li>
            <li className="py-3">
              <Link href="/deals" className="hover:text-primary-600 transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-trust-orange">local_offer</span>
                Deals
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
