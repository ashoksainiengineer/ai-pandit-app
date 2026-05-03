'use client';

import React from 'react';
import Layout from '@/components/Layout';

export default function RectifyPageSkeleton() {
    return (
        <Layout hideFooter>
            <div className="pt-28 pb-16">
                <div className="flex justify-center items-center min-h-[400px]">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-[#B8860B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-[#7A756F]">Loading saved draft...</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
