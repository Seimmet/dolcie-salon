import { useState, useEffect } from 'react';
import { bookingService } from '@/services/bookingService';
import { getMyNotifications, Notification } from '@/services/notificationService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Scissors, MapPin, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { format, isToday, parseISO, differenceInMinutes } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function MyBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkInLoadingId, setCheckInLoadingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [bookingsData, notificationsData] = await Promise.all([
        bookingService.getBookings(),
        getMyNotifications().catch(() => []) // Don't fail entire page if notifications fail
      ]);
      setBookings(bookingsData);
      setNotifications(notificationsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckIn = async (bookingId: string) => {
    try {
        setCheckInLoadingId(bookingId);
        await bookingService.checkInBooking(bookingId);
        toast({
            title: "Checked In!",
            description: "We've notified the stylist that you've arrived.",
        });
        fetchData();
    } catch (error) {
        toast({
            title: "Check-in Failed",
            description: (error as Error).message || "Please try again or tell the front desk.",
            variant: "destructive",
        });
    } finally {
        setCheckInLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 text-red-500 bg-red-50 rounded-xl border border-red-100 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <span>Error: {error}</span>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'booked': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200 hover:bg-yellow-500/20';
      case 'checked_in': return 'bg-teal-500/10 text-teal-600 border-teal-200 hover:bg-teal-500/20';
      case 'confirmed': return 'bg-green-500/10 text-green-600 border-green-200 hover:bg-green-500/20';
      case 'completed': return 'bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-600 border-red-200 hover:bg-red-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-200 hover:bg-gray-500/20';
    }
  };

  const sortedBookings = [...bookings].sort((a, b) => 
    new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime()
  );

  const upcomingBookings = sortedBookings.filter(b => 
    !['completed', 'cancelled'].includes(b.status.toLowerCase())
  );

  const pastBookings = sortedBookings.filter(b => 
    ['completed', 'cancelled'].includes(b.status.toLowerCase())
  );

  const BookingCard = ({ booking, index }: { booking: any, index: number }) => {
    // Safely parse date
    let isTodayBooking = false;
    try {
       isTodayBooking = isToday(parseISO(booking.bookingDate));
    } catch (e) {
       console.error("Date parse error", e);
    }

    const canCheckIn = isTodayBooking && (booking.status.toLowerCase() === 'booked' || booking.status.toLowerCase() === 'confirmed');

    const handleCheckInClick = () => {
        try {
            const now = new Date();
            const bookingDate = parseISO(booking.bookingDate);
            const bookingTime = parseISO(booking.bookingTime);
            
            // Construct full appointment Date object
            const appointmentTime = new Date(bookingDate);
            appointmentTime.setHours(bookingTime.getHours());
            appointmentTime.setMinutes(bookingTime.getMinutes());
            appointmentTime.setSeconds(0);
            
            const diffInMinutes = differenceInMinutes(now, appointmentTime);
            
            if (Math.abs(diffInMinutes) > 30) {
                 toast({
                    title: "Check-in Not Available",
                    description: "You can only check in 30 minutes before or after your appointment time. Please contact the Front Desk.",
                    variant: "destructive",
                });
                return;
            }
            
            handleCheckIn(booking.id);
        } catch (e) {
            console.error("Time validation error", e);
             toast({
                title: "Error",
                description: "Could not validate time. Please contact Front Desk.",
                variant: "destructive",
            });
        }
    };

    return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-none shadow-md group">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pb-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-xl font-serif text-foreground/90">
                {booking.style?.name ? `${booking.style.name} - ${booking.category?.name}` : booking.category?.name || 'Service'}
              </CardTitle>
              <CardDescription className="flex items-center gap-1.5 text-primary/80 font-medium">
                <Scissors className="w-3.5 h-3.5" />
                ${booking.price || '0.00'}
              </CardDescription>
            </div>
            <Badge className={cn("px-3 py-1 shadow-sm border", getStatusColor(booking.status))}>
              {booking.status === 'checked_in' ? 'Checked In' : booking.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 text-sm p-3 rounded-lg bg-muted/30 group-hover:bg-muted/50 transition-colors">
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Date</p>
                <p className="font-medium">{format(new Date(booking.bookingDate), 'MMMM do, yyyy')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm p-3 rounded-lg bg-muted/30 group-hover:bg-muted/50 transition-colors">
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Time</p>
                <p className="font-medium">{format(new Date(booking.bookingTime), 'h:mm a')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm p-3 rounded-lg bg-muted/30 group-hover:bg-muted/50 transition-colors">
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Stylist</p>
                <p className="font-medium">{booking.stylist?.user?.fullName || 'Any Stylist'}</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 py-4 px-6 flex flex-col gap-3">
           <div className="flex justify-between w-full text-sm text-muted-foreground items-center">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Booking Fee Paid
              </span>
              <span className="font-mono font-semibold text-foreground">${booking.payment?.amount || '0.00'}</span>
           </div>
           {canCheckIn && (
               <Button 
                  className="w-full mt-2 gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5" 
                  onClick={handleCheckInClick}
                  disabled={checkInLoadingId === booking.id}
               >
                  {checkInLoadingId === booking.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                      <MapPin className="w-4 h-4" />
                  )}
                  {checkInLoadingId === booking.id ? "Checking In..." : "I'm Here (Check In)"}
               </Button>
           )}
        </CardFooter>
      </Card>
    </motion.div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8"
    >
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-4xl font-bold font-serif text-foreground tracking-tight">My Appointments</h1>
        <p className="text-muted-foreground text-lg">Manage your upcoming visits and view past history.</p>
      </div>

      <div className="space-y-8">
        {upcomingBookings.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-serif font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" />
              Upcoming
            </h2>
            <div className="grid gap-6">
              {upcomingBookings.map((booking, index) => (
                <BookingCard key={booking.id} booking={booking} index={index} />
              ))}
            </div>
          </section>
        )}

        {pastBookings.length > 0 && (
          <section className="space-y-4">
             <h2 className="text-2xl font-serif font-semibold text-foreground/80 flex items-center gap-2 mt-8">
              <Clock className="w-6 h-6 text-muted-foreground" />
              History
            </h2>
            <div className="grid gap-6 opacity-80 hover:opacity-100 transition-opacity duration-300">
              {pastBookings.map((booking, index) => (
                <BookingCard key={booking.id} booking={booking} index={index} />
              ))}
            </div>
          </section>
        )}

        {bookings.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-muted/20 rounded-2xl border-2 border-dashed border-muted"
          >
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium text-foreground mb-2">No bookings found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              You haven't made any appointments yet. Book your first service to get started!
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
