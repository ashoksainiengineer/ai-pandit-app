import { FORENSIC_ONLY_METADATA as QUIZ_METADATA } from '@/lib/forensic-quiz/questions';

export function GlobalCategoryBubbles({
    getCategoryProgress
}: {
    getCategoryProgress: (categoryId: string) => { total: number; answered: number };
}) {
    return (
        <div className="mt-4 flex justify-center gap-2">
            {QUIZ_METADATA.categories.map((cat: { id: string; name: string }) => {
                const catProg = getCategoryProgress(cat.id);
                const isComplete = catProg.answered === catProg.total && catProg.total > 0;
                const hasStarted = catProg.answered > 0;

                return (
                    <div
                        key={cat.id}
                        className={`w-2 h-2 rounded-full transition-colors ${isComplete
                            ? 'bg-[#184131]'
                            : hasStarted
                                ? 'bg-[#000000]'
                                : 'bg-[#E8E0D5]'
                            }`}
                        title={cat.name}
                    />
                );
            })}
        </div>
    );
}
