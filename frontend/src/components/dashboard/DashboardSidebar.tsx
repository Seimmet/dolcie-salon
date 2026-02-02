import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  Settings,
  FileText,
  BarChart3,
  Clock,
  User as UserIcon,
  Gift,
  MessageSquare,
  LogOut,
  X
} from "lucide-react";
import { User, authService } from "@/services/authService";
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardSidebar({ user, isOpen, onClose }: DashboardSidebarProps) {
  const { settings } = useSettings();
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [salonName, setSalonName] = useState<string>("Victoria Braids");
  
  useEffect(() => {
    if (settings) {
      setLogoUrl(settings.logoUrl);
      if (settings.salonName) {
        setSalonName(settings.salonName);
      }
    }
  }, [settings]);

  const customerModuleEnabled = settings?.customerModuleEnabled ?? true;

  const adminItems = [
    { title: "Overview", url: "/admin", icon: LayoutDashboard },
    { title: "Bookings", url: "/admin/bookings", icon: Calendar },
    { title: "Customers", url: "/admin/customers", icon: Users },
    { title: "Birthdays", url: "/admin/birthdays", icon: Gift },
    { title: "Notifications", url: "/admin/notifications", icon: MessageSquare },
    { title: "Stylists", url: "/admin/stylists", icon: Scissors },
    { title: "Variations", url: "/admin/categories", icon: Settings },
    { title: "Styles", url: "/admin/styles", icon: FileText },
    { title: "FAQs", url: "/admin/faqs", icon: MessageSquare },
    { title: "Reports", url: "/admin/reports", icon: BarChart3 },
    { title: "Profile", url: "/admin/profile", icon: UserIcon },
    { title: "Settings", url: "/admin/settings", icon: Settings },
  ];

  const stylistItems = [
    { title: "Overview", url: "/stylist", icon: LayoutDashboard },
    { title: "My Schedule", url: "/stylist/schedule", icon: Clock },
    { title: "My Appointments", url: "/stylist/appointments", icon: Calendar },
    { title: "Profile", url: "/stylist/profile", icon: UserIcon },
  ];

  const customerItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Book Appointment", url: "/booking", icon: Calendar },
    { title: "My Bookings", url: "/dashboard/bookings", icon: Clock },
    { title: "Profile", url: "/dashboard/profile", icon: UserIcon },
  ];

  let items = customerItems;
  if (user.role === "admin") {
    items = adminItems;
    if (!customerModuleEnabled) {
      items = items.filter(item => item.title !== "Customers");
    }
  }
  if (user.role === "stylist") items = stylistItems;

  const handleLogout = () => {
    authService.logout();
    navigate("/thesalonadmin");
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-secondary/50 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 h-screen w-64 bg-secondary text-secondary-foreground z-50 transition-transform duration-300 border-r border-sidebar-border",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Close Button */}
          <button 
            onClick={onClose}
            className="lg:hidden absolute top-4 right-4 p-2 text-secondary-foreground hover:bg-white/10 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo */}
          <div className="p-6 border-b border-sidebar-border/10">
            <h1 className="text-xl font-serif font-bold text-center">
              {salonName.split(' ')[0]} <span className="text-gold">{salonName.split(' ').slice(1).join(' ')}</span>
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {items.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                end={item.url === "/dashboard" || item.url === "/admin" || item.url === "/stylist"}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-white/10 text-gold shadow-sm"
                      : "text-secondary-foreground/70 hover:bg-white/5 hover:text-secondary-foreground"
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                {item.title}
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-sidebar-border/10 bg-black/20">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-secondary-foreground/70 hover:bg-destructive/90 hover:text-destructive-foreground transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
