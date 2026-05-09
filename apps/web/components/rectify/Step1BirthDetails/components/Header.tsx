import { motion } from 'framer-motion';

export function Header() {
    return (
        <>
            {/* Header - Centered */}
            <div className="text-center my-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#ffffff] to-white border border-[rgba(0,0,0,0.08)] rounded-full text-xs mb-6 shadow-sm"
                >
                    <span className="text-black font-medium tracking-wider">STEP 1 OF 3</span>
                </motion.div>
                <motion.h1
                    className="text-3xl sm:text-4xl font-medium text-black leading-tight mb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    Birth <span className="text-black">Details</span>
                </motion.h1>
                <motion.p
                    className="text-sm text-black/60"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    Provide your birth information for accurate time rectification
                </motion.p>
            </div>

            {/* Security Badge — below step indicator */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="flex items-center justify-center gap-2 text-xs text-[#184131] bg-[#184131]/5 py-2 px-4 rounded-full border border-[#184131]/10"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="font-medium">End-to-End Encrypted</span>
            </motion.div>
        </>
    );
}
