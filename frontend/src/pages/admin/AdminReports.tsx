import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Download,
  Calendar as CalendarIcon,
  DollarSign,
  Users,
  Scissors,
  TrendingUp,
  CreditCard,
  Briefcase
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  getDashboardStats,
  getRevenueStats,
  getCategoryStats,
  getStylistStats
} from '@/services/reportsService';
import { motion } from 'framer-motion';

interface DashboardStats {
  totalRevenue: number;
  totalBookings: number;
  activeCustomers: number;
  activeStylists: number;
}

const COLORS = ['#D4AF37', '#C5A028', '#E5C158', '#F3D576', '#B08D26'];

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

export default function AdminReports() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [stylistData, setStylistData] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [date]);

  const fetchData = async () => {
    try {
      const [stats, revenue, categories, stylists] = await Promise.all([
        getDashboardStats(),
        getRevenueStats(),
        getCategoryStats(),
        getStylistStats()
      ]);
      setSummary(stats);
      setRevenueData(revenue);
      setCategoryData(categories);
      setStylistData(stylists);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load report data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // In a real app, this would generate and download a CSV/PDF
    toast({
      title: 'Export Started',
      description: 'Your report is being generated and will download shortly.',
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-serif text-foreground">
          Reports & Analytics
        </h1>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal border-input hover:bg-accent hover:text-accent-foreground transition-colors",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                className="rounded-md border shadow-lg"
              />
            </PopoverContent>
          </Popover>
          <Button 
            onClick={handleExport}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`$${summary?.totalRevenue?.toFixed(2) || '0.00'}`}
          subtext="From all successful payments"
          delay={0}
        />
        <StatCard
          icon={TrendingUp}
          label="Total Bookings"
          value={summary?.totalBookings || 0}
          subtext="Total appointments made"
          delay={0.1}
        />
        <StatCard
          icon={Users}
          label="Active Customers"
          value={summary?.activeCustomers || 0}
          subtext="Registered clients"
          delay={0.2}
        />
        <StatCard
          icon={Scissors}
          label="Active Stylists"
          value={summary?.activeStylists || 0}
          subtext="Available staff"
          delay={0.3}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Revenue Chart */}
        <motion.div variants={itemVariants} className="col-span-4">
          <Card className="h-full hover:shadow-md transition-shadow duration-300 border-border shadow-card">
            <CardHeader>
              <CardTitle className="font-serif text-foreground">
                Revenue Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `$${value}`} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                        borderRadius: '8px', 
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                      }}
                    />
                    <Bar 
                      dataKey="total" 
                      fill="url(#colorTotal)" 
                      radius={[4, 4, 0, 0]} 
                    />
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Pie Chart */}
        <motion.div variants={itemVariants} className="col-span-3">
          <Card className="h-full hover:shadow-md transition-shadow duration-300 border-border shadow-card">
            <CardHeader>
              <CardTitle className="font-serif text-foreground">
                Popular Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#D4AF37"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                        borderRadius: '8px', 
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Stylist Performance */}
      <motion.div variants={itemVariants}>
        <Card className="hover:shadow-md transition-shadow duration-300 border-border shadow-card">
          <CardHeader>
            <CardTitle className="font-serif text-foreground">
              Stylist Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stylistData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                      borderRadius: '8px', 
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                    }}
                  />
                  <Legend />
                  <Bar dataKey="bookings" fill="#E5C158" name="Bookings" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="revenue" fill="#D4AF37" name="Revenue ($)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
