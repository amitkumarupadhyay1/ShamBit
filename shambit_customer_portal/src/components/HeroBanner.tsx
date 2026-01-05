'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

interface HeroBannerProps {
  banners: Banner[];
}

export function HeroBanner({ banners }: HeroBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [userLocation, setUserLocation] = useState('Delhi');

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [banners.length]);

  // Default trust-focused hero content
  const defaultHeroContent = {
    title: "India's Most Trusted Local Marketplace",
    subtitle: "Shop from verified sellers near you",
    description: "Get same-day delivery, cash on delivery, and easy returns on everything you need.",
    features: [
      { icon: "local_shipping", text: "Same-day delivery from nearby sellers" },
      { icon: "currency_rupee", text: "Cash on Delivery available" },
      { icon: "verified", text: "100% verified sellers" },
      { icon: "assignment_return", text: "Easy 7-day returns" }
    ]
  };

  if (!banners || banners.length === 0) {
    return (
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-trust-green/10 text-trust-green px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <span className="material-symbols-outlined text-sm">verified</span>
                Trusted by 50,000+ customers
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 mb-4 leading-tight">
                {defaultHeroContent.title}
              </h1>
              
              <p className="text-xl text-neutral-600 mb-6 max-w-lg mx-auto lg:mx-0">
                {defaultHeroContent.subtitle}
              </p>
              
              <p className="text-neutral-600 mb-8 max-w-lg mx-auto lg:mx-0">
                {defaultHeroContent.description}
              </p>

              {/* Trust Features */}
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {defaultHeroContent.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary-600 text-sm">{feature.icon}</span>
                    </div>
                    <span className="text-neutral-700">{feature.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/categories"
                  className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                >
                  Start Shopping
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
                <Link
                  href="/sellers"
                  className="border-2 border-primary-500 text-primary-600 hover:bg-primary-50 px-8 py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-2"
                >
                  Find Local Sellers
                  <span className="material-symbols-outlined">store</span>
                </Link>
              </div>
            </div>

            {/* Visual */}
            <div className="relative">
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="absolute -top-4 -right-4 bg-trust-orange text-white px-4 py-2 rounded-full text-sm font-bold">
                  Same Day Delivery
                </div>
                
                {/* Mock Product Cards */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary-600">smartphone</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-neutral-800">Mobile Accessories</p>
                      <p className="text-sm text-neutral-600">From stores near {userLocation}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary-600">₹299</p>
                      <p className="text-xs text-trust-green">In Stock</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg">
                    <div className="w-12 h-12 bg-trust-green/10 rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined text-trust-green">local_grocery_store</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-neutral-800">Daily Essentials</p>
                      <p className="text-sm text-neutral-600">2km away • COD Available</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary-600">₹150</p>
                      <p className="text-xs text-trust-green">Fast Delivery</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const currentBanner = banners[currentSlide];

  return (
    <section className="relative bg-gradient-to-br from-primary-50 to-primary-100 py-12 md:py-16 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[400px] md:h-[500px]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${currentBanner.imageUrl})`
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent flex items-center">
            <div className="px-8 md:px-16 max-w-3xl text-white">
              <div className="inline-flex items-center gap-2 bg-trust-green text-white px-4 py-2 rounded-full text-sm font-bold mb-6">
                <span className="material-symbols-outlined text-sm">verified</span>
                Trusted Marketplace
              </div>
              
              <h2 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
                {currentBanner.title}
              </h2>
              
              <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl">
                {currentBanner.description}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={currentBanner.ctaLink || '/categories'}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                >
                  {currentBanner.ctaText || 'Shop Now'}
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
                <Link
                  href="/sellers"
                  className="border-2 border-white text-white hover:bg-white hover:text-neutral-800 px-8 py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2"
                >
                  Local Sellers
                  <span className="material-symbols-outlined">store</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Slide indicators */}
          {banners.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-12 h-1 rounded-full transition-colors ${
                    index === currentSlide ? 'bg-white' : 'bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
