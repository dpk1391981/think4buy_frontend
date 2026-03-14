/**
 * TableSkeleton — skeleton for data tables (admin dashboards).
 * Renders a header row + N body rows with configurable column count.
 */
import { cn } from '@/lib/utils';
import Shimmer from './Shimmer';

interface Props {
  rows?: number;
  cols?: number;
  className?: string;
  /** Show a top toolbar (search + button) placeholder */
  toolbar?: boolean;
}

export default function TableSkeleton({ rows = 8, cols = 6, className, toolbar = true }: Props) {
  return (
    <div aria-busy="true" className={cn('bg-white rounded-xl border border-gray-100 overflow-hidden', className)}>
      {toolbar && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <Shimmer className="h-8 w-48 rounded-lg" />
          <Shimmer className="h-8 w-28 rounded-lg" />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead>
            <tr className="border-b border-gray-100">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-4 py-3 text-left">
                  <Shimmer className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          {/* Body rows */}
          <tbody>
            {Array.from({ length: rows }).map((_, row) => (
              <tr key={row} className="border-b border-gray-50 last:border-0">
                {Array.from({ length: cols }).map((_, col) => (
                  <td key={col} className="px-4 py-3">
                    <Shimmer
                      className={cn(
                        'h-4',
                        col === 0 && 'w-28',
                        col === 1 && 'w-20',
                        col >= 2 && 'w-16',
                      )}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination bar */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <Shimmer className="h-3 w-32" />
        <div className="flex gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Shimmer key={i} className="h-7 w-7 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
