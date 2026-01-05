'use client';

export function MembershipCTA() {
  return (
    <div className="container mx-auto px-4 mb-8">
      <div className="w-full h-32 md:h-48 rounded-xl bg-gray-800 relative overflow-hidden flex items-center shadow-md">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900 to-blue-900"></div>
        <div className="relative z-10 px-8 md:px-12 w-full flex justify-between items-center">
          <div className="text-white">
            <span className="uppercase tracking-widest text-xs font-bold text-yellow-400 mb-2 block">Premium Membership</span>
            <h3 className="text-2xl md:text-3xl font-bold mb-1">Join ShamBit Plus</h3>
            <p className="text-sm md:text-base text-gray-300">Free delivery, early access to sales, and exclusive rewards.</p>
          </div>
          <button className="hidden sm:block bg-yellow-400 text-black font-bold px-6 py-3 rounded hover:bg-yellow-300 transition-colors">
            Join Now
          </button>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 skew-x-12 transform translate-x-12"></div>
      </div>
    </div>
  );
}
