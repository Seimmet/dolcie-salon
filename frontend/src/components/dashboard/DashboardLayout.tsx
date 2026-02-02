import { DashboardSidebar } from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";
import { User, authService } from "@/services/authService";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { useState } from "react";

interface DashboardLayoutProps {
  user: User;
  children: React.ReactNode;
}

export function DashboardLayout({ user, children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const getHeaderInfo = () => {
    const path = location.pathname;
    if (path.includes('/profile')) return { title: 'My Profile', subtitle: 'Manage your personal information' };
    if (path.includes('/bookings')) return { title: 'Bookings', subtitle: 'View and manage appointments' };
    if (path.includes('/stylists')) return { title: 'Stylists', subtitle: 'Manage salon staff' };
    if (path.includes('/services')) return { title: 'Services', subtitle: 'Manage salon services' };
    if (path.includes('/reports')) return { title: 'Reports', subtitle: 'View salon performance' };
    if (path.includes('/settings')) return { title: 'Settings', subtitle: 'System configuration' };
    if (path.includes('/customers')) return { title: 'Customers', subtitle: 'Manage customer database' };
    
    // Default based on role
    if (user.role === 'admin') return { title: 'Admin Dashboard', subtitle: 'Overview of salon operations' };
    if (user.role === 'stylist') return { title: 'Stylist Dashboard', subtitle: 'Your schedule and appointments' };
    return { title: 'Dashboard', subtitle: 'Welcome to Victoria Braids & Weaves' };
  };

  const header = getHeaderInfo();

  const handleLogout = () => {
    authService.logout();
    navigate("/thesalonadmin");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleProfileClick = () => {
    switch (user.role) {
      case "admin":
        navigate("/admin/profile");
        break;
      case "stylist":
        navigate("/stylist/profile");
        break;
      case "customer":
        navigate("/dashboard/profile");
        break;
      default:
        navigate("/dashboard/profile");
        break;
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <DashboardSidebar 
        user={user} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <main className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <DashboardHeader 
          title={header.title}
          subtitle={header.subtitle}
          onMenuClick={() => setIsSidebarOpen(true)}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10 border border-gold/20">
                  <AvatarImage src={user.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt={user.fullName} className="object-cover" />
                  <AvatarFallback className="bg-gold/10 text-gold-dark">{getInitials(user.fullName)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.fullName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfileClick}>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </DashboardHeader>

        <div className="flex-1 p-4 lg:p-8 pt-6 space-y-6 overflow-auto bg-muted/20">
          {children}
        </div>
      </main>
    </div>
  );
}
