import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Composable table primitives: Table wraps an overflow container so wide
 * tables scroll horizontally on small screens.
 */

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-x-auto rounded-xl border border-line bg-panel shadow-sm">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  )
);
Table.displayName = "Table";

const THead = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("border-b border-line bg-rail", className)} {...props} />
  )
);
THead.displayName = "THead";

const THeadCell = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-10 px-4 text-start align-middle text-[11px] font-semibold uppercase tracking-wider text-ink-soft",
        className
      )}
      {...props}
    />
  )
);
THeadCell.displayName = "THeadCell";

const TBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  )
);
TBody.displayName = "TBody";

const TR = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn("border-b border-line transition-colors hover:bg-rail/50", className)}
      {...props}
    />
  )
);
TR.displayName = "TR";

const TD = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("px-4 py-3 align-middle text-ink", className)} {...props} />
  )
);
TD.displayName = "TD";

/** Full-width empty row shown when a table has no data. */
function TableEmpty({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-ink-soft">
        {message}
      </td>
    </tr>
  );
}

export { Table, THead, THeadCell, TBody, TR, TD, TableEmpty };
