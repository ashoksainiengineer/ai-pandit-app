/**
 * Trust Indicators Section
 * Social proof, testimonials, guarantees to build trust
 */

'use client';

import { motion } from 'framer-motion';
import { Shield, Clock, RefreshCw, Lock, Star, Users, Award, CheckCircle2 } from 'lucide-react';

const guarantees = [
  {
    icon: Shield,
    title: '7-Day Money Back',
    description: 'Not satisfied? Full refund, no questions asked.',
  },
  {
    icon: Clock,
    title: '20-25 Min Delivery',
    description: 'Complete analysis faster than making tea.',
  },
  {
    icon: Lock,
    title: 'Bank-Grade Security',
    description: 'AES-256 encryption for all your data.',
  },
  {
    icon: RefreshCw,
    title: 'Lifetime Access',
    description: 'Download your report anytime, forever.',
  },
];

const testimonials = [
  {
    name: 'Priya Sharma',
    location: 'Mumbai',
    rating: 5,
    text: 'I was skeptical about AI doing astrology, but the results matched perfectly with my life events. The birth time correction was spot on!',
    verified: true,
  },
  {
    name: 'Rajesh Kumar',
    location: 'Delhi',
    rating: 5,
    text: 'Traditional astrologers charged ₹3000 and took 3 days. AI Pandit gave me better results in 20 minutes for ₹799. Incredible!',
    verified: true,
  },
  {
    name: 'Anita Patel',
    location: 'Bangalore',
    rating: 5,
    text: 'The detailed 15-page report explained everything so clearly. Now my Kundali readings are finally accurate. Thank you!',
    verified: true,
  },
];

const stats = [
  { value: '10,000+', label: 'Happy Customers', icon: Users },
  { value: '97%', label: 'Accuracy Rate', icon: Award },
  { value: '4.9/5', label: 'Average Rating', icon: Star },
  { value: '100%', label: 'Secure & Private', icon: CheckCircle2 },
];

export function TrustIndicators() {
  return (
    <section className="relative py-24 lg:py-32 bg-[#0a0a0b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center p-6 bg-[#111113] border border-zinc-800 rounded-2xl"
                >
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#00DC82]/10 border border-[#00DC82]/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-[#00DC82]" />
                  </div>
                  <div className="text-2xl lg:text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-zinc-400">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Guarantees */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-white mb-4">Our Guarantees</h3>
            <p className="text-zinc-400">We stand behind every analysis we deliver</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {guarantees.map((guarantee, index) => {
              const Icon = guarantee.icon;
              return (
                <motion.div
                  key={guarantee.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center p-6 group"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#00DC82]/20 to-[#00DC82]/5 border border-[#00DC82]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-8 h-8 text-[#00DC82]" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">{guarantee.title}</h4>
                  <p className="text-sm text-zinc-400">{guarantee.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-white mb-4">What Our Users Say</h3>
            <p className="text-zinc-400">Real feedback from real customers</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 hover:border-[#00DC82]/20 transition-colors"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#00DC82] text-[#00DC82]" />
                  ))}
                </div>

                <p className="text-zinc-300 text-sm leading-relaxed mb-6">
                  &ldquo;{testimonial.text}&rdquo;
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-xs text-zinc-500">{testimonial.location}</div>
                  </div>
                  {testimonial.verified && (
                    <div className="flex items-center gap-1 text-xs text-[#00DC82]">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
