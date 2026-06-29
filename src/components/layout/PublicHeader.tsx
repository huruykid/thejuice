import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from '@/components/ui/sheet';
import BrandLockup from '@/components/BrandLockup';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/blog', label: 'Blog' },
  { to: '/how-it-works', label: 'How It Works' },
];

export const PublicHeader = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" aria-label="Juice home">
          <BrandLockup variant="inline" size="sm" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-foreground/70 hover:text-foreground hover:bg-muted'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <Button asChild variant="ghost" size="sm" className="ml-2">
            <Link to="/app?mode=login">Log in</Link>
          </Button>
          <Button asChild size="sm" className="ml-1">
            <Link to="/app">Join free</Link>
          </Button>
        </nav>

        {/* Mobile trigger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <VisuallyHidden>
              <SheetTitle>Menu</SheetTitle>
            </VisuallyHidden>
            <nav className="mt-8 flex flex-col gap-1" aria-label="Mobile primary">
              {links.map((l) => (
                <SheetClose asChild key={l.to}>
                  <NavLink
                    to={l.to}
                    end={l.end}
                    className={({ isActive }) =>
                      `px-3 py-3 text-base font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground/80 hover:bg-muted'
                      }`
                    }
                  >
                    {l.label}
                  </NavLink>
                </SheetClose>
              ))}
              <SheetClose asChild>
                <Button asChild variant="outline" className="mt-4">
                  <Link to="/app?mode=login">Log in</Link>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button asChild className="mt-1">
                  <Link to="/app">Join free</Link>
                </Button>
              </SheetClose>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default PublicHeader;