'use client';

import { getPricingPlans, getFeaturedBoostPricing } from '@/lib/mockData';
import { Check, X } from 'lucide-react';
import { PricingPlan } from '@/lib/types';
import { useState } from 'react';
import { generatePaymentReference, processPaystackPaymentFlow } from '@/lib/payments';

interface PricingTableProps {
  type: 'subscription' | 'featured-boost';
}

export function PricingTable({ type }: PricingTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handlePurchase = async (payload: {
    id: string;
    amount: number;
    type: 'subscription' | 'featured_listing' | 'boost' | 'verification';
    metadata?: Record<string, any>;
  }) => {
    try {
      setLoadingId(payload.id);
      const response = await processPaystackPaymentFlow({
        amount: payload.amount,
        currency: 'GHS',
        email: 'admin@hommie.com',
        type: payload.type,
        reference: generatePaymentReference('PAYSTACK'),
        metadata: payload.metadata,
      });

      if (response.status === 'success' && response.data?.authorization_url) {
        if (typeof window !== 'undefined') {
          window.open(response.data.authorization_url, '_blank');
        }
      } else if (typeof window !== 'undefined') {
        window.alert(response.message || 'Payment initialization failed');
      }
    } finally {
      setLoadingId(null);
    }
  };

  if (type === 'subscription') {
    const plans = getPricingPlans();

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-surface rounded-3xl p-6 shadow-sm border ${
              plan.id === 'pro' ? 'border-primary border-2' : 'border-border'
            }`}
          >
            {plan.id === 'pro' && (
              <div className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-4">
                Most Popular
              </div>
            )}
            <h3 className="text-xl font-bold text-text-primary mb-2">{plan.name}</h3>
            <div className="mb-6">
              {plan.id === 'enterprise' ? (
                <span className="text-3xl font-bold text-text-primary">Contact sales</span>
              ) : (
                <>
                  <span className="text-3xl font-bold text-text-primary">₵{plan.price}</span>
                  <span className="text-text-secondary">/{plan.interval}</span>
                </>
              )}
            </div>
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check size={20} className="text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-text-secondary">{feature}</span>
                </li>
              ))}
              {plan.max_listings === null ? (
                <li className="flex items-start gap-2">
                  <Check size={20} className="text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-text-secondary">Unlimited listings</span>
                </li>
              ) : (
                <li className="flex items-start gap-2">
                  <Check size={20} className="text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-text-secondary">Up to {plan.max_listings} listings</span>
                </li>
              )}
            </ul>
            <button
              className={`w-full py-3 rounded-2xl font-semibold transition-colors ${
                plan.id === 'pro'
                  ? 'bg-primary text-white hover:bg-primary-dark'
                  : plan.id === 'free'
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-background border-2 border-primary text-primary hover:bg-primary-light'
              }`}
              onClick={() => {
                if (plan.id === 'enterprise') {
                  if (typeof window !== 'undefined') {
                    window.location.href = 'mailto:hommie2066@gmail.com?subject=Hommie%20Enterprise%20Plan';
                  }
                  return;
                }
                handlePurchase({
                  id: `plan_${plan.id}`,
                  amount: plan.price,
                  type: 'subscription',
                  metadata: { plan: plan.id },
                });
              }}
              disabled={plan.id === 'free' || loadingId === `plan_${plan.id}`}
            >
              {plan.id === 'free'
                ? 'Current Plan'
                : plan.id === 'enterprise'
                ? 'Contact sales'
                : loadingId === `plan_${plan.id}`
                ? 'Processing...'
                : 'Choose Plan'}
            </button>
          </div>
        ))}
      </div>
    );
  } else {
    const pricing = getFeaturedBoostPricing();

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Featured 7 Days */}
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
          <h3 className="text-xl font-bold text-text-primary mb-2">7 Days Featured</h3>
          <div className="mb-6">
            <span className="text-3xl font-bold text-text-primary">₵{pricing.featured_7_days.price}</span>
            <span className="text-text-secondary text-sm"> for {pricing.featured_7_days.duration} days</span>
          </div>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-2">
              <Check size={20} className="text-success flex-shrink-0 mt-0.5" />
              <span className="text-sm text-text-secondary">Appears at top of search results</span>
            </li>
            <li className="flex items-start gap-2">
              <Check size={20} className="text-success flex-shrink-0 mt-0.5" />
              <span className="text-sm text-text-secondary">Featured badge</span>
            </li>
            <li className="flex items-start gap-2">
              <Check size={20} className="text-success flex-shrink-0 mt-0.5" />
              <span className="text-sm text-text-secondary">Priority in map view</span>
            </li>
          </ul>
          <button
            className="w-full py-3 bg-primary text-white rounded-2xl font-semibold hover:bg-primary-dark transition-colors"
            onClick={() =>
              handlePurchase({
                id: 'featured_7_days',
                amount: pricing.featured_7_days.price,
                type: 'featured_listing',
                metadata: { duration: pricing.featured_7_days.duration },
              })
            }
            disabled={loadingId === 'featured_7_days'}
          >
            {loadingId === 'featured_7_days' ? 'Processing...' : 'Purchase'}
          </button>
        </div>

        {/* Featured 30 Days */}
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-primary border-2">
          <div className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-4">
                Best Value
              </div>
          <h3 className="text-xl font-bold text-text-primary mb-2">30 Days Featured</h3>
          <div className="mb-6">
            <span className="text-3xl font-bold text-text-primary">₵{pricing.featured_30_days.price}</span>
            <span className="text-text-secondary text-sm"> for {pricing.featured_30_days.duration} days</span>
            <p className="text-sm text-success mt-1">Save ₵{pricing.featured_7_days.price * 4 - pricing.featured_30_days.price}</p>
          </div>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-2">
              <Check size={20} className="text-success flex-shrink-0 mt-0.5" />
              <span className="text-sm text-text-secondary">Appears at top of search results</span>
            </li>
            <li className="flex items-start gap-2">
              <Check size={20} className="text-success flex-shrink-0 mt-0.5" />
              <span className="text-sm text-text-secondary">Featured badge</span>
            </li>
            <li className="flex items-start gap-2">
              <Check size={20} className="text-success flex-shrink-0 mt-0.5" />
              <span className="text-sm text-text-secondary">Priority in map view</span>
            </li>
            <li className="flex items-start gap-2">
              <Check size={20} className="text-success flex-shrink-0 mt-0.5" />
              <span className="text-sm text-text-secondary">Extended visibility</span>
            </li>
          </ul>
          <button
            className="w-full py-3 bg-primary text-white rounded-2xl font-semibold hover:bg-primary-dark transition-colors"
            onClick={() =>
              handlePurchase({
                id: 'featured_30_days',
                amount: pricing.featured_30_days.price,
                type: 'featured_listing',
                metadata: { duration: pricing.featured_30_days.duration },
              })
            }
            disabled={loadingId === 'featured_30_days'}
          >
            {loadingId === 'featured_30_days' ? 'Processing...' : 'Purchase'}
          </button>
        </div>

        {/* Daily Boost */}
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
          <h3 className="text-xl font-bold text-text-primary mb-2">Daily Boost</h3>
          <div className="mb-6">
            <span className="text-3xl font-bold text-text-primary">₵{pricing.boost_daily.price}</span>
            <span className="text-text-secondary text-sm">/day</span>
          </div>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-2">
              <Check size={20} className="text-success flex-shrink-0 mt-0.5" />
              <span className="text-sm text-text-secondary">Boost visibility for 1 day</span>
            </li>
            <li className="flex items-start gap-2">
              <Check size={20} className="text-success flex-shrink-0 mt-0.5" />
              <span className="text-sm text-text-secondary">Higher in search results</span>
            </li>
            <li className="flex items-start gap-2">
              <Check size={20} className="text-success flex-shrink-0 mt-0.5" />
              <span className="text-sm text-text-secondary">Perfect for quick promotions</span>
            </li>
          </ul>
          <button
            className="w-full py-3 bg-background border-2 border-primary text-primary rounded-2xl font-semibold hover:bg-primary-light transition-colors"
            onClick={() =>
              handlePurchase({
                id: 'boost_daily',
                amount: pricing.boost_daily.price,
                type: 'boost',
                metadata: { duration: pricing.boost_daily.duration },
              })
            }
            disabled={loadingId === 'boost_daily'}
          >
            {loadingId === 'boost_daily' ? 'Processing...' : 'Purchase'}
          </button>
        </div>

        {/* Verification Badge */}
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
          <h3 className="text-xl font-bold text-text-primary mb-2">Verification Badge</h3>
          <div className="mb-6">
            <span className="text-3xl font-bold text-text-primary">₵{pricing.verification.price}</span>
            <span className="text-text-secondary text-sm"> one-time</span>
          </div>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-2">
              <Check size={20} className="text-success flex-shrink-0 mt-0.5" />
              <span className="text-sm text-text-secondary">Verified badge on listing</span>
            </li>
            <li className="flex items-start gap-2">
              <Check size={20} className="text-success flex-shrink-0 mt-0.5" />
              <span className="text-sm text-text-secondary">Build trust with tenants</span>
            </li>
            <li className="flex items-start gap-2">
              <Check size={20} className="text-success flex-shrink-0 mt-0.5" />
              <span className="text-sm text-text-secondary">Admin review included</span>
            </li>
            <li className="flex items-start gap-2">
              <Check size={20} className="text-success flex-shrink-0 mt-0.5" />
              <span className="text-sm text-text-secondary">Lifetime validity</span>
            </li>
          </ul>
          <button
            className="w-full py-3 bg-background border-2 border-primary text-primary rounded-2xl font-semibold hover:bg-primary-light transition-colors"
            onClick={() =>
              handlePurchase({
                id: 'verification',
                amount: pricing.verification.price,
                type: 'verification',
                metadata: { one_time: true },
              })
            }
            disabled={loadingId === 'verification'}
          >
            {loadingId === 'verification' ? 'Processing...' : 'Purchase'}
          </button>
        </div>
      </div>
    );
  }
}
