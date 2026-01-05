'use client';

import { useState } from 'react';
import Link from 'next/link';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const categories = [
    { name: 'Electronics', href: '/categories/electronics', icon: 'devices' },
    { name: 'Mobile & Accessories', href: '/categories/mobile-accessories', icon: 'smartphone' },
    { name: 'Fashion', href: '/categories/fashion', icon: 'checkroom' },
    { name: 'Daily Essentials', href: '/categories/daily-essentials', icon: 'local_grocery_store' },
    { name: 'Local Goods', href: '/categories/local-goods', icon: 'storefront' },
  ];

  const quickLinks = [
    { name: 'Local Sellers', href: '/sellers', icon: 'store' },
    { name: 'Deals', href: '/deals', icon: 'local_offer' },
    { name: 'Track Order', href: '/orders/track', icon: 'local_shipping' },
    { name: 'Help & Support', href: '/support', icon: 'help' },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Mobile Menu */}
      <div className="fixed top-0 left-0 w-80 max-w-[85vw] h-full bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-lg">shopping_bag</span>
              </div>
              <div>
                <h2 className="font-bold text-primary-600">ShamBit</h2>
                <p className="text-xs text-neutral-600 -mt-0.5">A bit of goodness in every deal</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Categories */}
            <div className="p-4">
              <h3 className="font-semibold text-neutral-800 mb-3 text-sm uppercase tracking-wide">
                Shop by Category
              </h3>
              <div className="space-y-1">
                {categories.map((category) => (
                  <Link
                    key={category.href}
                    href={category.href}
                    onClick={onClose}
                    className="flex items-center gap-3 p-3 hover:bg-neutral-50 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-neutral-500">{category.icon}</span>
                    <span className="text-neutral-700">{category.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-neutral-200 mx-4" />

            {/* Quick Links */}
            <div className="p-4">
              <h3 className="font-semibold text-neutral-800 mb-3 text-sm uppercase tracking-wide">
                Quick Links
              </h3>
              <div className="space-y-1">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onClose}
                    className="flex items-center gap-3 p-3 hover:bg-neutral-50 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-neutral-500">{link.icon}</span>
                    <span className="text-neutral-700">{link.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Trust Badges */}
            <div className="p-4 bg-neutral-50 mx-4 rounded-lg">
              <h4 className="font-semibold text-neutral-800 mb-2 text-sm">Why Choose ShamBit?</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="material-symbols-outlined text-trust-green text-sm">verified</span>
                  <span className="text-neutral-600">100% Secure Payments</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="material-symbols-outlined text-primary-500 text-sm">local_shipping</span>
                  <span className="text-neutral-600">Same Day Delivery</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="material-symbols-outlined text-trust-orange text-sm">currency_rupee</span>
                  <span className="text-neutral-600">Cash on Delivery</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-200 bg-neutral-50">
            <div className="text-center">
              <p className="text-xs text-neutral-600 mb-2">Need help?</p>
              <Link
                href="/support"
                onClick={onClose}
                className="inline-flex items-center gap-1 text-primary-600 font-medium text-sm"
              >
                <span className="material-symbols-outlined text-sm">support_agent</span>
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function MobileNavTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="md:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors"
      aria-label="Open menu"
    >
      <span className="material-symbols-outlined">menu</span>
    </button>
  );
}