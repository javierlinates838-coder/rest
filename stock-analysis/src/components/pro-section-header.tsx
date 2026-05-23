import type { ReactNode } from "react";

interface ProSectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function ProSectionHeader({ title, subtitle, badge, icon, action }: ProSectionHeaderProps) {
  return (
    <div className="pro-section-header mb-5">
      <div className="pro-section-accent" aria-hidden />
      <div className="flex flex-wrap items-end justify-between gap-3 relative z-[1]">
        <div className="flex items-start gap-3 min-w-0">
          {icon && (
            <div className="pro-section-icon shrink-0">{icon}</div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="pro-section-title">{title}</h2>
              {badge && <span className="pro-badge">{badge}</span>}
            </div>
            {subtitle && <p className="pro-section-subtitle">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
