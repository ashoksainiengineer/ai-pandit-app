export function sanitizeHtml(input: string | undefined): string {
    if (!input) return '';

    return input
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
}

export function truncateText(text: string | undefined, maxLength: number): string {
    if (!text || text.length <= maxLength) return text || '';
    return text.slice(0, maxLength) + '...';
}
