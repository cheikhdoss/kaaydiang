import React from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { useScroll } from '@/components/ui/use-scroll';
import { Link } from 'react-router-dom';
import { GraduationCap } from '@/components/animated-icons';

export function Header() {
  const [open, setOpen] = React.useState(false);
  useScroll(10);

  const links = [
    { label: 'Accueil', href: '/' },
    { label: 'À propos', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ];

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 w-full z-50 bg-black/40 backdrop-blur-xl border-b border-white/5',
        {
          'bg-background/90': open,
        },
      )}
    >
      <nav className="flex h-14 w-full max-w-[1440px] mx-auto items-center justify-between px-8">
        <Link to="/" className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6" animate={false} />
          <span className="font-serif text-xl italic text-white tracking-tight">
            KayyDiang
          </span>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {links.map((link, i) => (
            <a
              key={i}
              className={buttonVariants({ variant: 'ghost' })}
              href={link.href}
            >
              {link.label}
            </a>
          ))}
          <Link to="/login">
            <Button variant="outline">Se connecter</Button>
          </Link>
          <Link to="/register">
            <Button className="bg-gradient-to-br from-[#3054ff] to-[#1943f2] hover:opacity-90">
              Commencer
            </Button>
          </Link>
        </div>

        <Button
          size="icon"
          variant="outline"
          onClick={() => setOpen(!open)}
          className="md:hidden"
        >
          <MenuToggleIcon open={open} className="size-5" duration={300} />
        </Button>
      </nav>

      <div
        className={cn(
          'bg-background/90 fixed top-14 right-0 bottom-0 left-0 z-50 flex flex-col overflow-hidden border-y md:hidden',
          open ? 'block' : 'hidden',
        )}
      >
        <div
          data-slot={open ? 'open' : 'closed'}
          className={cn(
            'data-[slot=open]:animate-in data-[slot=open]:zoom-in-95 data-[slot=closed]:animate-out data-[slot=closed]:zoom-out-95 ease-out',
            'flex h-full w-full flex-col justify-between gap-y-2 p-4',
          )}
        >
          <div className="grid gap-y-2">
            {links.map((link) => (
              <a
                key={link.label}
                className={buttonVariants({
                  variant: 'ghost',
                  className: 'justify-start',
                })}
                href={link.href}
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <Link to="/login" className="w-full">
              <Button variant="outline" className="w-full">
                Se connecter
              </Button>
            </Link>
            <Link to="/register" className="w-full">
              <Button className="w-full bg-gradient-to-br from-[#3054ff] to-[#1943f2]">
                Commencer
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
