// components/landing/Testimonials.tsx
// Testimonial section for landing page

import TESTIMONIALS, { Testimonial, getAverageRating, getTotalTestimonials } from '@/lib/testimonials';

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < rating ? 'text-[#78611D]' : 'text-[#F0E8DE]'}>
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
          <span className="inline-block px-4 py-2 bg-[#78611D]/10 border border-[#78611D]/30 rounded-full text-[#78611D] text-sm font-medium mb-6">
            ⭐ {getAverageRating()}/5 Average Rating from {getTotalTestimonials()} Users
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#1A1612] mb-4">
            Real Results from Real Users
          </h2>
          <p className="text-[#4A453F] text-lg max-w-2xl mx-auto">
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
    <div className="glass-card bg-white border border-[#F0E8DE] rounded-xl overflow-hidden">
      <details className="group">
        <summary className="p-6 cursor-pointer list-none">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Avatar with initials */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#78611D]/30 to-[#6A0572]/30 flex items-center justify-center">
                <span className="text-[#78611D] font-bold text-lg">
                  {testimonial.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-[#1A1612]">{testimonial.name}</h4>
                <p className="text-xs text-[#7A756F]">{testimonial.profession}</p>
                <p className="text-xs text-[#7A756F]">{testimonial.location}</p>
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
            <p className="text-[#4A453F] italic leading-relaxed">
              &quot;{testimonial.shortQuote}&quot;
            </p>
          </div>

          {/* Result Badge */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="px-3 py-1.5 bg-[#F5EFE7] rounded-lg">
              <span className="text-xs text-[#7A756F] block">Original</span>
              <span className="text-sm font-mono text-red-600 line-through">{testimonial.result.originalTime}</span>
            </div>
            <span className="text-[#78611D]">→</span>
            <div className="px-3 py-1.5 bg-[#184131]/20 rounded-lg border border-[#184131]/30">
              <span className="text-xs text-[#184131] block">Rectified</span>
              <span className="text-sm font-mono text-[#184131] font-bold">{testimonial.result.rectifiedTime}</span>
            </div>
            <div className="px-3 py-1.5 bg-[#78611D]/10 rounded-lg">
              <span className="text-xs text-[#78611D] block">Accuracy</span>
              <span className="text-sm font-mono text-[#78611D] font-bold">{testimonial.result.accuracyAchieved}%</span>
            </div>
          </div>

          {/* Highlight */}
          <div className="p-3 bg-[#6A0572]/10 rounded-lg border border-[#6A0572]/20 mb-4">
            <p className="text-sm text-[#6A0572]">
              <span className="font-semibold">Key Benefit:</span> {testimonial.highlight}
            </p>
          </div>

          {/* Expand/Collapse indicator */}
          <div className="text-sm text-[#78611D] flex items-center gap-1">
            Read Full Story
            <span className="transition-transform group-open:rotate-180">▼</span>
          </div>
        </summary>

        {/* Full review - shown when expanded */}
        <div className="px-6 pb-6 border-t border-[#F0E8DE] pt-4">
          <p className="text-[#4A453F] italic leading-relaxed">
            &quot;{testimonial.fullReview}&quot;
          </p>
        </div>
      </details>
    </div>
  );
}
