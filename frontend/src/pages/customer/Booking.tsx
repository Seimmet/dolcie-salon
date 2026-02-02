import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format, addDays, startOfDay, isSameDay } from 'date-fns';
import { Check, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, CreditCard, Loader2, Scissors, Sparkles, MapPin, Phone, Mail, AlertCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

import { styleService, Style } from '@/services/styleService';
import { bookingService, TimeSlot, GuestDetails } from '@/services/bookingService';
import { stylistService, Stylist } from '@/services/stylistService';
import { authService } from '@/services/authService';
import CheckoutForm from '@/components/CheckoutForm';
import { SALON_INFO } from '@/config';
import { getActivePromos, MonthlyPromo } from '@/services/promoService';


import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { userService } from '@/services/userService';
import { bookingPolicyService } from '@/services/bookingPolicyService';
import { settingsService, SalonSettings } from '@/services/settingsService';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_PLACEHOLDER');

export default function Booking() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isLoggedIn = !!authService.getToken();

  // --- Global State ---
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [policyContent, setPolicyContent] = useState<string>('');
  const [policyAgreed, setPolicyAgreed] = useState(false);
  const [settings, setSettings] = useState<SalonSettings | null>(null);
  const [promos, setPromos] = useState<MonthlyPromo[]>([]);
  const [promoLoading, setPromoLoading] = useState(true);
  const [selectedPromoId, setSelectedPromoId] = useState<string | null>(null);
  
  // --- Data ---
  const [styles, setStyles] = useState<Style[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  
  // --- Step 1: Selection State ---
  const [selectedStyleId, setSelectedStyleId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(''); // Variation
  const [selectedStylistId, setSelectedStylistId] = useState<string>('');

  // --- Step 2: Time State ---
  const [weeklyAvailability, setWeeklyAvailability] = useState<Record<string, TimeSlot[]>>({});
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(startOfDay(new Date()));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // --- Step 3: Details State ---
  const [guestDetails, setGuestDetails] = useState<GuestDetails & { smsConsent: boolean }>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    smsConsent: false
  });

  // --- Step 4: Payment State ---
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [authSmsConsent, setAuthSmsConsent] = useState(true);
  const [showAuthConsentDialog, setShowAuthConsentDialog] = useState(false);

  // --- Computed ---
  const depositAmount = settings?.depositAmount
    ? typeof settings.depositAmount === 'string'
      ? parseFloat(settings.depositAmount)
      : settings.depositAmount
    : 50;

  const STRIPE_FEE_PERCENTAGE = 0.035;
  const rawProcessingFee = depositAmount * STRIPE_FEE_PERCENTAGE;
  const PROCESSING_FEE = Math.round(rawProcessingFee * 100) / 100;
  const TOTAL_DEPOSIT = depositAmount + PROCESSING_FEE;
  const TOTAL_DEPOSIT_CENTS = Math.round(TOTAL_DEPOSIT * 100);
  const availableVariations = useMemo(() => {
    if (!selectedStyleId) return [];
    const style = styles.find(s => s.id === selectedStyleId);
    return style?.pricing?.map(p => ({
        id: p.categoryId,
        name: p.category.name,
        price: p.price,
        duration: p.durationMinutes
    })) || [];
  }, [styles, selectedStyleId]);

  const selectedStylist = useMemo(() => 
    stylists.find(s => s.id === selectedStylistId),
    [stylists, selectedStylistId]
  );

  const stylistSurcharge = useMemo(() => {
    if (!selectedStylist || selectedStylistId === 'unassigned') return 0;

    // Strict restriction: Surcharge only applies to Victoria
    if (!selectedStylist.fullName.toLowerCase().includes('victoria')) return 0;

    // Check for style-specific surcharge
    if (selectedStyleId && (selectedStylist as any).styleSurcharges) {
        const styleSurcharges = (selectedStylist as any).styleSurcharges;
        if (styleSurcharges[selectedStyleId] !== undefined) {
             const s = styleSurcharges[selectedStyleId];
             const amount = typeof s === 'string' ? parseFloat(s) : Number(s || 0);
             return isNaN(amount) ? 0 : amount;
        }
    }

    const s: any = (selectedStylist as any).surcharge;
    const amount = typeof s === 'string' ? parseFloat(s) : Number(s || 0);
    return isNaN(amount) ? 0 : amount;
  }, [selectedStylist, selectedStylistId, selectedStyleId]);

  const selectedPricing = useMemo(() => {
    if (!selectedStyleId || !selectedCategoryId) return null;
    const style = styles.find(s => s.id === selectedStyleId);
    return style?.pricing?.find(p => p.categoryId === selectedCategoryId);
  }, [styles, selectedStyleId, selectedCategoryId]);

  const adjustedBasePrice = useMemo(() => {
    if (!selectedPricing) return 0;
    return Number(selectedPricing.price) + stylistSurcharge;
  }, [selectedPricing, stylistSurcharge]);

  const activePromo = useMemo(() => {
    if (!selectedPromoId) return null;
    return promos.find(p => p.id === selectedPromoId) || null;
  }, [promos, selectedPromoId]);

  const appliedDiscountPercentage = useMemo(() => {
    if (!activePromo) return 0;
    if (!selectedStyleId) return 0;
    if (!activePromo.stylePricing?.style?.id) return 0;
    if (activePromo.stylePricing.style.id !== selectedStyleId) return 0;
    return Number(activePromo.discountPercentage) || 0;
  }, [activePromo, selectedStyleId]);

  const discountedPrice = useMemo(() => {
    if (!selectedPricing) return null;
    if (!appliedDiscountPercentage) return adjustedBasePrice;
    const discountFactor = 1 - appliedDiscountPercentage / 100;
    const price = adjustedBasePrice * discountFactor;
    return Math.round(price * 100) / 100;
  }, [selectedPricing, appliedDiscountPercentage, adjustedBasePrice]);

  const effectivePromoPrice = useMemo(() => {
    if (!activePromo) return null;
    if (!selectedStyleId || !selectedPricing) return null;
    if (!activePromo.stylePricing?.style?.id) return null;
    if (activePromo.stylePricing.style.id !== selectedStyleId) return null;

    if (appliedDiscountPercentage > 0 && discountedPrice !== null) {
      return discountedPrice;
    }

    // Check for fixed promo price (handle string or number)
    const price = Number(activePromo.promoPrice);
    if (!isNaN(price) && price > 0) {
      return price + stylistSurcharge;
    }

    return null;
  }, [activePromo, selectedStyleId, selectedPricing, appliedDiscountPercentage, discountedPrice, stylistSurcharge]);

  // --- Initialization ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const [stylesData, stylistsResponse, policy, settingsData] = await Promise.all([
          styleService.getAllStyles({ limit: 1000 }),
          stylistService.getAllStylists({ limit: 100 }),
          bookingPolicyService.getPolicy(),
          settingsService.getPublicSettings()
        ]);

        setStyles(stylesData.data);
        
        if (stylistsResponse && Array.isArray(stylistsResponse.data)) {
            setStylists(stylistsResponse.data);
        } else if (Array.isArray(stylistsResponse)) {
            setStylists(stylistsResponse);
        }

        if (policy) {
          setPolicyContent(policy.content);
        }

        if (settingsData) {
          setSettings(settingsData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load booking data",
          variant: "destructive",
        });
      } finally {
        setInitialLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadPromos = async () => {
      try {
        const data = await getActivePromos();
        if (Array.isArray(data)) {
          setPromos(data);
        } else {
          setPromos([]);
        }
      } catch (error) {
        setPromos([]);
      } finally {
        setPromoLoading(false);
      }
    };
    loadPromos();
  }, []);

  useEffect(() => {
    if (!promos.length) return;

    let initialPromoId: string | null = null;

    try {
      const params = new URLSearchParams(location.search);
      initialPromoId = params.get('promoId');
    } catch (error) {
      console.error(error);
    }

    if (!initialPromoId) {
      try {
        initialPromoId = localStorage.getItem('selectedPromoId');
      } catch (error) {
        initialPromoId = null;
      }
    }

    if (initialPromoId && promos.some(p => p.id === initialPromoId)) {
      setSelectedPromoId(initialPromoId);
    }
  }, [promos, location.search]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const user = authService.getCurrentUser();
    if (user) {
      const initialConsent = user.notificationConsent ?? true;
      setAuthSmsConsent(initialConsent);
      setGuestDetails(prev => ({ 
        ...prev, 
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        smsConsent: initialConsent 
      }));
    }
  }, [isLoggedIn]);

  // --- Fetch Availability (Step 3) ---
  useEffect(() => {
    if (step === 4 && selectedStyleId && selectedCategoryId && selectedDate) {
      const fetchAvailability = async () => {
        setLoading(true);
        try {
          const dateStr = format(selectedDate, 'yyyy-MM-dd');
          
          // Get duration from selected pricing
          const duration = selectedPricing?.durationMinutes || 60;

          const slots = await bookingService.getAvailability(
            dateStr,
            selectedStyleId,
            selectedCategoryId,
            (selectedStylistId && selectedStylistId !== 'unassigned') ? selectedStylistId : undefined,
            duration
          );
          setWeeklyAvailability({ [dateStr]: slots });
        } catch (error) {
          console.error(error);
          toast({
             title: "Error",
             description: "Failed to load availability",
             variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      };
      fetchAvailability();
    }
  }, [step, selectedDate, selectedStyleId, selectedCategoryId, selectedStylistId]);

  // --- Handlers ---

  const handleTimeSelect = (date: Date, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!policyAgreed) {
        toast({ title: "Action Required", description: "Please agree to the booking policy.", variant: "destructive" });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (activePromo?.stylePricing?.style?.id) {
        setSelectedStyleId(activePromo.stylePricing.style.id);
        
        // Preselect the variation (category) associated with the promo
        if (activePromo.stylePricing.category?.id) {
            setSelectedCategoryId(activePromo.stylePricing.category.id);
        } else {
            setSelectedCategoryId('');
        }
        
        setSelectedStylistId('');
      }
      setStep(3);
    } else if (step === 3) {
      if (!selectedStyleId || !selectedCategoryId) {
        toast({ title: "Incomplete Selection", description: "Please select a style and variation.", variant: "destructive" });
        return;
      }
      setStep(4);
    } else if (step === 4) {
      if (!selectedDate || !selectedTime) {
        toast({ title: "Select Time", description: "Please select a date and time.", variant: "destructive" });
        return;
      }
      
      const user = authService.getCurrentUser();
      if (isLoggedIn && user) {
          const consent = (user as any).notificationConsent ?? true;
        setGuestDetails({
            fullName: user.fullName,
            email: user.email,
            phone: user.phone || '',
            address: user.address || '',
            birthDay: user.birthDay?.toString(),
            birthMonth: user.birthMonth?.toString(),
            smsConsent: consent
        });
        setAuthSmsConsent(consent);
      }
      setStep(5);
    } else if (step === 5) {
      if (!guestDetails.fullName || !guestDetails.email || !guestDetails.phone) {
        toast({ title: "Required Fields", description: "Please fill in all details.", variant: "destructive" });
        return;
      }
      
      if (!isLoggedIn && !guestDetails.smsConsent) {
        setShowConsentDialog(true);
        return;
      }

      setStep(6);
    }
  };

  const handleBack = () => {
    if (step === 6) {
        setClientSecret(null);
    }
    if (step > 1) {
        setStep(step - 1);
    }
  };
  
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!selectedStyleId || !selectedDate || !selectedTime) return;
    
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      await bookingService.createBooking({
        styleId: selectedStyleId,
        categoryId: selectedCategoryId,
        stylistId: (selectedStylistId && selectedStylistId !== 'unassigned') ? selectedStylistId : undefined,
        date: dateStr,
        time: selectedTime,
        guestDetails: isLoggedIn ? { ...guestDetails, smsConsent: authSmsConsent } : guestDetails,
        paymentIntentId: paymentIntentId,
        promoId: activePromo ? activePromo.id : undefined,
      });

      setStep(7);
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message || "Could not complete booking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initializePayment = useCallback(async () => {
    setLoading(true);
    setPaymentError(null);
    try {
      const data = await bookingService.createPaymentIntent(TOTAL_DEPOSIT_CENTS, guestDetails);
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
         throw new Error("No client secret received");
      }
    } catch (error: any) {
      console.error("Payment initialization failed:", error);
      setPaymentError(error.message || "Failed to initialize payment");
      toast({ title: "Error", description: "Failed to initialize payment", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, TOTAL_DEPOSIT_CENTS, guestDetails]);

  useEffect(() => {
    if (step === 6 && !clientSecret) {
      initializePayment();
    }
  }, [step, clientSecret, initializePayment]);

  const formatTimeDisplay = (time: string | null) => {
    if (!time) return '';
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes);
      return format(date, 'h:mm a');
    } catch (e) {
      return time;
    }
  };

  const renderProgressBar = () => {
    const steps = [
        { num: 1, label: "Policy" },
        { num: 2, label: "Promos" },
        { num: 3, label: "Service" },
        { num: 4, label: "Time" },
        { num: 5, label: "Details" },
        { num: 6, label: "Payment" },
        { num: 7, label: "Done" }
    ];

    return (
        <div className="w-full bg-card/80 backdrop-blur-md border-b border-border mb-8 sticky top-0 z-50 shadow-sm">
            <div className="container mx-auto px-4 py-4">
                <div className="flex justify-between items-center max-w-4xl mx-auto relative">
                     {/* Background Line */}
                    <div className="absolute top-[15px] left-0 w-full h-[2px] bg-muted -z-10" />
                    
                    {/* Animated Progress Line */}
                    <motion.div 
                        className="absolute top-[15px] left-0 h-[2px] bg-gradient-gold -z-0"
                        initial={{ width: "0%" }}
                        animate={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    />

                    {steps.map((s) => {
                        const isActive = step === s.num;
                        const isCompleted = step > s.num;
                        return (
                            <div key={s.num} className="flex flex-col items-center relative group">
                                <motion.div 
                                    className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 z-10 border-2",
                                        isActive ? "bg-primary text-primary-foreground border-primary shadow-lg scale-110" : 
                                        isCompleted ? "bg-primary text-primary-foreground border-primary" : 
                                        "bg-background text-muted-foreground border-muted-foreground"
                                    )}
                                    animate={{ 
                                        scale: isActive ? 1.2 : 1,
                                        backgroundColor: isActive || isCompleted ? "var(--primary)" : "var(--background)",
                                        borderColor: isActive || isCompleted ? "var(--primary)" : "var(--muted-foreground)"
                                    }}
                                >
                                    {isCompleted ? <Check className="w-4 h-4" /> : s.num}
                                </motion.div>
                                <span className={cn(
                                    "text-[10px] md:text-xs mt-2 font-medium transition-colors duration-200 absolute -bottom-6 w-max text-center",
                                    isActive ? "text-primary font-bold" : 
                                    isCompleted ? "text-primary" : "text-muted-foreground"
                                )}>
                                    {s.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
  };

  const renderStep1 = () => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
    >
        <Card className="max-w-3xl mx-auto border-none shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-6">
                <CardTitle className="text-2xl font-bold text-center font-serif">Appointment Guidelines & Booking Promise</CardTitle>
                <CardDescription className="text-center">Please review our policies before booking</CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-6">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="whitespace-pre-wrap leading-relaxed text-muted-foreground bg-muted/30 p-4 rounded-lg border border-muted">
                        {initialLoading ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                                <span>Loading policy...</span>
                            </div>
                        ) : (
                            policyContent || "No policy content available."
                        )}
                    </div>
                </div>
                
                <div className="flex items-center space-x-3 pt-4 border-t bg-primary/5 p-4 rounded-lg">
                    <Checkbox 
                        id="policy-agreement" 
                        checked={policyAgreed} 
                        onCheckedChange={(checked) => setPolicyAgreed(checked as boolean)}
                        disabled={initialLoading}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label
                        htmlFor="policy-agreement"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
                    >
                        I have read and agree to the booking policy and guidelines.
                    </label>
                </div>
            </CardContent>
        </Card>
    </motion.div>
  );

  const renderPromoStep = () => (
    <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
    >
      <Card className="max-w-4xl mx-auto border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-center">
            <CardTitle className="text-2xl font-bold font-serif flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Monthly Promotions
                <Sparkles className="w-5 h-5 text-purple-600" />
            </CardTitle>
            <CardDescription>Choose a promotion to apply, or continue without one.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6">
          {promoLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span className="text-sm text-muted-foreground">Loading promotions...</span>
            </div>
          ) : promos.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg bg-muted/20">
              <Sparkles className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-50" />
              <p>There are no active promotions at this time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {promos.map((promo) => {
                  const isSelected = selectedPromoId === promo.id;
                  return (
                    <motion.button
                      key={promo.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedPromoId(null);
                          try {
                            localStorage.removeItem('selectedPromoId');
                          } catch (error) {
                            console.error(error);
                          }
                        } else {
                          setSelectedPromoId(promo.id);
                          try {
                            localStorage.setItem('selectedPromoId', promo.id);
                          } catch (error) {
                            console.error(error);
                          }
                        }
                      }}
                      className={cn(
                        "text-left rounded-xl border-2 transition-all duration-300 relative overflow-hidden group",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-muted bg-card hover:border-primary/50 hover:shadow-sm"
                      )}
                    >
                      {isSelected && (
                          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-bl-lg font-bold z-10">
                              SELECTED
                          </div>
                      )}
                      <div className="p-4 space-y-3 relative z-0">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em] text-primary font-bold">
                                {promo.promoMonth} {promo.promoYear}
                              </p>
                              <h3 className="text-lg font-serif font-bold mt-1">
                                {promo.title || "Special Offer"}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                <Scissors className="w-3 h-3" />
                                {promo.stylePricing?.style.name} •{" "}
                                {promo.stylePricing?.category.name}
                              </p>
                            </div>
                            <div className="text-right bg-background/80 p-2 rounded-lg shadow-sm border">
                              {typeof promo.discountPercentage === "number" ? (
                                <>
                                  <p className="text-xs text-muted-foreground uppercase">Discount</p>
                                  <p className="text-xl font-bold text-primary">{promo.discountPercentage}% OFF</p>
                                </>
                              ) : (
                                <>
                                  <p className="text-xs text-muted-foreground uppercase">Price</p>
                                  <p className="text-xl font-bold text-primary">${promo.promoPrice}</p>
                                </>
                              )}
                            </div>
                          </div>
                          {promo.description && (
                            <p className="text-sm text-foreground/80 leading-relaxed bg-muted/30 p-2 rounded-md border-l-2 border-primary/20">
                                {promo.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground flex justify-between items-center pt-2 border-t border-dashed">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Ends {new Date(promo.offerEnds).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                          </p>
                        </div>
                    </motion.button>
                  );
                })}
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSelectedPromoId(null);
                  try {
                    localStorage.removeItem('selectedPromoId');
                  } catch (error) {
                    console.error(error);
                  }
                }}
                className={cn(
                  "w-full text-sm mt-2 border border-dashed",
                  !selectedPromoId && "opacity-50 cursor-not-allowed"
                )}
                disabled={!selectedPromoId}
              >
                {selectedPromoId ? "Remove Selected Promotion" : "No promotion selected"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
    >
      {settings?.courtesyNotice && (
        <Card className="border-l-4 border-l-yellow-500 bg-yellow-50/50 shadow-sm overflow-hidden">
            <CardContent className="p-6 flex gap-4">
                <AlertCircle className="w-6 h-6 text-yellow-600 shrink-0" />
                <div className="whitespace-pre-wrap text-sm md:text-base text-yellow-800 font-medium leading-relaxed font-serif">
                    {settings.courtesyNotice}
                </div>
            </CardContent>
        </Card>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-4">
                <CardTitle className="font-serif">Select Service</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                    <Label className="text-base font-semibold">Style</Label>
                    <Select value={selectedStyleId} onValueChange={setSelectedStyleId}>
                    <SelectTrigger className="h-12 text-lg bg-background shadow-sm transition-all hover:border-primary">
                        <SelectValue placeholder="Choose a style..." />
                    </SelectTrigger>
                    <SelectContent>
                        {styles.map((style) => (
                        <SelectItem key={style.id} value={style.id} className="cursor-pointer">
                            <div className="flex items-center gap-3">
                            {style.imageUrl ? (
                                <img 
                                src={style.imageUrl} 
                                alt={style.name} 
                                className="w-8 h-8 rounded-full object-cover border border-border" 
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary border border-primary/20">
                                {style.name.charAt(0)}
                                </div>
                            )}
                            <span className="font-medium">{style.name}</span>
                            </div>
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>

                <AnimatePresence>
                    {selectedStyleId && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2"
                        >
                        <Label className="text-base font-semibold">Variation</Label>
                        <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                            <SelectTrigger className="h-12 text-lg bg-background shadow-sm transition-all hover:border-primary">
                            <SelectValue placeholder="Choose variation..." />
                            </SelectTrigger>
                            <SelectContent>
                            {availableVariations.map((v) => (
                                <SelectItem key={v.id} value={v.id} className="cursor-pointer">
                                <div className="flex justify-between w-full gap-4">
                                    <span>{v.name}</span>
                                    <span className="text-muted-foreground">${v.price} ({v.duration} min)</span>
                                </div>
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {selectedCategoryId && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2"
                        >
                        <Label className="text-base font-semibold">Braider Preference</Label>
                        <Select value={selectedStylistId} onValueChange={setSelectedStylistId}>
                            <SelectTrigger className="h-12 text-lg bg-background shadow-sm transition-all hover:border-primary">
                            <SelectValue placeholder="Any Available Braider" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="unassigned" className="font-medium text-primary">✨ Any Available Braider</SelectItem>
                            {stylists
                                .filter(stylist => 
                                !selectedStyleId || 
                                (stylist.styles && stylist.styles.some(s => s.id === selectedStyleId))
                                )
                                .map((stylist) => (
                                <SelectItem key={stylist.id} value={stylist.id}>
                                {stylist.fullName}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-none shadow-md h-full bg-muted/10">
            <CardHeader className="bg-muted/30 pb-4 border-b">
                <CardTitle className="font-serif">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {selectedPricing ? (
                 <div className="space-y-4">
                    {styles.find(s => s.id === selectedStyleId)?.imageUrl && (
                      <div className="mb-4 rounded-xl overflow-hidden shadow-sm border border-border mx-auto max-w-[200px]">
                        <img
                          src={styles.find(s => s.id === selectedStyleId)?.imageUrl || ''}
                          alt="Selected Style"
                          className="w-full h-auto object-cover aspect-square"
                        />
                      </div>
                    )}
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center bg-card p-3 rounded-lg shadow-sm">
                            <span className="text-muted-foreground flex items-center gap-2"><Scissors className="w-4 h-4" /> Style</span>
                            <span className="font-semibold">{styles.find(s => s.id === selectedStyleId)?.name}</span>
                        </div>
                        <div className="flex justify-between items-center bg-card p-3 rounded-lg shadow-sm">
                            <span className="text-muted-foreground">Variation</span>
                            <span className="font-medium">{availableVariations.find(v => v.id === selectedCategoryId)?.name}</span>
                        </div>
                        <div className="flex justify-between items-center bg-card p-3 rounded-lg shadow-sm">
                            <span className="text-muted-foreground flex items-center gap-2"><User className="w-4 h-4" /> Braider</span>
                            <span className="font-medium">
                                {stylists.find(s => s.id === selectedStylistId)?.fullName || (selectedStylistId === 'unassigned' ? "Any Available Braider" : "Not selected")}
                            </span>
                        </div>
                    </div>
                    
                    <div className="border-t border-dashed pt-4 mt-2 space-y-2">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Base price</span>
                        <span>${selectedPricing.price}</span>
                      </div>
                      {stylistSurcharge > 0 && (
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Stylist surcharge ({stylists.find(s => s.id === selectedStylistId)?.fullName})</span>
                            <span>+${stylistSurcharge}</span>
                        </div>
                      )}
                      
                      {appliedDiscountPercentage > 0 && discountedPrice !== null && (
                        <>
                          <div className="flex justify-between text-sm text-emerald-600 font-medium">
                            <span>Promo discount ({appliedDiscountPercentage}%)</span>
                            <span>- ${(adjustedBasePrice - discountedPrice).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-base font-bold text-primary">
                            <span>Promo price</span>
                            <span>${discountedPrice.toFixed(2)}</span>
                          </div>
                        </>
                      )}
                      {appliedDiscountPercentage === 0 && effectivePromoPrice !== null && (
                        <>
                          <div className="flex justify-between text-sm text-emerald-600 font-medium">
                            <span>Promo price</span>
                            <span>${effectivePromoPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>You save</span>
                            <span>${(adjustedBasePrice - effectivePromoPrice).toFixed(2)}</span>
                          </div>
                        </>
                      )}
                      {appliedDiscountPercentage === 0 && effectivePromoPrice === null && stylistSurcharge > 0 && (
                        <div className="flex justify-between text-base font-bold">
                            <span>Total price</span>
                            <span>${adjustedBasePrice}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm text-muted-foreground pt-1">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Duration</span>
                        <span>{selectedPricing.durationMinutes} mins</span>
                      </div>
                    </div>
                     <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 mt-4 shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-yellow-800 text-sm font-medium">Deposit Required</span>
                            <span className="text-yellow-900 font-bold text-lg">${TOTAL_DEPOSIT.toFixed(2)}</span>
                        </div>
                        <p className="text-[10px] text-yellow-700/80 text-right">Includes 3.5% processing fee</p>
                    </div>
                 </div>
              ) : (
                <div className="text-center text-muted-foreground py-12 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                        <Scissors className="w-6 h-6 opacity-50" />
                    </div>
                    Select a style and variation to see pricing.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
    >
      <div className="flex flex-col md:flex-row gap-6">
         {/* Calendar Column */}
         <div className="w-full md:w-auto flex-shrink-0">
             <Card className="border-none shadow-md overflow-hidden h-full">
                <CardHeader className="bg-primary/5 pb-4">
                    <CardTitle className="text-lg font-serif">Select Date</CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex justify-center">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                            if (date) {
                                setSelectedDate(date);
                                setSelectedTime(null);
                            }
                        }}
                        className="rounded-md border-none shadow-sm mx-auto bg-card"
                        classNames={{
                            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                            day_today: "bg-accent text-accent-foreground",
                        }}
                        disabled={(date) => date < startOfDay(new Date())}
                    />
                </CardContent>
             </Card>
         </div>
         
         {/* Time Slots Column */}
         <div className="flex-1 min-w-0">
             <Card className="border-none shadow-md h-full">
                <CardHeader className="bg-primary/5 pb-4">
                    <CardTitle className="text-lg font-serif">
                        {selectedDate ? `Availability for ${format(selectedDate, 'MMMM d, yyyy')}` : 'Select a Date'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {selectedDate ? (
                        <>
                            {loading ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                    <span className="text-muted-foreground text-sm">Checking availability...</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 animate-in fade-in duration-500">
                                    {(() => {
                                        const dateStr = format(selectedDate, 'yyyy-MM-dd');
                                        const rawSlots = weeklyAvailability[dateStr] || [];
                                        
                                        // Filter out past time slots if the date is today
                                        const now = new Date();
                                        const isToday = isSameDay(selectedDate, now);
                                        const slots = rawSlots.filter(slot => {
                                            if (!isToday) return true;
                                            
                                            const [hours, minutes] = slot.time.split(':').map(Number);
                                            const slotTime = new Date(selectedDate);
                                            slotTime.setHours(hours, minutes, 0, 0);
                                            
                                            return slotTime > now;
                                        });

                                        if (slots.length === 0) {
                                            return (
                                                <div className="col-span-full text-center text-muted-foreground py-12 border-2 border-dashed rounded-xl bg-muted/20 flex flex-col items-center justify-center">
                                                    <Clock className="w-10 h-10 mb-3 opacity-30" />
                                                    No available slots for this date.
                                                </div>
                                            );
                                        }

                                        return slots.map((slot) => (
                                            <Button
                                                key={`${dateStr}-${slot.time}`}
                                                variant={selectedTime === slot.time ? "default" : "outline"}
                                                className={cn(
                                                    "w-full h-12 transition-all duration-200",
                                                    selectedTime === slot.time 
                                                        ? "bg-primary text-primary-foreground shadow-lg scale-105 font-bold ring-2 ring-primary ring-offset-2" 
                                                        : "hover:bg-primary/10 hover:border-primary/50 hover:text-primary",
                                                    !slot.available && "opacity-50 cursor-not-allowed bg-muted hover:bg-muted hover:text-muted-foreground"
                                                )}
                                                disabled={!slot.available}
                                                onClick={() => handleTimeSelect(selectedDate, slot.time)}
                                            >
                                                {formatTimeDisplay(slot.time)}
                                            </Button>
                                        ));
                                    })()}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl bg-muted/10">
                            <CalendarIcon className="w-12 h-12 mb-3 opacity-20" />
                            Select a date on the calendar to view availability
                        </div>
                    )}
                </CardContent>
             </Card>
         </div>
      </div>
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto space-y-6"
    >
        <Card className="border-none shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-6">
                <CardTitle className="font-serif text-center text-2xl">Guest Details</CardTitle>
                <CardDescription className="text-center">Please provide your contact information</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="fullName" className="flex items-center gap-2"><User className="w-4 h-4" /> Full Name</Label>
                        <Input 
                            id="fullName" 
                            value={guestDetails.fullName} 
                            onChange={(e) => setGuestDetails({...guestDetails, fullName: e.target.value})}
                            placeholder="Jane Doe"
                            className="h-12 bg-muted/10 focus:bg-background transition-colors"
                        />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="email" className="flex items-center gap-2"><Mail className="w-4 h-4" /> Email</Label>
                            <Input 
                                id="email" 
                                type="email"
                                value={guestDetails.email} 
                                onChange={(e) => setGuestDetails({...guestDetails, email: e.target.value})}
                                placeholder="jane@example.com"
                                className="h-12 bg-muted/10 focus:bg-background transition-colors"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone" className="flex items-center gap-2"><Phone className="w-4 h-4" /> Phone Number</Label>
                            <Input 
                                id="phone" 
                                type="tel"
                                value={guestDetails.phone} 
                                onChange={(e) => setGuestDetails({...guestDetails, phone: e.target.value})}
                                placeholder="(555) 123-4567"
                                className="h-12 bg-muted/10 focus:bg-background transition-colors"
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="address" className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Address (Optional)</Label>
                        <Input 
                            id="address" 
                            value={guestDetails.address} 
                            onChange={(e) => setGuestDetails({...guestDetails, address: e.target.value})}
                            placeholder="123 Main St"
                            className="h-12 bg-muted/10 focus:bg-background transition-colors"
                        />
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg border border-muted space-y-4">
                        {!isLoggedIn && (
                        <div className="flex items-start space-x-3">
                            <Checkbox 
                                id="smsConsent" 
                                checked={guestDetails.smsConsent}
                                onCheckedChange={(checked) => setGuestDetails({...guestDetails, smsConsent: checked as boolean})}
                                className="mt-1"
                            />
                            <Label htmlFor="smsConsent" className="text-sm font-normal cursor-pointer leading-relaxed">
                                I consent to receiving SMS and email notifications about my appointment and exclusive offers.
                            </Label>
                        </div>
                        )}

                        {isLoggedIn && (
                        <div className="flex items-start space-x-3">
                            <Checkbox
                                id="authSmsConsentStep3"
                                checked={authSmsConsent}
                                onCheckedChange={(checked) => {
                                    const next = checked as boolean;
                                    if (!next && authSmsConsent) {
                                        setShowAuthConsentDialog(true);
                                        return;
                                    }
                                    setAuthSmsConsent(next);
                                    setGuestDetails(prev => ({ ...prev, smsConsent: next }));
                                    userService.updateNotificationConsent(next).catch(() => {});
                                    authService.getMe().catch(() => {});
                                }}
                                className="mt-1"
                            />
                            <Label htmlFor="authSmsConsentStep3" className="text-sm font-normal cursor-pointer leading-relaxed">
                                I consent to receiving SMS and email notifications about my appointment and exclusive offers.
                            </Label>
                        </div>
                        )}
                    </div>

                    {!isLoggedIn && (
                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                            <div className="grid gap-2">
                                <Label>Birthday (Optional)</Label>
                                <Select onValueChange={(v) => setGuestDetails({...guestDetails, birthMonth: v})}>
                                    <SelectTrigger className="bg-muted/10"><SelectValue placeholder="Month" /></SelectTrigger>
                                    <SelectContent>
                                        {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                                            <SelectItem key={m} value={m.toString()}>{format(new Date(2000, m-1, 1), 'MMMM')}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>&nbsp;</Label>
                                <Select onValueChange={(v) => setGuestDetails({...guestDetails, birthDay: v})}>
                                    <SelectTrigger className="bg-muted/10"><SelectValue placeholder="Day" /></SelectTrigger>
                                    <SelectContent>
                                        {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                                            <SelectItem key={d} value={d.toString()}>{d}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    </motion.div>
  );

  const renderStep5 = () => (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.5 }}
        className="max-w-md mx-auto space-y-6"
      >
          <Card className="border-none shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-6 border-b">
                  <CardTitle className="text-2xl font-bold font-serif text-center">Confirm & Pay Deposit</CardTitle>
                  <CardDescription className="text-center">Secure your appointment</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                  <div className="space-y-4 mb-8 bg-muted/20 p-6 rounded-xl border border-muted">
                      <div className="flex justify-between py-2 border-b border-dashed border-muted-foreground/30">
                          <span className="text-muted-foreground">Service</span>
                          <span className="font-medium text-right">
                            {styles.find(s => s.id === selectedStyleId)?.name} <br/>
                            <span className="text-xs text-muted-foreground font-normal">{availableVariations.find(v => v.id === selectedCategoryId)?.name}</span>
                          </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-dashed border-muted-foreground/30">
                          <span className="text-muted-foreground">Date & Time</span>
                          <span className="font-medium text-right">
                              {selectedDate && format(selectedDate, 'MMM d, yyyy')} <br/>
                              <span className="text-xs text-muted-foreground font-normal">{formatTimeDisplay(selectedTime)}</span>
                          </span>
                      </div>
                      {selectedPricing && (
                        <div className="space-y-2 py-2 border-b border-dashed border-muted-foreground/30">
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Base price</span>
                            <span>${selectedPricing.price}</span>
                          </div>
                          {stylistSurcharge > 0 && (
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Master Stylist Surcharge</span>
                                <span>+${stylistSurcharge}</span>
                            </div>
                          )}
                          {appliedDiscountPercentage > 0 && discountedPrice !== null && (
                            <div className="flex justify-between text-sm text-emerald-600">
                                <span>Promo discount ({appliedDiscountPercentage}%)</span>
                                <span>- ${(adjustedBasePrice - discountedPrice).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-base font-semibold pt-2">
                              <span>Total Service Price</span>
                              <span>${(discountedPrice || effectivePromoPrice || adjustedBasePrice).toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between py-2 text-sm">
                          <span className="text-muted-foreground">Booking Deposit</span>
                          <span className="font-medium">${depositAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-2 text-sm border-b border-muted-foreground/30">
                          <span className="text-muted-foreground">Processing Fee (3.5%)</span>
                          <span className="font-medium">${PROCESSING_FEE.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-4 text-xl font-bold text-primary">
                          <span>Deposit Due Now</span>
                          <span>${TOTAL_DEPOSIT.toFixed(2)}</span>
                   </div>
                  </div>

                  {clientSecret && (
                      <div className="animate-in fade-in zoom-in-95 duration-500">
                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                            <CheckoutForm onSuccess={handlePaymentSuccess} amount={TOTAL_DEPOSIT_CENTS} />
                        </Elements>
                      </div>
                  )}
                  {!clientSecret && (
                     <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/10 rounded-xl border border-dashed">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground font-medium">Preparing secure checkout...</p>
                     </div>
                  )}
                  
                  {paymentError && (
                      <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-lg mt-4 text-center border border-destructive/20 flex flex-col items-center gap-2">
                          <AlertCircle className="w-5 h-5" />
                          {paymentError}
                          <Button variant="outline" size="sm" onClick={initializePayment} className="mt-2 border-destructive/30 hover:bg-destructive/10 text-destructive">Retry Payment</Button>
                      </div>
                  )}
              </CardContent>
          </Card>
      </motion.div>
  );

  const renderStep6 = () => (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="max-w-md mx-auto text-center space-y-8 py-12"
      >
          <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg ring-8 ring-green-50">
              <Check className="w-12 h-12" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-bold font-serif text-foreground">Booking Confirmed!</h2>
            <div className="text-muted-foreground space-y-3 text-lg leading-relaxed max-w-sm mx-auto">
                <p>
                    Thank you for booking with <span className="font-semibold text-foreground">{SALON_INFO.name}</span>.
                </p>
                <p>
                    A confirmation email has been sent to <span className="font-medium text-foreground">{guestDetails.email}</span>.
                </p>
            </div>
          </div>
          
          <Card className="bg-muted/30 border-dashed border-muted-foreground/30 max-w-sm mx-auto">
            <CardContent className="p-6 space-y-3 text-sm text-muted-foreground">
                <p className="flex items-center gap-2 justify-center">
                    <Phone className="w-4 h-4" />
                    To change: {SALON_INFO.bookingPhone}
                </p>
                <p className="flex items-center gap-2 justify-center">
                    <Mail className="w-4 h-4" />
                    Enquiries: {SALON_INFO.inquiryPhone}
                </p>
            </CardContent>
          </Card>

          <div className="pt-4">
              <Button onClick={() => navigate('/')} className="w-full max-w-xs h-12 text-lg shadow-lg hover:shadow-xl transition-all rounded-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                  Return to Home
              </Button>
          </div>
      </motion.div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {renderProgressBar()}
      
      <div className="container mx-auto px-4">
        <AnimatePresence mode="wait">
            {step === 1 && renderStep1()}
            {step === 2 && renderPromoStep()}
            {step === 3 && renderStep2()}
            {step === 4 && renderStep3()}
            {step === 5 && renderStep4()}
            {step === 6 && renderStep5()}
            {step === 7 && renderStep6()}
        </AnimatePresence>

        {step < 7 && (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto mt-12 flex justify-between items-center"
            >
                <Button 
                    variant="ghost" 
                    onClick={handleBack}
                    disabled={step === 1 || loading}
                    className={cn(
                        "gap-2 hover:bg-transparent hover:text-primary transition-colors",
                        step === 1 ? "invisible" : ""
                    )}
                >
                    <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                
                {step < 6 && (
                    <Button 
                        onClick={handleNext} 
                        disabled={loading}
                        className={cn(
                            "gap-2 px-8 h-12 rounded-full shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold text-lg",
                            step === 1 && !policyAgreed ? "opacity-0 pointer-events-none" : "opacity-100"
                        )}
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                {step === 1 ? "Book Now" : "Next Step"} <ChevronRight className="w-5 h-5" />
                            </>
                        )}
                    </Button>
                )}
            </motion.div>
        )}
      </div>

      <AlertDialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <AlertDialogContent className="max-h-[90vh] w-[95vw] sm:max-w-lg flex flex-col border-none shadow-2xl">
          <div className="flex-1 overflow-y-auto px-1">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-serif text-center">Stay in the loop?</AlertDialogTitle>
              <AlertDialogDescription className="text-center text-base mt-2">
                Are you sure you don't want to receive notifications from {SALON_INFO.name} for updates and bonuses?
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="sm:justify-center gap-3 mt-6">
            <AlertDialogCancel onClick={() => {
                setShowConsentDialog(false);
                setStep(5);
            }} className="w-full sm:w-auto border-none hover:bg-muted">No, thanks</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
                setGuestDetails(prev => ({...prev, smsConsent: true}));
                setShowConsentDialog(false);
                setStep(5);
            }} className="w-full sm:w-auto bg-primary hover:bg-primary/90">Yes, I want updates</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showAuthConsentDialog} onOpenChange={setShowAuthConsentDialog}>
        <AlertDialogContent className="max-h-[90vh] w-[95vw] sm:max-w-lg flex flex-col border-none shadow-2xl">
          <div className="flex-1 overflow-y-auto px-1">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-serif text-center">Stay in the loop?</AlertDialogTitle>
              <AlertDialogDescription className="text-center text-base mt-2">
                Are you sure you don't want to receive notifications from {SALON_INFO.name} for updates and bonuses?
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="sm:justify-center gap-3 mt-6">
            <AlertDialogCancel onClick={() => {
              setAuthSmsConsent(false);
              setGuestDetails(prev => ({ ...prev, smsConsent: false }));
              setShowAuthConsentDialog(false);
              userService.updateNotificationConsent(false).catch(() => {});
              authService.getMe().catch(() => {});
            }} className="w-full sm:w-auto border-none hover:bg-muted">No, thanks</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setAuthSmsConsent(true);
              setGuestDetails(prev => ({ ...prev, smsConsent: true }));
              setShowAuthConsentDialog(false);
              userService.updateNotificationConsent(true).catch(() => {});
              authService.getMe().catch(() => {});
            }} className="w-full sm:w-auto bg-primary hover:bg-primary/90">Yes, I want updates</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
