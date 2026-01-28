/**
 * ActivityHeatmap Component
 * GitHub-style contribution graph showing user activity over time
 */

'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface HeatmapData {
  date: string;
  count: number;
  intensity: number; // 0-4
}

interface ActivityHeatmapProps {
  data: HeatmapData[];
  onDayClick?: (date: string, count: number) => void;
}

const intensityColors = [
  'bg-[#151a21]', // 0 - no activity
  'bg-[#D4AF37]/30', // 1 - low
  'bg-[#D4AF37]/50', // 2 - medium
  'bg-[#D4AF37]/70', // 3 - high
  'bg-[#D4AF37]', // 4 - very high
];

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function ActivityHeatmap({ data, onDayClick }: ActivityHeatmapProps) {
  // Organize data by weeks
  const weeks = useMemo(() => {
    const result: HeatmapData[][] = [];
    let currentWeek: HeatmapData[] = [];
    
    data.forEach((day, index) => {
      const dayOfWeek = new Date(day.date).getDay();
      
      // Pad first week if needed
      if (index === 0 && dayOfWeek !== 0) {
        for (let i = 0; i < dayOfWeek; i++) {
          currentWeek.push({ date: '', count: 0, intensity: 0 });
        }
      }
      
      currentWeek.push(day);
      
      if (dayOfWeek === 6 || index === data.length - 1) {
        result.push([...currentWeek]);
        currentWeek = [];
      }
    });
    
    return result;
  }, [data]);

  // Get month labels
  const monthLabels = useMemo(() => {
    const labels: { month: string; index: number }[] = [];
    let lastMonth = -1;
    
    weeks.forEach((week, weekIndex) => {
      const firstDay = week.find(d => d.date);
      if (firstDay) {
        const month = new Date(firstDay.date).getMonth();
        if (month !== lastMonth) {
          labels.push({ month: months[month], index: weekIndex });
          lastMonth = month;
        }
      }
    });
    
    return labels;
  }, [weeks]);

  const totalSessions = data.reduce((sum, d) => sum + d.count, 0);
  const activeDays = data.filter(d => d.count > 0).length;
  const maxDay = data.reduce((max, d) => d.count > max.count ? d : max, data[0] || { count: 0, date: '' });
  const streak = useMemo(() => {
    let currentStreak = 0;
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].count > 0) {
        currentStreak++;
      } else {
        break;
      }
    }
    return currentStreak;
  }, [data]);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-[#F5F0EB]">Activity Heatmap</h3>
          <p className="text-sm text-[#8C7F72]">
            {totalSessions} sessions in the last 90 days
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <div className="text-xl font-bold text-[#D4AF37]">{activeDays}</div>
            <div className="text-xs text-[#8C7F72]">Active Days</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-[#D4AF37]">{streak}</div>
            <div className="text-xs text-[#8C7F72]">Current Streak</div>
          </div>
          {maxDay.count > 0 && (
            <div className="text-center">
              <div className="text-xl font-bold text-[#D4AF37]">{maxDay.count}</div>
              <div className="text-xs text-[#8C7F72]">Best Day</div>
            </div>
          )}
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex mb-2">
            <div className="w-8" /> {/* Spacer for day labels */}
            <div className="flex relative">
              {monthLabels.map((label, i) => (
                <div
                  key={i}
                  className="absolute text-xs text-[#8C7F72]"
                  style={{ left: `${label.index * 16}px` }}
                >
                  {label.month}
                </div>
              ))}
            </div>
          </div>

          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col gap-1 mr-2">
              {weekDays.map((day, i) => (
                <div key={day} className="h-3 text-[10px] text-[#8C7F72] leading-3">
                  {i % 2 === 0 ? day[0] : ''}
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day, dayIndex) => (
                    <motion.div
                      key={`${weekIndex}-${dayIndex}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: (weekIndex * 7 + dayIndex) * 0.002 }}
                      whileHover={{ scale: 1.2 }}
                      onClick={() => day.date && onDayClick?.(day.date, day.count)}
                      className={`
                        w-3 h-3 rounded-sm cursor-pointer
                        ${day.date ? intensityColors[day.intensity] : 'bg-transparent'}
                        ${day.date ? 'hover:ring-2 hover:ring-[#D4AF37]/50' : ''}
                        transition-all duration-200
                      `}
                      title={day.date ? `${day.date}: ${day.count} sessions` : ''}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 justify-end">
            <span className="text-xs text-[#8C7F72]">Less</span>
            {intensityColors.map((color, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-sm ${color}`}
              />
            ))}
            <span className="text-xs text-[#8C7F72]">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
