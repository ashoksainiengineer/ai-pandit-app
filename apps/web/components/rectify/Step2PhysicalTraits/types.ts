import { PhysicalTraits } from '@/lib/types';

export interface Step2Props {
    physicalTraits: PhysicalTraits;
    updateTraits: (traits: Partial<PhysicalTraits>) => void;
}
