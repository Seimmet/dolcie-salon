import { Bell, Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  onMenuClick?: () => void;
}

const DashboardHeader = ({ title, subtitle, children, onMenuClick }: DashboardHeaderProps) => {
  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4 lg:p-6 sticky top-0 z-30">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {onMenuClick && (
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
              <Menu className="w-6 h-6" />
            </Button>
          )}
          <div>
            {title && <h1 className="text-xl md:text-2xl font-serif font-bold text-foreground">{title}</h1>}
            {subtitle && (
              <p className="text-muted-foreground text-sm hidden md:block">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-10 w-48 lg:w-64 bg-background"
            />
          </div>
          <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-muted transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-gold rounded-full" />
          </Button>
          {children}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
