/**
 * ReadingsChart Component
 * Line chart showing readings over time
 */

'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import type { TimeSeriesData } from '@/app/types/dashboard';

interface ReadingsChartProps {
  data: TimeSeriesData[];
  loading?: boolean;
}

export default function ReadingsChart({ data, loading }: ReadingsChartProps) {
  if (loading) {
    return (
      <div className="h-64 rounded-xl bg-[#FDF8F3] animate-pulse" />
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-[#A8A39D]">
        No data available
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <ResponsiveContainer width="100%" height={256}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorReadings" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#B8860B" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#B8860B" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0E8DE" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          stroke="#A8A39D"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#A8A39D"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => value.toLocaleString()}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #F0E8DE',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
          labelStyle={{ color: '#1A1612', fontWeight: 500 }}
          itemStyle={{ color: '#B8860B' }}
          formatter={(value: number) => [value.toLocaleString(), 'Readings']}
          labelFormatter={(label: string) => formatDate(label)}
        />
        <Area
          type="monotone"
          dataKey="readings"
          stroke="#B8860B"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorReadings)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
