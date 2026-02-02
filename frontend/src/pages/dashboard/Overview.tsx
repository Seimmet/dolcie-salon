import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Calendar, DollarSign, Users, Scissors, TrendingUp, Clock, Heart } from "lucide-react";
import { authService, User } from "@/services/authService";
import { getDashboardStats, getRevenueStats } from "@/services/reportsService";
import { useSettings } from "@/contexts/SettingsContext";
import styleBohoLocs from '@/assets/style-boho-locs.jpg';
import styleBoxBraids from '@/assets/style-box-braids.jpg';
import styleCornrows from '@/assets/style-cornrows.jpg';
import { motion } from "framer-motion";

const Overview = () => {
  const { settings } = useSettings();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);

    const fetchData = async () => {
      try {
        if (currentUser?.role === 'admin') {
          const [dashboardStats, revenueStats] = await Promise.all([
            getDashboardStats(),
            getRevenueStats()
          ]);
          setStats(dashboardStats);
          
          // Format revenue data for chart
          const formattedRevenue = revenueStats.map((item: any) => ({
            name: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
            total: item.revenue
          }));
          setRevenueData(formattedRevenue);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
  }, []);

  if (!user) return null;

  // Placeholder data if no dynamic data
  const adminData = revenueData.length > 0 ? revenueData : [
    { name: "Mon", total: 0 },
    { name: "Tue", total: 0 },
    { name: "Wed", total: 0 },
    { name: "Thu", total: 0 },
    { name: "Fri", total: 0 },
    { name: "Sat", total: 0 },
  ];

  const stylistData = [
    { name: "Mon", total: 3 },
    { name: "Tue", total: 5 },
    { name: "Wed", total: 4 },
    { name: "Thu", total: 6 },
    { name: "Fri", total: 8 },
    { name: "Sat", total: 9 },
  ];

  const StatCard = ({ icon: Icon, label, value, subtext, delay = 0 }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-card p-6 rounded-xl border border-border shadow-card hover:shadow-lg transition-shadow duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg bg-gradient-gold">
          <Icon className="w-5 h-5 text-secondary" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-serif font-bold text-foreground mt-1">
        {value}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
    </motion.div>
  );

  const getRoleContent = () => {
    switch (user.role) {
      case "admin":
        return (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={DollarSign}
                label="Total Revenue"
                value={`$${stats?.totalRevenue?.toLocaleString() || "0.00"}`}
                subtext="+20.1% from last month"
                delay={0}
              />
              <StatCard
                icon={Calendar}
                label="Bookings"
                value={stats?.totalBookings || 0}
                subtext={`${stats?.completedBookings || 0} completed, ${stats?.cancelledBookings || 0} cancelled`}
                delay={0.1}
              />
              <StatCard
                icon={Scissors}
                label="Active Stylists"
                value={stats?.activeStylists || 0}
                subtext="Available for booking"
                delay={0.2}
              />
              <StatCard
                icon={Users}
                label="Active Customers"
                value={stats?.totalCustomers || 0}
                subtext={`+${stats?.newCustomers || 0} new this month`}
                delay={0.3}
              />
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mt-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="col-span-4"
              >
                <Card className="h-full border-border shadow-card">
                  <CardHeader>
                    <CardTitle className="font-serif">Weekly Revenue</CardTitle>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={adminData}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                        <Tooltip 
                          cursor={{ fill: 'transparent' }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-gold" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="col-span-3"
              >
                <Card className="h-full border-border shadow-card">
                  <CardHeader>
                    <CardTitle className="font-serif">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      <div className="flex items-center">
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">New Booking: Sarah Johnson</p>
                          <p className="text-sm text-muted-foreground">Knotless Braids with Amanda</p>
                        </div>
                        <div className="ml-auto font-medium text-gold">+ $150.00</div>
                      </div>
                      <div className="flex items-center">
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">New Stylist Added</p>
                          <p className="text-sm text-muted-foreground">Jessica Williams joined the team</p>
                        </div>
                        <div className="ml-auto font-medium text-muted-foreground">2m ago</div>
                      </div>
                      <div className="flex items-center">
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">Booking Cancelled</p>
                          <p className="text-sm text-muted-foreground">Refund processed for ID #4291</p>
                        </div>
                        <div className="ml-auto font-medium text-red-500">
                          - ${settings?.depositAmount ? Number(settings.depositAmount).toFixed(2) : "50.00"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </>
        );

      case "stylist":
        return (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={Calendar}
                label="Upcoming Appointments"
                value="8"
                subtext="For this week"
                delay={0}
              />
              <StatCard
                icon={DollarSign}
                label="Today's Revenue"
                value="$450.00"
                subtext="3 appointments completed"
                delay={0.1}
              />
              <StatCard
                icon={TrendingUp}
                label="Client Rating"
                value="4.9"
                subtext="Based on 124 reviews"
                delay={0.2}
              />
              <StatCard
                icon={Clock}
                label="Hours Worked"
                value="32.5"
                subtext="This week"
                delay={0.3}
              />
            </div>
            
            <div className="mt-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <Card className="border-border shadow-card">
                  <CardHeader>
                    <CardTitle className="font-serif">Weekly Appointments</CardTitle>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={stylistData}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          cursor={{ fill: 'transparent' }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-gold" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </>
        );

      case "customer":
      default:
        return (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={TrendingUp}
                label="Loyalty Points"
                value="150"
                subtext="Earn 50 more for a free wash!"
                delay={0}
              />
              <StatCard
                icon={Calendar}
                label="Next Appointment"
                value="Jun 12"
                subtext="10:00 AM with Amanda"
                delay={0.1}
              />
              <StatCard
                icon={Clock}
                label="Total Visits"
                value="8"
                subtext="Since Jan 2025"
                delay={0.2}
              />
              <StatCard
                icon={Heart}
                label="Favorite Service"
                value="Braids"
                subtext="Most booked"
                delay={0.3}
              />
            </div>
            
            <div className="mt-8">
              <motion.h3 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="text-xl font-serif font-semibold mb-6"
              >
                Recommended Styles for You
              </motion.h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { img: styleBohoLocs, title: "Boho Locs", delay: 0.5 },
                  { img: styleBoxBraids, title: "Box Braids", delay: 0.6 },
                  { img: styleCornrows, title: "Cornrows", delay: 0.7 }
                ].map((style) => (
                   <motion.div 
                    key={style.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: style.delay }}
                    className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer shadow-card hover:shadow-xl transition-all duration-300"
                   >
                      <img src={style.img} alt={style.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                         <span className="text-white font-serif font-medium text-lg tracking-wide">{style.title}</span>
                      </div>
                   </motion.div>
                ))}
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header removed as it is now in Layout */}
      {getRoleContent()}
    </div>
  );
};

export default Overview;
