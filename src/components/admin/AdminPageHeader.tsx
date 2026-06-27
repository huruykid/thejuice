import type { ReactNode } from "react";

/**
 * Shared admin page header: title + optional subtitle, with an optional right-aligned
 * slot for filters/actions. Use this on every admin page so headers can't drift.
 */
export const AdminPageHeader = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) => (
  <div className="flex items-center justify-between gap-3 flex-wrap">
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
      {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);

export default AdminPageHeader;
