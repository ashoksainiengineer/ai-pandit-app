'use client';

// components/landing/Testimonials.tsx
// Testimonial section for landing page

import { useState } from 'react';
import TESTIMONIALS, { Testimonial, getAverageRating, getTotalTestimonials } from '@/lib/testimonials';

export default function TestimonialsSection() {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false);

    const displayedTestimonials = showAll ? TESTIMONIALS : TESTIMONIALS.slice(0, 3);

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={i < rating ? 'text-[#D4AF37]' : 'text-[#2A3442]'}>
                ★
            </span>
        ));
    };

    return (
        <section id="testimonials" className="py-24 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#6A0572]/5 to-transparent" />

            <div className="max-w-7xl mx-auto px-6 relative">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <span className="inline-block px-4 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full text-[#D4AF37] text-sm font-medium mb-6">
                        ⭐ {getAverageRating()}/5 Average Rating from {getTotalTestimonials()} Users
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold text-[#F5F0EB] mb-4">
                        Real Results from Real Users
                    </h2>
                    <p className="text-[#C4B8AD] text-lg max-w-2xl mx-auto">
                        See how accurate birth time rectification transformed their astrological predictions
                    </p>
                </div>

                {/* Testimonial Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {displayedTestimonials.map((testimonial) => (
                        <TestimonialCard
                            key={testimonial.id}
                            testimonial={testimonial}
                            isExpanded={expandedId === testimonial.id}
                            onToggle={() => setExpandedId(expandedId === testimonial.id ? null : testimonial.id)}
                            renderStars={renderStars}
                        />
                    ))}
                </div>

                {/* Show More Button */}
                {!showAll && TESTIMONIALS.length > 3 && (
                    <div className="text-center">
                        <button
                            onClick={() => setShowAll(true)}
                            className="px-8 py-3 border-2 border-[#D4AF37]/50 text-[#D4AF37] rounded-xl font-semibold hover:bg-[#D4AF37]/10 transition-all"
                        >
                            View All {TESTIMONIALS.length} Reviews →
                        </button>
                    </div>
                )}

                {showAll && (
                    <div className="text-center">
                        <button
                            onClick={() => setShowAll(false)}
                            className="px-8 py-3 text-[#8C7F72] hover:text-[#D4AF37] transition-colors"
                        >
                            Show Less
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}

interface TestimonialCardProps {
    testimonial: Testimonial;
    isExpanded: boolean;
    onToggle: () => void;
    renderStars: (rating: number) => JSX.Element[];
}

function TestimonialCard({ testimonial, isExpanded, onToggle, renderStars }: TestimonialCardProps) {
    return (
        <div className={`glass-card p-6 transition-all duration-300 ${isExpanded ? 'md:col-span-2 lg:col-span-3' : ''}`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    {/* Avatar with initials */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37]/30 to-[#6A0572]/30 flex items-center justify-center">
                        <span className="text-[#D4AF37] font-bold text-lg">
                            {testimonial.name.split(' ').map(n => n[0]).join('')}
                        </span>
                    </div>
                    <div>
                        <h4 className="font-semibold text-[#F5F0EB]">{testimonial.name}</h4>
                        <p className="text-xs text-[#8C7F72]">{testimonial.profession}</p>
                        <p className="text-xs text-[#8C7F72]">{testimonial.location}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm">{renderStars(testimonial.rating)}</div>
                    {testimonial.verified && (
                        <span className="text-xs text-[#2D7A5C] flex items-center gap-1 justify-end mt-1">
                            <span>✓</span> Verified
                        </span>
                    )}
                </div>
            </div>

            {/* Quote */}
            <div className="mb-4">
                <p className="text-[#C4B8AD] italic leading-relaxed">
                    &quot;{isExpanded ? testimonial.fullReview : testimonial.shortQuote}&quot;
                </p>
            </div>

            {/* Result Badge */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="px-3 py-1.5 bg-[#2A3442] rounded-lg">
                    <span className="text-xs text-[#8C7F72] block">Original</span>
                    <span className="text-sm font-mono text-[#EF4444] line-through">{testimonial.result.originalTime}</span>
                </div>
                <span className="text-[#D4AF37]">→</span>
                <div className="px-3 py-1.5 bg-[#2D7A5C]/20 rounded-lg border border-[#2D7A5C]/30">
                    <span className="text-xs text-[#2D7A5C] block">Rectified</span>
                    <span className="text-sm font-mono text-[#2D7A5C] font-bold">{testimonial.result.rectifiedTime}</span>
                </div>
                <div className="px-3 py-1.5 bg-[#D4AF37]/10 rounded-lg">
                    <span className="text-xs text-[#D4AF37] block">Accuracy</span>
                    <span className="text-sm font-mono text-[#D4AF37] font-bold">{testimonial.result.accuracyAchieved}%</span>
                </div>
            </div>

            {/* Highlight */}
            <div className="p-3 bg-[#6A0572]/10 rounded-lg border border-[#6A0572]/20 mb-4">
                <p className="text-sm text-[#E879F9]">
                    <span className="font-semibold">Key Benefit:</span> {testimonial.highlight}
                </p>
            </div>

            {/* Expand/Collapse Button */}
            <button
                onClick={onToggle}
                className="text-sm text-[#D4AF37] hover:text-[#E8C54D] transition-colors flex items-center gap-1"
            >
                {isExpanded ? 'Show Less' : 'Read Full Story'}
                <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
            </button>
        </div>
    );
}
