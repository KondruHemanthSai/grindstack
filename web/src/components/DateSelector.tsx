import React, { useRef, useEffect, useMemo } from 'react';

interface DateSelectorProps {
  selectedDate: string;
  onDateSelect: (dateString: string) => void;
  numDays?: number;
}

interface DateChip {
  dateString: string;
  dayAbbr: string;
  dateNum: number;
  isToday: boolean;
}

const DAY_ABBRS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const formatDateString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  onDateSelect,
  numDays = 30,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const chips: DateChip[] = useMemo(() => {
    const result: DateChip[] = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      result.push({
        dateString: formatDateString(date),
        dayAbbr: DAY_ABBRS[date.getDay()],
        dateNum: date.getDate(),
        isToday: i === 0,
      });
    }
    return result;
  }, [today, numDays]);

  useEffect(() => {
    if (selectedRef.current && containerRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [selectedDate]);

  return (
    <div className="date-selector" ref={containerRef}>
      {chips.map((chip) => {
        const isSelected = chip.dateString === selectedDate;
        return (
          <button
            key={chip.dateString}
            ref={isSelected ? selectedRef : undefined}
            className={`date-chip ${isSelected ? 'selected' : ''} ${chip.isToday ? 'today' : ''}`}
            onClick={() => onDateSelect(chip.dateString)}
          >
            <span className="date-chip-day">{chip.dayAbbr}</span>
            <span className="date-chip-num">{chip.dateNum}</span>
          </button>
        );
      })}
    </div>
  );
};
