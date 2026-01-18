export interface Testimonial {
    id: string;
    name: string;
    location: string;
    profession: string;
    rating: number;
    shortQuote: string;
    fullReview: string;
    result: {
        originalTime: string;
        rectifiedTime: string;
        accuracyAchieved: number;
    };
    highlight: string;
    verified: boolean;
    dateAdded: string;
}
export declare const TESTIMONIALS: Testimonial[];
export declare function getTestimonialsByRating(minRating?: number): Testimonial[];
export declare function getRandomTestimonials(count?: number): Testimonial[];
export declare function getAverageRating(): number;
export declare function getTotalTestimonials(): number;
export default TESTIMONIALS;
//# sourceMappingURL=testimonials.d.ts.map