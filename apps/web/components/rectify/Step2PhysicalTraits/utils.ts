export const getSignColor = (signs: string) => {
    if (signs.includes('Mars') || signs.includes('Sun')) return 'text-red-600';
    if (signs.includes('Venus') || signs.includes('Moon')) return 'text-emerald-600';
    if (signs.includes('Saturn')) return 'text-blue-600';
    return 'text-[#6B9AC4]';
};
