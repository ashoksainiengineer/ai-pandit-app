'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EnhancedDateTimeInputProps {
  value: string;
  onChange: (value: string) => void;
  dateType: 'exact' | 'month' | 'year' | 'approximate' | 'range';
  onDateTypeChange: (type: 'exact' | 'month' | 'year' | 'approximate' | 'range') => void;
  includeTime?: boolean;
  onTimeChange?: (time: string) => void;
  timeValue?: string;
}

export default function EnhancedDateTimeInput({
  value,
  onChange,
  dateType,
  onDateTypeChange,
  includeTime = false,
  onTimeChange,
  timeValue = ''
}: EnhancedDateTimeInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  
  // Date parts for dropdown format (matching birth details)
  const [dateParts, setDateParts] = useState({ day: '', month: '', year: '' });
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

  // Parse existing range value and initialize date parts
  useEffect(() => {
    if (dateType === 'range' && value.includes(' to ')) {
      const [start, end] = value.split(' to ');
      setRangeStart(start);
      setRangeEnd(end);
    }
    
    // Initialize date parts from value for exact dates
    if (value && dateType === 'exact') {
      const [year, month, day] = value.split('-');
      if (year && month && day) {
        const monthName = months[parseInt(month) - 1];
        setDateParts({
          day: day.padStart(2, '0'),
          month: monthName,
          year
        });
      }
    } else if (value && dateType === 'month') {
      const [year, month] = value.split('-');
      if (year && month) {
        const monthName = months[parseInt(month) - 1];
        setDateParts({
          day: '',
          month: monthName,
          year
        });
      }
    } else if (value && dateType === 'year') {
      setDateParts({
        day: '',
        month: '',
        year: value
      });
    } else if (value && dateType === 'approximate') {
      // For approximate dates, just pass the value through
      // No need to set date parts as it's free text
    }
  }, [dateType, value]);

  const handleDateTypeChange = (newType: 'exact' | 'month' | 'year' | 'approximate' | 'range') => {
    onDateTypeChange(newType);
    
    // Reset value and date parts when changing date type
    if (newType === 'range') {
      onChange('');
      setRangeStart('');
      setRangeEnd('');
    } else if (newType === 'approximate') {
      onChange('');
    } else {
      onChange('');
      setDateParts({ day: '', month: '', year: '' });
    }
  };

  const handleRangeChange = () => {
    if (rangeStart && rangeEnd) {
      onChange(`${rangeStart} to ${rangeEnd}`);
    }
  };

  const getInputPlaceholder = () => {
    switch (dateType) {
      case 'exact':
        return includeTime ? 'Select date and time...' : 'Select date...';
      case 'month':
        return 'Select month and year...';
      case 'year':
        return 'Select year...';
      case 'approximate':
        return 'e.g., Around 2015, Early 2020...';
      case 'range':
        return 'Select date range...';
      default:
        return 'Select date...';
    }
  };

  const getDateTypeLabel = () => {
    switch (dateType) {
      case 'exact': return 'Exact Date';
      case 'month': return 'Month & Year';
      case 'year': return 'Year Only';
      case 'approximate': return 'Approximate';
      case 'range': return 'Date Range';
      default: return 'Date';
    }
  };

  const handleDatePartsChange = (day: string, month: string, year: string) => {
    setDateParts({ day, month, year });
    
    if (dateType === 'exact' && day && month && year) {
      const monthIndex = months.findIndex(m => m === month) + 1;
      const dateStr = `${year}-${monthIndex.toString().padStart(2, '0')}-${day.padStart(2, '0')}`;
      onChange(dateStr);
    } else if (dateType === 'month' && month && year) {
      const monthIndex = months.findIndex(m => m === month) + 1;
      const dateStr = `${year}-${monthIndex.toString().padStart(2, '0')}`;
      onChange(dateStr);
    } else if (dateType === 'year' && year) {
      onChange(year);
    }
    // For 'approximate' and 'range' types, we handle them separately in their respective functions
  };

  const renderDateInput = () => {
    if (dateType === 'range') {
      return (
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-[#C4B8AD] mb-1">From Date</label>
              <input
                type="date"
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
                className="w-full h-10 px-3 bg-[#2E2724] border border-[#3A3330] rounded-lg text-[#F5F0EB] focus:border-[#E8A849] focus:outline-none text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-[#C4B8AD] mb-1">To Date</label>
              <input
                type="date"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
                className="w-full h-10 px-3 bg-[#2E2724] border border-[#3A3330] rounded-lg text-[#F5F0EB] focus:border-[#E8A849] focus:outline-none text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleRangeChange}
            disabled={!rangeStart || !rangeEnd}
            className="w-full py-2 bg-[#E8A849] text-[#1A1614] rounded-lg text-sm font-medium hover:bg-[#D4A84B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Set Date Range
          </button>
        </div>
      );
    }

    if (dateType === 'approximate') {
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={getInputPlaceholder()}
          className="w-full h-12 px-4 bg-[#2E2724] border border-[#3A3330] rounded-lg text-[#F5F0EB] placeholder-[#8C7F72] focus:border-[#E8A849] focus:outline-none"
        />
      );
    }

    if (dateType === 'year') {
      return (
        <select
          value={dateParts.year}
          onChange={(e) => handleDatePartsChange('', '', e.target.value)}
          className="w-full h-12 px-4 bg-[#2E2724] border border-[#3A3330] rounded-lg text-[#F5F0EB] focus:border-[#E8A849] focus:outline-none"
        >
          <option value="">Select year</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      );
    }

    if (dateType === 'month') {
      return (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <select
              value={dateParts.month}
              onChange={(e) => handleDatePartsChange('', e.target.value, dateParts.year)}
              className="w-full h-12 px-3 bg-[#2E2724] border border-[#3A3330] rounded-lg text-[#F5F0EB] focus:border-[#E8A849] focus:outline-none"
            >
              <option value="">Month</option>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <select
              value={dateParts.year}
              onChange={(e) => handleDatePartsChange('', dateParts.month, e.target.value)}
              className="w-full h-12 px-3 bg-[#2E2724] border border-[#3A3330] rounded-lg text-[#F5F0EB] focus:border-[#E8A849] focus:outline-none"
            >
              <option value="">Year</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      );
    }

    // Default exact date - now using dropdowns like birth details
    return (
      <div className="grid grid-cols-3 gap-3">
        <div>
          <select
            value={dateParts.day}
            onChange={(e) => handleDatePartsChange(e.target.value, dateParts.month, dateParts.year)}
            className="w-full h-12 px-3 bg-[#2E2724] border border-[#3A3330] rounded-lg text-[#F5F0EB] focus:border-[#E8A849] focus:outline-none"
          >
            <option value="">Day</option>
            {days.map(d => (
              <option key={d} value={d.toString().padStart(2, '0')}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={dateParts.month}
            onChange={(e) => handleDatePartsChange(dateParts.day, e.target.value, dateParts.year)}
            className="w-full h-12 px-3 bg-[#2E2724] border border-[#3A3330] rounded-lg text-[#F5F0EB] focus:border-[#E8A849] focus:outline-none"
          >
            <option value="">Month</option>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <select
            value={dateParts.year}
            onChange={(e) => handleDatePartsChange(dateParts.day, dateParts.month, e.target.value)}
            className="w-full h-12 px-3 bg-[#2E2724] border border-[#3A3330] rounded-lg text-[#F5F0EB] focus:border-[#E8A849] focus:outline-none"
          >
            <option value="">Year</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
    );
  };

  const renderTimeInput = () => {
    if (!includeTime || dateType !== 'exact') return null;

    return (
      <div className="mt-3">
        <label className="block text-sm font-semibold text-[#F5F0EB] mb-2">
          Time (Optional)
        </label>
        <div className="flex gap-3">
          <input
            type="time"
            value={timeValue}
            onChange={(e) => onTimeChange?.(e.target.value)}
            className="flex-1 h-10 px-3 bg-[#2E2724] border border-[#3A3330] rounded-lg text-[#F5F0EB] focus:border-[#E8A849] focus:outline-none"
          />
          <div className="flex items-center text-xs text-[#C4B8AD]">
            <Clock className="w-3 h-3 mr-1" />
            HH:MM
          </div>
        </div>
        <p className="text-xs text-[#8C7F72] mt-1">
          Add exact time if known for better accuracy
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Date Type Selector */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-[#F5F0EB]">
          Date Format
        </label>
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-[#2E2724] border border-[#3A3330] rounded-lg text-[#F5F0EB] hover:border-[#8C7F72] transition-colors text-sm"
          >
            <Calendar className="w-4 h-4" />
            {getDateTypeLabel()}
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-full mt-1 w-48 bg-[#2E2724] border border-[#3A3330] rounded-lg shadow-lg z-10"
              >
                {[
                  { value: 'exact', label: 'Exact Date', desc: 'Full date with optional time' },
                  { value: 'month', label: 'Month & Year', desc: 'Only month and year' },
                  { value: 'year', label: 'Year Only', desc: 'Just the year' },
                  { value: 'approximate', label: 'Approximate', desc: 'e.g., "Around 2015"' },
                  { value: 'range', label: 'Date Range', desc: 'From date to date' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      handleDateTypeChange(option.value as any);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-[#3A3330] transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      dateType === option.value ? 'bg-[#E8A849]/20 text-[#E8A849]' : 'text-[#C4B8AD]'
                    }`}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-[#8C7F72]">{option.desc}</div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Date Input */}
      {renderDateInput()}

      {/* Time Input */}
      {renderTimeInput()}

      {/* Current Value Display */}
      {value && dateType !== 'range' && (
        <div className="mt-2 p-2 bg-[#2E2724] rounded-lg">
          <div className="text-xs text-[#C4B8AD]">Selected:</div>
          <div className="text-sm text-[#F5F0EB]">
            {value}
            {includeTime && timeValue && dateType === 'exact' && (
              <span className="text-[#E8A849]"> at {timeValue}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}