import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ChevronRight } from 'lucide-react';

export interface Crumb {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: Crumb[];
}

export const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://sipjuice.app';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      item: c.to ? `${origin}${c.to}` : undefined,
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <ol className="flex items-center flex-wrap gap-1">
        {items.map((c, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1">
              {c.to && !isLast ? (
                <Link to={c.to} className="hover:text-foreground transition-colors">
                  {c.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-foreground font-medium' : ''}>{c.label}</span>
              )}
              {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;