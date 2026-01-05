'use client';

interface TrustBadge {
  icon: string;
  title: string;
  description: string;
  color: 'green' | 'blue' | 'orange' | 'purple';
}

interface TrustBadgesProps {
  variant?: 'horizontal' | 'grid';
  showTitle?: boolean;
}

export function TrustBadges({ variant = 'horizontal', showTitle = true }: TrustBadgesProps) {
  const badges: TrustBadge[] = [
    {
      icon: 'verified',
      title: '100% Secure',
      description: 'SSL encrypted payments',
      color: 'green'
    },
    {
      icon: 'local_shipping',
      title: 'Same Day Delivery',
      description: 'From nearby sellers',
      color: 'blue'
    },
    {
      icon: 'currency_rupee',
      title: 'Cash on Delivery',
      description: 'Pay when you receive',
      color: 'orange'
    },
    {
      icon: 'assignment_return',
      title: 'Easy Returns',
      description: '7-day return policy',
      color: 'purple'
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      green: 'bg-trust-green/10 text-trust-green border-trust-green/20',
      blue: 'bg-primary-50 text-primary-600 border-primary-200',
      orange: 'bg-trust-orange/10 text-trust-orange border-trust-orange/20',
      purple: 'bg-purple-50 text-purple-600 border-purple-200'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.green;
  };

  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {badges.map((badge, index) => (
          <div
            key={index}
            className={`p-3 sm:p-4 rounded-lg border text-center transition-all hover:shadow-md ${getColorClasses(badge.color)}`}
          >
            <div className="flex justify-center mb-2">
              <span className="material-symbols-outlined text-xl sm:text-2xl">{badge.icon}</span>
            </div>
            {showTitle && (
              <>
                <h3 className="font-semibold text-xs sm:text-sm mb-1">{badge.title}</h3>
                <p className="text-[10px] sm:text-xs opacity-80 leading-tight">{badge.description}</p>
              </>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
      {badges.map((badge, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${getColorClasses(badge.color)}`}>
            <span className="material-symbols-outlined text-sm">{badge.icon}</span>
          </div>
          {showTitle && (
            <div>
              <p className="font-semibold text-neutral-800 text-xs sm:text-sm">{badge.title}</p>
              <p className="text-[10px] sm:text-xs text-neutral-600 leading-tight">{badge.description}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}