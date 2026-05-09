// components/landing/Testimonials.tsx
// Testimonial section for landing page

import TESTIMONIALS, { Testimonial, getAverageRating, getTotalTestimonials } from '@/lib/testimonials';

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < rating ? 'text-black' : 'text-[rgba(0,0,0,0.08)]'}>
      ★
    </span>
  ));
}

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#6A0572]/5 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 relative">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-[#000000]/10 border border-[#000000]/30 rounded-full text-black text-sm font-medium mb-6">
            ⭐ {getAverageRating()}/5 Average Rating from {getTotalTestimonials()} Users
          </span>
          <h2 className="text-4xl md:text-5xl font-medium text-black mb-4">
            Real Results from Real Users
          </h2>
          <p className="text-[#636363] text-lg max-w-2xl mx-auto">
            See how accurate birth time rectification transformed their astrological predictions
          </p>
        </div>

        {/* Testimonial Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {TESTIMONIALS.map((testimonial) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              renderStars={renderStars}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface TestimonialCardProps {
  testimonial: Testimonial;
  renderStars: (rating: number) => JSX.Element[];
}

function TestimonialCard({ testimonial, renderStars }: TestimonialCardProps) {
  return (
    <div className="glass-card bg-white border border-[rgba(0,0,0,0.08)] rounded-xl overflow-hidden">
      <details className="group">
        <summary className="p-6 cursor-pointer list-none">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Avatar with initials */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#000000]/30 to-[#6A0572]/30 flex items-center justify-center">
                <span className="text-black font-medium text-lg">
                  {testimonial.name ? testimonial.name.split(' ').map(n => n[0] || '').join('') || '?' : '?'}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-black">{testimonial.name}</h4>
                <p className="text-xs text-[#636363]">{testimonial.profession}</p>
                <p className="text-xs text-[#636363]">{testimonial.location}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm">{renderStars(testimonial.rating)}</div>
              {testimonial.verified && (
                <span className="text-xs text-[#184131] flex items-center gap-1 justify-end mt-1">
                  <span>✓</span> Verified
                </span>
              )}
            </div>
          </div>

          {/* Quote - short version visible in summary */}
          <div className="mb-4">
            <p className="text-[#636363] italic leading-relaxed">
              &quot;{testimonial.shortQuote}&quot;
            </p>
          </div>

          {/* Result Badge */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="px-3 py-1.5 bg-[var(--prism-canvas)] rounded-lg">
              <span className="text-xs text-[#636363] block">Original</span>
              <span className="text-sm font-mono text-red-600 line-through">{testimonial.result.originalTime}</span>
            </div>
            <span className="text-black">→</span>
            <div className="px-3 py-1.5 bg-[#184131]/20 rounded-lg border border-[#184131]/30">
              <span className="text-xs text-[#184131] block">Rectified</span>
              <span className="text-sm font-mono text-[#184131] font-medium">{testimonial.result.rectifiedTime}</span>
            </div>
            <div className="px-3 py-1.5 bg-[#000000]/10 rounded-lg">
              <span className="text-xs text-black block">Accuracy</span>
              <span className="text-sm font-mono text-black font-medium">{testimonial.result.accuracyAchieved}%</span>
            </div>
          </div>

          {/* Highlight */}
          <div className="p-3 bg-[#6A0572]/10 rounded-lg border border-[#6A0572]/20 mb-4">
            <p className="text-sm text-[#6A0572]">
              <span className="font-medium">Key Benefit:</span> {testimonial.highlight}
            </p>
          </div>

          {/* Expand/Collapse indicator */}
          <div className="text-sm text-black flex items-center gap-1">
            Read Full Story
            <span className="transition-transform group-open:rotate-180">▼</span>
          </div>
        </summary>

        {/* Full review - shown when expanded */}
        <div className="px-6 pb-6 border-t border-[rgba(0,0,0,0.08)] pt-4">
          <p className="text-[#636363] italic leading-relaxed">
            &quot;{testimonial.fullReview}&quot;
          </p>
        </div>
      </details>
    </div>
  );
}
