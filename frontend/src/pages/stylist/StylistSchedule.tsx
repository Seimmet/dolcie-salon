import { useState, useEffect } from 'react';
import { bookingService, Booking } from '@/services/bookingService';
import { settingsService, SalonSettings } from '@/services/settingsService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Phone, Mail } from 'lucide-react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO, startOfDay, isValid, setHours } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function StylistSchedule() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<SalonSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingsData, settingsData] = await Promise.all([
          bookingService.getBookings(),
          settingsService.getSettings()
        ]);

        if (Array.isArray(bookingsData)) {
          setBookings(bookingsData);
        } else {
          setBookings([]);
          console.error('Expected bookings to be an array, got:', bookingsData);
        }
        setSettings(settingsData);
      } catch (err: any) {
        setError(err.message || 'Failed to load schedule');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start on Monday
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)); // Mon-Sun

  // Calculate dynamic hours based on settings
  let startHour = 10;
  let endHour = 16;

  if (settings?.businessHours) {
    let minH = 24;
    let maxH = 0;
    let hasOpenDays = false;

    Object.values(settings.businessHours).forEach(day => {
      if (day.isOpen) {
        hasOpenDays = true;
        const s = parseInt(day.start.split(':')[0]);
        const e = parseInt(day.end.split(':')[0]);
        if (!isNaN(s) && s < minH) minH = s;
        if (!isNaN(e) && e > maxH) maxH = e;
      }
    });

    if (hasOpenDays) {
      startHour = minH;
      endHour = maxH > startHour ? maxH - 1 : startHour;
      if (endHour < startHour) endHour = startHour;
    }
  }

  const hours = Array.from({ length: endHour - startHour + 1 }).map((_, i) => startHour + i);

  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getBookingForSlot = (date: Date, hour: number) => {
    if (!Array.isArray(bookings)) return undefined;
    return bookings.find(b => {
      if (!b || !b.bookingDate || !b.bookingTime) return false;

      const bookingDate = parseISO(b.bookingDate);
      const bookingTime = parseISO(b.bookingTime);
      
      if (!isValid(bookingDate) || !isValid(bookingTime)) return false;

      // Check date match
      const isDateMatch = isSameDay(bookingDate, date);
      
      // Check time match (hour)
      const isTimeMatch = bookingTime.getHours() === hour;

      return isDateMatch && isTimeMatch && b.status !== 'cancelled';
    });
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-800 border-gray-200';
    switch (status.toLowerCase()) {
      case 'booked': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200/50';
      case 'checked_in': return 'bg-teal-500/10 text-teal-700 border-teal-200/50';
      case 'confirmed': return 'bg-emerald-500/10 text-emerald-700 border-emerald-200/50';
      case 'completed': return 'bg-blue-500/10 text-blue-700 border-blue-200/50';
      case 'in progress': return 'bg-green-500/10 text-green-700 border-green-200/50';
      case 'cancelled': return 'bg-red-500/10 text-red-700 border-red-200/50';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200/50';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center mb-6">
           <Skeleton className="h-10 w-48" />
           <Skeleton className="h-10 w-64" />
        </div>
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 text-red-500 bg-red-50 rounded-xl border border-red-100">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 h-full flex flex-col"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           {/* Title handled by layout, but we can keep subtitle or remove if redundant */}
        </div>
        
        <div className="flex items-center gap-2 bg-card p-1.5 rounded-xl shadow-sm border border-border">
          <Button variant="ghost" size="icon" onClick={prevWeek} className="h-8 w-8 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 min-w-[160px] justify-center font-medium font-serif text-sm px-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </div>
          <Button variant="ghost" size="icon" onClick={nextWeek} className="h-8 w-8 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="h-4 w-px bg-border mx-1" />
          <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs font-medium hover:bg-primary/10 hover:text-primary rounded-lg h-8 px-3 transition-colors">
            Today
          </Button>
        </div>
      </div>

      <Card className="border-border shadow-card hover:shadow-lg transition-all duration-300 overflow-hidden flex-1 flex flex-col bg-card/50 backdrop-blur-sm">
        <CardContent className="p-0 overflow-x-auto flex-1">
          <div className="min-w-[1000px]">
            {/* Header Row */}
            <div className="grid grid-cols-8 border-b border-border bg-muted/40 sticky top-0 z-10 backdrop-blur-md">
              <div className="p-4 border-r border-border font-medium text-sm text-muted-foreground text-center flex items-center justify-center bg-muted/20">
                <Clock className="w-4 h-4 mr-2 opacity-50" />
                Time
              </div>
              {weekDays.map((day) => (
                <div 
                  key={day.toISOString()} 
                  className={cn(
                    "p-3 border-r border-border last:border-r-0 text-center transition-colors relative overflow-hidden",
                    isSameDay(day, new Date()) ? "bg-primary/5" : ""
                  )}
                >
                  {isSameDay(day, new Date()) && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-gold" />
                  )}
                  <div className="font-medium text-sm font-serif mb-1">{format(day, 'EEEE')}</div>
                  <div className={cn(
                    "text-xs inline-flex items-center justify-center px-3 py-1 rounded-full font-medium transition-all",
                    isSameDay(day, new Date()) 
                      ? "bg-gradient-gold text-white shadow-md scale-105" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {format(day, 'MMM d')}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Slots */}
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b border-border last:border-b-0 group">
                {/* Time Label */}
                <div className="p-3 border-r border-border text-sm text-muted-foreground text-center flex items-center justify-center font-medium bg-muted/10 group-hover:bg-muted/20 transition-colors">
                  {format(setHours(new Date(), hour), 'h:00 a')}
                </div>

                {/* Days */}
                {weekDays.map((day) => {
                  const booking = getBookingForSlot(day, hour);
                  const isPast = day < startOfDay(new Date()) || (isSameDay(day, new Date()) && hour < new Date().getHours());
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div 
                      key={`${day.toISOString()}-${hour}`} 
                      className={cn(
                        "border-r border-border last:border-r-0 min-h-[120px] p-1.5 relative transition-all duration-200",
                        isToday ? "bg-primary/[0.02]" : "",
                        !booking && isPast ? "bg-muted/10 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.05)_25%,rgba(0,0,0,0.05)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.05)_75%,rgba(0,0,0,0.05)_100%)] bg-[length:10px_10px]" : "hover:bg-muted/5"
                      )}
                    >
                      {booking ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <motion.button 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              whileHover={{ scale: 1.02, y: -2 }}
                              className={cn(
                                "w-full h-full rounded-lg border p-2 text-left text-xs flex flex-col gap-1.5 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden",
                                getStatusColor(booking.status)
                              )}
                            >
                              <div className="font-semibold truncate font-serif text-sm">
                                {booking.guest?.fullName || 'Walk-in Guest'}
                              </div>
                              <div className="truncate opacity-90 font-medium">
                                {booking.style?.name || booking.category?.name || 'Service'}
                              </div>
                              <div className="mt-auto flex justify-between items-center pt-1 border-t border-current/10">
                                <Badge variant="outline" className="text-[10px] h-4 px-1 bg-white/50 border-current/20 backdrop-blur-sm">
                                  {format(parseISO(booking.bookingTime), 'h:mm a')}
                                </Badge>
                                {booking.status === 'checked_in' && (
                                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" title="Client Checked In" />
                                )}
                              </div>
                            </motion.button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-0 border-border shadow-xl" align="center" side="right">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card className="border-none shadow-none">
                                  <CardContent className="p-5 space-y-4">
                                    <div className="flex items-center gap-3 pb-4 border-b border-border">
                                      <Avatar className="h-10 w-10 border-2 border-primary/10">
                                        <AvatarImage src="" />
                                        <AvatarFallback className="bg-primary/5 text-primary">
                                            {booking.guest?.fullName?.charAt(0) || 'G'}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <h4 className="font-semibold font-serif text-lg">{booking.guest?.fullName}</h4>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                          <Badge variant="secondary" className={cn("text-[10px]", getStatusColor(booking.status))}>
                                            {booking.status}
                                          </Badge>
                                          <span>•</span>
                                          <span>{format(parseISO(booking.bookingDate), 'MMM d, yyyy')}</span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                      <div className="flex items-start gap-3 text-sm">
                                        <div className="p-2 bg-primary/5 rounded-full text-primary mt-0.5">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground text-xs font-medium">Service</p>
                                          <p className="font-medium">{booking.style?.name || booking.category?.name}</p>
                                          <p className="text-xs text-muted-foreground mt-0.5">${booking.price}</p>
                                        </div>
                                      </div>

                                      <div className="flex items-start gap-3 text-sm">
                                        <div className="p-2 bg-primary/5 rounded-full text-primary mt-0.5">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground text-xs font-medium">Time</p>
                                          <p className="font-medium">
                                            {format(parseISO(booking.bookingTime), 'h:mm a')} - {format(addDays(parseISO(booking.bookingTime), 0), 'h:mm a')}
                                          </p>
                                        </div>
                                      </div>

                                      {(booking.guest?.email || booking.guest?.phone) && (
                                        <div className="pt-2 border-t border-border mt-2 grid grid-cols-2 gap-2">
                                            {booking.guest?.phone && (
                                                <Button variant="outline" size="sm" className="w-full text-xs h-8 gap-2 border-border" asChild>
                                                    <a href={`tel:${booking.guest.phone}`}>
                                                        <Phone className="w-3 h-3" />
                                                        Call
                                                    </a>
                                                </Button>
                                            )}
                                            {booking.guest?.email && (
                                                <Button variant="outline" size="sm" className="w-full text-xs h-8 gap-2 border-border" asChild>
                                                    <a href={`mailto:${booking.guest.email}`}>
                                                        <Mail className="w-3 h-3" />
                                                        Email
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                            </motion.div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <div className="w-full h-full rounded-lg" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
