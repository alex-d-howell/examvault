import React, { useMemo, useState, useCallback, useRef } from 'react';
import type Exam from 'Frontend/generated/com/howell/examvault/base/domain/Exam';

interface VirtualExamListProps {
  exams: Exam[];
  itemHeight: number;
  containerHeight?: number;
  renderItem: (props: { exam: Exam; index: number; style: React.CSSProperties }) => React.ReactNode;
  className?: string;
}

export const VirtualExamList: React.FC<VirtualExamListProps> = ({
  exams,
  itemHeight,
  containerHeight = 800,
  renderItem,
  className = ''
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      exams.length - 1
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, exams.length]);

  // Get visible items
  const visibleItems = useMemo(() => {
    const items = [];
    for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
      if (exams[i]) {
        items.push({
          index: i,
          exam: exams[i],
          style: {
            position: 'absolute' as const,
            top: i * itemHeight,
            left: 0,
            right: 0,
            height: itemHeight,
          }
        });
      }
    }
    return items;
  }, [exams, visibleRange, itemHeight]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = exams.length * itemHeight;

  return (
    <div
      ref={scrollElementRef}
      className={`virtual-exam-list ${className}`}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
      }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ exam, index, style }) => (
          <div key={exam.id} style={style}>
            {renderItem({ exam, index, style })}
          </div>
        ))}
      </div>
    </div>
  );
};