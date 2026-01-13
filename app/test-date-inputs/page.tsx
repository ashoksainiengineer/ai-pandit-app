'use client';

import { useState } from 'react';
import StandardizedDateInput from '@/components/rectify/StandardizedDateInput';

export default function TestDateInputs() {
  const [selectedDateType, setSelectedDateType] = useState<'exact' | 'month' | 'year' | 'approximate' | 'range' | 'month-range' | 'year-range'>('exact');
  const [dateValue, setDateValue] = useState('');

  const testCases = [
    { type: 'exact' as const, label: 'Exact Date', example: '2023-12-25' },
    { type: 'month' as const, label: 'Month & Year', example: '2023-12' },
    { type: 'year' as const, label: 'Year Only', example: '2023' },
    { type: 'approximate' as const, label: 'Approximate', example: 'around 2023' },
    { type: 'range' as const, label: 'Date Range', example: '2023-01-15 to 2023-12-31' },
    { type: 'month-range' as const, label: 'Month-Year Range', example: '2023-01 to 2023-12' },
    { type: 'year-range' as const, label: 'Year Range', example: '2020 to 2023' }
  ];

  return (
    <div className="min-h-screen bg-[#0F1419] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#F7F9FC] mb-8 text-center">
          Enhanced Date Input Test
        </h1>
        
        <div className="bg-[#1A1F26] border border-[#2D3542] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-[#F7F9FC] mb-4">Test All Date Formats</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {testCases.map((testCase) => (
              <button
                key={testCase.type}
                onClick={() => {
                  setSelectedDateType(testCase.type);
                  setDateValue(testCase.example);
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedDateType === testCase.type
                    ? 'border-[#F5A623] bg-[#F5A623]/10'
                    : 'border-[#3D4654] bg-[#242B35] hover:border-[#8C7F72]'
                }`}
              >
                <div className="text-[#F7F9FC] font-medium">{testCase.label}</div>
                <div className="text-sm text-[#A8B3C5] mt-1">{testCase.example}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#1A1F26] border border-[#2D3542] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-[#F7F9FC] mb-4">Date Input Component</h2>
          
          <StandardizedDateInput
            value={dateValue}
            onChange={setDateValue}
            dateType={selectedDateType}
            onDateTypeChange={setSelectedDateType}
          />
        </div>

        <div className="bg-[#1A1F26] border border-[#2D3542] rounded-xl p-6">
          <h2 className="text-xl font-semibold text-[#F7F9FC] mb-4">Current Values</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[#A8B3C5]">Selected Type:</span>
              <span className="text-[#F7F9FC] font-mono">{selectedDateType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A8B3C5]">Date Value:</span>
              <span className="text-[#F7F9FC] font-mono">{dateValue || '(empty)'}</span>
            </div>
          </div>
          
          {dateValue && (
            <div className="mt-4 p-4 bg-[#242B35] rounded-lg">
              <div className="text-[#F5A623] font-medium mb-2">✓ Successfully formatted:</div>
              <div className="text-[#F7F9FC]">
                {selectedDateType === 'exact' && `Exact date: ${dateValue}`}
                {selectedDateType === 'month' && `Month & Year: ${dateValue}`}
                {selectedDateType === 'year' && `Year: ${dateValue}`}
                {selectedDateType === 'approximate' && `Approximate: ${dateValue}`}
                {selectedDateType === 'range' && `Date Range: ${dateValue}`}
                {selectedDateType === 'month-range' && `Month-Year Range: ${dateValue}`}
                {selectedDateType === 'year-range' && `Year Range: ${dateValue}`}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <a
            href="/rectify"
            className="inline-block px-6 py-3 bg-[#F5A623] text-[#0F1419] rounded-lg font-medium hover:bg-[#E09000] transition-colors"
          >
            Go to Rectification Form
          </a>
        </div>
      </div>
    </div>
  );
}