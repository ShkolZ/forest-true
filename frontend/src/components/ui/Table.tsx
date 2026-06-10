import { Fragment, type ReactNode } from "react";
import type { Column, TableRow } from "../../types";

interface TableProps<T extends TableRow> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  // When a row's id matches `expandedRowId`, an extra full-width row is
  // rendered beneath it containing `renderExpanded(row)`.
  expandedRowId?: string | null;
  renderExpanded?: (row: T) => ReactNode;
}

export default function Table<T extends TableRow>({
  columns,
  data,
  loading,
  onRowClick,
  emptyMessage = "No data found",
  expandedRowId,
  renderExpanded,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left">
            {columns.map((col) => (
              <th
                key={col.key}
                style={col.width ? { width: col.width } : undefined}
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-slate-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => {
              const rowId = (row.id as string) || String(index);
              const isExpanded =
                expandedRowId != null && expandedRowId === row.id;
              return (
                <Fragment key={rowId}>
                  <tr
                    className={`border-b border-slate-100 last:border-0 ${
                      isExpanded ? "bg-slate-50" : ""
                    } ${onRowClick ? "cursor-pointer hover:bg-slate-50" : ""}`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-slate-700">
                        {col.render
                          ? col.render(row[col.key as keyof T], row)
                          : (row[col.key as keyof T] as ReactNode)}
                      </td>
                    ))}
                  </tr>
                  {isExpanded && renderExpanded && (
                    <tr className="border-b border-slate-100 last:border-0">
                      <td colSpan={columns.length} className="bg-slate-50 p-0">
                        {renderExpanded(row)}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
