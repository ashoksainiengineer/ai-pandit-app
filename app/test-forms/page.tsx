'use client';

import { useState } from 'react';
import BirthDataForm from '@/components/BirthDataForm';
import PhysicalTraitsForm from '@/components/PhysicalTraitsForm';
import LifeEventsForm from '@/components/LifeEventsForm';
import type { BirthData, PhysicalDescription, LifeEvent } from '@/types';

export default function TestForms() {
  const [birthData, setBirthData] = useState<Partial<BirthData>>({});
  const [physicalDesc, setPhysicalDesc] = useState<Partial<PhysicalDescription>>({});
  const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([]);
  const [activeForm, setActiveForm] = useState<'birth' | 'physical' | 'life'>('birth');

  return (
    <div className="min-h-screen bg-vedic-navy p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-8">Test BTR Forms</h1>
        
        {/* Form Selector */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveForm('birth')}
            className={`px-4 py-2 rounded-lg ${activeForm === 'birth' ? 'bg-accent-primary text-bg-base' : 'bg-bg-surface text-text-primary'}`}
          >
            Birth Data
          </button>
          <button
            onClick={() => setActiveForm('physical')}
            className={`px-4 py-2 rounded-lg ${activeForm === 'physical' ? 'bg-accent-primary text-bg-base' : 'bg-bg-surface text-text-primary'}`}
          >
            Physical Traits
          </button>
          <button
            onClick={() => setActiveForm('life')}
            className={`px-4 py-2 rounded-lg ${activeForm === 'life' ? 'bg-accent-primary text-bg-base' : 'bg-bg-surface text-text-primary'}`}
          >
            Life Events
          </button>
        </div>

        {/* Form Display */}
        <div className="bg-bg-surface border border-border-default rounded-xl p-6">
          {activeForm === 'birth' && (
            <BirthDataForm 
              birthData={birthData} 
              setBirthData={setBirthData} 
            />
          )}
          {activeForm === 'physical' && (
            <PhysicalTraitsForm 
              physicalDesc={physicalDesc} 
              setPhysicalDesc={setPhysicalDesc} 
            />
          )}
          {activeForm === 'life' && (
            <LifeEventsForm 
              lifeEvents={lifeEvents} 
              setLifeEvents={setLifeEvents} 
            />
          )}
        </div>

        {/* Debug Info */}
        <div className="mt-8 bg-bg-surface border border-border-default rounded-xl p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Debug Information</h2>
          <pre className="text-sm text-text-secondary overflow-auto">
            {JSON.stringify({ birthData, physicalDesc, lifeEvents: lifeEvents.length }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}