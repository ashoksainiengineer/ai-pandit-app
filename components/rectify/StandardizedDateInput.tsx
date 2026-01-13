'use client';

import { useState, useEffect } from 'react';

interface StandardizedDateInputProps {
  value: string;
  onChange: (value: string) => void;
  dateType: 'exact' | 'month' | 'year' | 'approximate' | 'range' | 'month-range' | 'year-range';
  onDateTypeChange: (type: 'exact' | 'month' | 'year' | 'approximate' | 'range' | 'month-range' | 'year-range') => void;
  minYear?: number;
  maxYear?: number;
}

export default function StandardizedDateInput({ 
  value, 
  onChange, 
  dateType, 
  onDateTypeChange,
  minYear = 1900,
  maxYear = new Date().getFullYear()
}: StandardizedDateInputProps) {
  const [dateParts, setDateParts] = useState({ day: '', month: '', year: '' });
  const [rangeParts, setRangeParts] = useState({ startDay: '', startMonth: '', startYear: '', endDay: '', endMonth: '', endYear: '' });
  const [monthRangeParts, setMonthRangeParts] = useState({ startMonth: '', startYear: '', endMonth: '', endYear: '' });
  const [yearRangeParts, setYearRangeParts] = useState({ startYear: '', endYear: '' });
  
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);
  
  // Initialize from value
  useEffect(() => {
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
    } else if (value && dateType === 'range' && value.includes(' to ')) {
      const [start, end] = value.split(' to ');
      const [startYear, startMonth, startDay] = start.split('-');
      const [endYear, endMonth, endDay] = end.split('-');
      
      if (startYear && startMonth && startDay && endYear && endMonth && endDay) {
        setRangeParts({
          startDay: startDay.padStart(2, '0'),
          startMonth: months[parseInt(startMonth) - 1],
          startYear,
          endDay: endDay.padStart(2, '0'),
          endMonth: months[parseInt(endMonth) - 1],
          endYear
        });
      }
    } else if (value && dateType === 'month-range' && value.includes(' to ')) {
      const [start, end] = value.split(' to ');
      const [startYear, startMonth] = start.split('-');
      const [endYear, endMonth] = end.split('-');
      
      if (startYear && startMonth && endYear && endMonth) {
        setMonthRangeParts({
          startMonth: months[parseInt(startMonth) - 1],
          startYear,
          endMonth: months[parseInt(endMonth) - 1],
          endYear
        });
      }
    } else if (value && dateType === 'year-range' && value.includes(' to ')) {
      const [startYear, endYear] = value.split(' to ');
      if (startYear && endYear) {
        setYearRangeParts({
          startYear,
          endYear
        });
      }
    }
  }, [value, dateType]);
  
  const handleDateChange = (day: string, month: string, year: string) => {
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
    // For 'approximate' type, we handle it separately in the input onChange
  };

  const handleRangeChange = (startDay: string, startMonth: string, startYear: string, endDay: string, endMonth: string, endYear: string) => {
    setRangeParts({ startDay, startMonth, startYear, endDay, endMonth, endYear });
    
    if (startDay && startMonth && startYear && endDay && endMonth && endYear) {
      const startMonthIndex = months.findIndex(m => m === startMonth) + 1;
      const endMonthIndex = months.findIndex(m => m === endMonth) + 1;
      const startDateStr = `${startYear}-${startMonthIndex.toString().padStart(2, '0')}-${startDay.padStart(2, '0')}`;
      const endDateStr = `${endYear}-${endMonthIndex.toString().padStart(2, '0')}-${endDay.padStart(2, '0')}`;
      onChange(`${startDateStr} to ${endDateStr}`);
    }
  };

  const handleMonthRangeChange = (startMonth: string, startYear: string, endMonth: string, endYear: string) => {
    setMonthRangeParts({ startMonth, startYear, endMonth, endYear });
    
    if (startMonth && startYear && endMonth && endYear) {
      const startMonthIndex = months.findIndex(m => m === startMonth) + 1;
      const endMonthIndex = months.findIndex(m => m === endMonth) + 1;
      const startDateStr = `${startYear}-${startMonthIndex.toString().padStart(2, '0')}`;
      const endDateStr = `${endYear}-${endMonthIndex.toString().padStart(2, '0')}`;
      onChange(`${startDateStr} to ${endDateStr}`);
    }
  };

  const handleYearRangeChange = (startYear: string, endYear: string) => {
    setYearRangeParts({ startYear, endYear });
    
    if (startYear && endYear) {
      onChange(`${startYear} to ${endYear}`);
    }
  };
  
  return (
    <div className="space-y-3">
      {/* Date Type Selector */}
      <div className="flex gap-2">
        {[
          { value: 'exact', label: 'Exact Date' },
          { value: 'month', label: 'Month & Year' },
          { value: 'year', label: 'Year Only' },
          { value: 'approximate', label: 'Approximate' },
          { value: 'range', label: 'Date Range' },
          { value: 'month-range', label: 'Month-Year Range' },
          { value: 'year-range', label: 'Year Range' }
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => onDateTypeChange(option.value as any)}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              dateType === option.value
                ? 'bg-amber-500 text-black'
                : 'bg-white/10 text-white border border-white/20 hover:border-white/40'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      
      {/* Exact Date - Day/Month/Year Dropdowns (Matching Birth Details Format) */}
      {dateType === 'exact' && (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <select
              value={dateParts.day}
              onChange={(e) => handleDateChange(e.target.value, dateParts.month, dateParts.year)}
              className="w-full h-12 px-3 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] focus:border-[#F5A623] focus:outline-none"
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
              onChange={(e) => handleDateChange(dateParts.day, e.target.value, dateParts.year)}
              className="w-full h-12 px-3 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] focus:border-[#F5A623] focus:outline-none"
            >
              <option value="">Month</option>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <select
              value={dateParts.year}
              onChange={(e) => handleDateChange(dateParts.day, dateParts.month, e.target.value)}
              className="w-full h-12 px-3 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] focus:border-[#F5A623] focus:outline-none"
            >
              <option value="">Year</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      )}
      
      {/* Month & Year - Month/Year Dropdowns (Matching Birth Details Format) */}
      {dateType === 'month' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <select
              value={dateParts.month}
              onChange={(e) => handleDateChange('', e.target.value, dateParts.year)}
              className="w-full h-12 px-3 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] focus:border-[#F5A623] focus:outline-none"
            >
              <option value="">Month</option>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <select
              value={dateParts.year}
              onChange={(e) => handleDateChange('', dateParts.month, e.target.value)}
              className="w-full h-12 px-3 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] focus:border-[#F5A623] focus:outline-none"
            >
              <option value="">Year</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      )}
      
      {/* Year Only - Year Dropdown (Matching Birth Details Format) */}
      {dateType === 'year' && (
        <select
          value={dateParts.year}
          onChange={(e) => handleDateChange('', '', e.target.value)}
          className="w-full h-12 px-4 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] focus:border-[#F5A623] focus:outline-none"
        >
          <option value="">Select year</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      )}
      
      {/* Approximate - Text Input (Matching Birth Details Format) */}
      {dateType === 'approximate' && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g., 'around 2015', 'early 2020s', 'summer 2018'"
          className="w-full h-12 px-4 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] placeholder-[#6B7A90] focus:border-[#F5A623] focus:outline-none"
        />
      )}
      
      {/* Date Range - Start and End Date Dropdowns */}
      {dateType === 'range' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#F7F9FC] mb-2">Start Date</label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <select
                  value={rangeParts.startDay}
                  onChange={(e) => handleRangeChange(e.target.value, rangeParts.startMonth, rangeParts.startYear, rangeParts.endDay, rangeParts.endMonth, rangeParts.endYear)}
                  className="w-full h-12 px-3 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] focus:border-[#F5A623] focus:outline-none"
                >
                  <option value="">Day</option>
                  {days.map(d => (
                    <option key={d} value={d.toString().padStart(2, '0')}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={rangeParts.startMonth}
                  onChange={(e) => handleRangeChange(rangeParts.startDay, e.target.value, rangeParts.startYear, rangeParts.endDay, rangeParts.endMonth, rangeParts.endYear)}
                  className="w-full h-12 px-3 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] focus:border-[#F5A623] focus:outline-none"
                >
                  <option value="">Month</option>
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <select
                  value={rangeParts.startYear}
                  onChange={(e) => handleRangeChange(rangeParts.startDay, rangeParts.startMonth, e.target.value, rangeParts.endDay, rangeParts.endMonth, rangeParts.endYear)}
                  className="w-full h-12 px-3 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] focus:border-[#F5A623] focus:outline-none"
                >
                  <option value="">Year</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#F7F9FC] mb-2">End Date</label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <select
                  value={rangeParts.endDay}
                  onChange={(e) => handleRangeChange(rangeParts.startDay, rangeParts.startMonth, rangeParts.startYear, e.target.value, rangeParts.endMonth, rangeParts.endYear)}
                  className="w-full h-12 px-3 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] focus:border-[#F5A623] focus:outline-none"
                >
                  <option value="">Day</option>
                  {days.map(d => (
                    <option key={d} value={d.toString().padStart(2, '0')}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={rangeParts.endMonth}
                  onChange={(e) => handleRangeChange(rangeParts.startDay, rangeParts.startMonth, rangeParts.startYear, rangeParts.endDay, e.target.value, rangeParts.endYear)}
                  className="w-full h-12 px-3 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] focus:border-[#F5A623] focus:outline-none"
                >
                  <option value="">Month</option>
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <select
                  value={rangeParts.endYear}
                  onChange={(e) => handleRangeChange(rangeParts.startDay, rangeParts.startMonth, rangeParts.startYear, rangeParts.endDay, rangeParts.endMonth, e.target.value)}
                  className="w-full h-12 px-3 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] focus:border-[#F5A623] focus:outline-none"
                >
                  <option value="">Year</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Month-Year Range - Start and End Month/Year Dropdowns */}
      {dateType === 'month-range' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#F7F9FC] mb-2">Start Month & Year</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <select
                  value={monthRangeParts.startMonth}
                  onChange={(e) => handleMonthRangeChange(e.target.value, monthRangeParts.startYear, monthRangeParts.endMonth, monthRangeParts.endYear)}
                  className="w-full h-12 px-3 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] focus:border-[#F5A623] focus:outline-none"
                >
                  <option value="">Month</option>
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <select
                  value={monthRangeParts.startYear}
                  onChange={(e) => handleMonthRangeChange(monthRangeParts.startMonth, e.target.value, monthRangeParts.endMonth, monthRangeParts.endYear)}
                  className="w-full h-12 px-3 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] focus:border-[#F5A623] focus:outline-none"
                >
                  <option value="">Year</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#F7F9FC] mb-2">End Month & Year</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <select
                  value={monthRangeParts.endMonth}
                  onChange={(e) => handleMonthRangeChange(monthRangeParts.startMonth, monthRangeParts.startYear, e.target.value, monthRangeParts.endYear)}
                  className="w-full h-12 px-3 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] focus:border-[#F5A623] focus:outline-none"
                >
                  <option value="">Month</option>
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <select
                  value={monthRangeParts.endYear}
                  onChange={(e) => handleMonthRangeChange(monthRangeParts.startMonth, monthRangeParts.startYear, monthRangeParts.endMonth, e.target.value)}
                  className="w-full h-12 px-3 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] focus:border-[#F5A623] focus:outline-none"
                >
                  <option value="">Year</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Year Range - Start and End Year Dropdowns */}
      {dateType === 'year-range' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#F7F9FC] mb-2">Start Year</label>
            <select
              value={yearRangeParts.startYear}
              onChange={(e) => handleYearRangeChange(e.target.value, yearRangeParts.endYear)}
              className="w-full h-12 px-4 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] focus:border-[#F5A623] focus:outline-none"
            >
              <option value="">Select start year</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#F7F9FC] mb-2">End Year</label>
            <select
              value={yearRangeParts.endYear}
              onChange={(e) => handleYearRangeChange(yearRangeParts.startYear, e.target.value)}
              className="w-full h-12 px-4 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] focus:border-[#F5A623] focus:outline-none"
            >
              <option value="">Select end year</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}