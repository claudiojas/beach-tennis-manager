import { Palmtree } from 'lucide-react';

interface LogoProps {
  variant?: 'light' | 'dark';
  showSubtitle?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo = ({ variant = 'light', showSubtitle = true, size = 'md' }: LogoProps) => {
  const sizes = {
    sm: { icon: 24, title: 'text-lg', subtitle: 'text-xs' },
    md: { icon: 32, title: 'text-xl', subtitle: 'text-sm' },
    lg: { icon: 48, title: 'text-3xl', subtitle: 'text-base' },
  };

  const textColor = variant === 'light' ? 'text-primary-foreground' : 'text-foreground';

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
        <Palmtree className="text-accent-foreground" size={sizes[size].icon} />
      </div>
      <div>
        <h1 className={`font-bold ${sizes[size].title} ${textColor}`}>
          Beach Tennis Manager
        </h1>
        {showSubtitle && (
          <p className={`${sizes[size].subtitle} ${textColor} opacity-80`}>
            Cadastro e gestão de atletas
          </p>
        )}
      </div>
    </div>
  );
};
