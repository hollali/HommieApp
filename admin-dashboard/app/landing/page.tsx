'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '@/components/Logo';
import { PricingTable } from '@/components/PricingTable';

export default function LandingPage() {
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const openEmail = async (opts: { subject: string; body?: string }) => {
    const to = 'hommie2066@gmail.com';
    const subject = opts.subject || 'Hommie';
    const bodyFromPhone = phone.trim()
      ? `\n\nMy phone number: +233 ${phone.trim()}`
      : '';
    const body = (opts.body || 'Hi Hommie team,').trim() + bodyFromPhone;

    const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Try mailto first (opens native mail apps when configured)
    try {
      window.location.href = mailto;
      // If nothing handles mailto, user will stay on page; provide a fast fallback.
      setTimeout(() => {
        // Open Gmail compose in a new tab as a reliable fallback
        window.open(gmail, '_blank', 'noopener,noreferrer');
      }, 300);
      return;
    } catch {
      // ignore
    }

    // Clipboard fallback (best effort)
    try {
      await navigator.clipboard.writeText(to);
      alert(`Email copied: ${to}`);
    } catch {
      alert(`Please email us at: ${to}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setSubmitted(true);
    openEmail({
      subject: 'Hommie Waitlist',
      body: "Hi Hommie team,\n\nI'd like to join the waitlist / get early access.",
    });
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="small" className="justify-start" />
          <nav className="hidden md:flex items-center gap-6 text-sm text-text-secondary">
            <a href="#features" className="hover:text-text-primary">Features</a>
            <a href="#about" className="hover:text-text-primary">About</a>
            <a href="#screens" className="hover:text-text-primary">Screens</a>
            <a href="#pricing" className="hover:text-text-primary">Pricing</a>
            <a href="#faq" className="hover:text-text-primary">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="mailto:hommie2066@gmail.com?subject=Hommie%20Sales%20Inquiry"
              onClick={(e) => {
                e.preventDefault();
                openEmail({
                  subject: 'Hommie Sales Inquiry',
                  body: "Hi Hommie team,\n\nI'd like to talk to sales about the Enterprise plan.",
                });
              }}
              className="px-4 py-2 rounded-2xl border border-border text-sm font-semibold hover:bg-surface transition-colors"
            >
              Contact Sales
            </a>
            <a
              href="#cta"
              className="px-4 py-2 rounded-2xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
            >
              Get the App
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold mb-4 animate-fade-up"
            style={{ animationDelay: '0.05s' }}
          >
            New in Ghana
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight animate-fade-up" style={{ animationDelay: '0.12s' }}>
            Find your next home faster with Hommie
          </h1>
          <p className="mt-4 text-text-secondary text-lg animate-fade-up" style={{ animationDelay: '0.2s' }}>
            Browse verified listings, chat with landlords, book viewings, and rent with confidence.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <a
              href="#screens"
              className="px-6 py-3 rounded-2xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors animate-glow"
            >
              See the App
            </a>
            <a
              href="#pricing"
              className="px-6 py-3 rounded-2xl border border-border font-semibold hover:bg-surface transition-colors"
            >
              Pricing
            </a>
          </div>
          {/* Mobile-like input */}
          <form
            id="cta"
            onSubmit={handleSubmit}
            className="mt-8 bg-surface border border-border rounded-3xl p-4 flex items-center gap-3 shadow-sm animate-fade-up"
            style={{ animationDelay: '0.4s' }}
          >
            <div className="px-3 py-2 rounded-2xl bg-background text-text-secondary text-sm">
              +233
            </div>
            <input
              type="tel"
              className="flex-1 bg-transparent outline-none text-sm"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-2xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors animate-glow"
            >
              {submitted ? 'Saved' : 'Get Early Access'}
            </button>
          </form>
          {submitted && (
            <p className="mt-3 text-sm text-success">Thanks! We’ll notify you when the app is live.</p>
          )}
        </div>

        {/* App preview */}
        <div className="relative">
          <div className="absolute -top-6 -left-6 w-48 h-48 bg-primary/10 rounded-full blur-2xl animate-float-soft" />
          <div className="relative grid grid-cols-2 gap-6">
            <div
              className="rounded-[32px] bg-surface border border-border p-4 shadow-lg animate-fade-in animate-float-soft transition-transform hover:-translate-y-1"
              style={{ animationDelay: '0.2s' }}
            >
              <Image
                src="/landing-home.png"
                alt="App screen 1"
                width={480}
                height={480}
                className="rounded-2xl object-contain"
              />
            </div>
            <div
              className="rounded-[32px] bg-surface border border-border p-4 shadow-lg mt-10 animate-fade-in animate-float-soft transition-transform hover:-translate-y-1"
              style={{ animationDelay: '0.35s' }}
            >
              <Image
                src="/landing-favorites.png"
                alt="App screen 2"
                width={480}
                height={480}
                className="rounded-2xl object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-2">Powerful Features</h2>
          <p className="text-text-secondary">Everything you need to find your perfect home</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: 'Verified listings',
              text: 'Reduce scams with verification and trust signals.',
            },
            {
              title: 'Enhanced chat',
              text: 'Real-time messaging with typing indicators and read receipts.',
            },
            {
              title: 'Smart discovery',
              text: 'Search by location, price, and amenities with ease.',
            },
            {
              title: 'Property lists',
              text: 'Save and organize your favorite properties into custom lists.',
            },
            {
              title: 'Report & safety',
              text: 'Report suspicious listings to keep the platform safe.',
            },
            {
              title: 'Flexible payments',
              text: 'Pay with Mobile Money, cards, or bank transfer.',
            },
          ].map((item, index) => (
            <div
              key={item.title}
              className="bg-surface border border-border rounded-3xl p-6 shadow-sm animate-fade-up transition-transform hover:-translate-y-1"
              style={{ animationDelay: `${0.1 + index * 0.08}s` }}
            >
              <h3 className="text-lg font-bold mb-2">{item.title}</h3>
              <p className="text-text-secondary text-sm">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-surface border border-border rounded-3xl p-8 md:p-10 animate-fade-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-3">About Hommie</h2>
              <p className="text-text-secondary">
                Hommie is Ghana’s rental marketplace built to make finding and listing homes simple,
                trusted, and fast. We connect tenants with verified landlords and agents, giving
                everyone a smoother experience from search to move‑in.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Verified listings', value: 'Trust first' },
                { label: 'Enhanced chat', value: 'Real-time messaging' },
                { label: 'Smart filters', value: 'Find faster' },
                { label: 'Property lists', value: 'Organize favorites' },
                { label: 'Report system', value: 'Stay safe' },
                { label: 'Local focus', value: 'Built for Ghana' },
              ].map((item) => (
                <div key={item.label} className="bg-background border border-border rounded-2xl p-4">
                  <p className="font-semibold text-text-primary">{item.label}</p>
                  <p className="text-text-secondary">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Screens */}
      <section id="screens" className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">App Screens</h2>
          <a
            href="mailto:hommie2066@gmail.com?subject=Hommie%20Waitlist"
            onClick={(e) => {
              e.preventDefault();
              openEmail({
                subject: 'Hommie Waitlist',
                body: "Hi Hommie team,\n\nI'd like to join the waitlist / get early access.",
              });
            }}
            className="text-primary font-semibold"
          >
            Join the waitlist
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { src: '/landing-home.png', label: 'Discover' },
            { src: '/landing-favorites.png', label: 'Browse Listings' },
            { src: '/landing-chat.png', label: 'Chat & Book' },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-surface border border-border rounded-3xl p-4 shadow-sm animate-fade-up transition-transform hover:-translate-y-1"
            >
              <Image
                src={item.src}
                alt={item.label}
                width={500}
                height={500}
                className="rounded-2xl object-contain"
              />
              <p className="mt-3 text-sm text-text-secondary">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Pricing</h2>
          <p className="text-text-secondary">Flexible plans for agents and landlords.</p>
        </div>
        <PricingTable type="subscription" />
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-surface border border-border rounded-3xl p-6">
          <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4 text-sm text-text-secondary">
            <div>
              <p className="font-semibold text-text-primary">When will the app be available?</p>
              <p>We&apos;re launching a beta soon. Join the waitlist to get early access.</p>
            </div>
            <div>
              <p className="font-semibold text-text-primary">Is Hommie free for tenants?</p>
              <p>Yes. Tenants can browse, chat, and save favorites for free.</p>
            </div>
            <div>
              <p className="font-semibold text-text-primary">Do you verify listings?</p>
              <p>Yes, verified listings are available for a small fee. You can also report suspicious listings.</p>
            </div>
            <div>
              <p className="font-semibold text-text-primary">What payment methods do you accept?</p>
              <p>We support Mobile Money (MTN, Vodafone, AirtelTigo), cards, and bank transfers.</p>
            </div>
            <div>
              <p className="font-semibold text-text-primary">Can I organize my saved properties?</p>
              <p>Yes! Create custom lists to organize properties by location, price range, or any category you want.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="small" className="justify-start" />
          <p className="text-sm text-text-secondary">© 2025 Hommie. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
