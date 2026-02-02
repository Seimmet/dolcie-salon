import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Loader2, Save, Store, Clock, ShieldCheck, Bell, Image as ImageIcon, Ticket, Info } from "lucide-react";
import { toast } from "sonner";
import { settingsService, BusinessHours } from "@/services/settingsService";
import { bookingPolicyService } from "@/services/bookingPolicyService";
import GallerySettings from "./settings/GallerySettings";
import { PromoSettings } from "@/components/admin/PromoSettings";
import { useSettings } from "@/contexts/SettingsContext";

export default function Settings() {
  const { settings, updateSettings: updateContextSettings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [salonName, setSalonName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [depositAmount, setDepositAmount] = useState("50");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [requireApproval, setRequireApproval] = useState(true);
  const [customerModuleEnabled, setCustomerModuleEnabled] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [policyContent, setPolicyContent] = useState("");
  const [courtesyNotice, setCourtesyNotice] = useState("");
  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    monday: { start: "09:00", end: "22:00", isOpen: true },
    tuesday: { start: "09:00", end: "22:00", isOpen: true },
    wednesday: { start: "09:00", end: "22:00", isOpen: true },
    thursday: { start: "09:00", end: "22:00", isOpen: true },
    friday: { start: "09:00", end: "22:00", isOpen: true },
    saturday: { start: "09:00", end: "22:00", isOpen: true },
    sunday: { start: "09:00", end: "22:00", isOpen: true },
  });

  useEffect(() => {
    // Force refresh settings on mount to ensure fresh data
    fetchSettings();
    fetchPolicy();
  }, []); // Remove dependency on 'settings' to avoid infinite loops if context updates weirdly

  useEffect(() => {
      if (settings) {
          populateSettings(settings);
      }
  }, [settings]);

  const populateSettings = (data: any) => {
      setSalonName(data.salonName || "");
      setAddress(data.address || "");
      setPhone(data.phone || "");
      setEmail(data.email || "");
      setTimezone(data.timezone || "UTC");
      setDepositAmount(data.depositAmount?.toString() || "50");
      setNotificationsEnabled(!!data.notificationsEnabled);
      setRequireApproval(data.requireApproval ?? true);
      setCustomerModuleEnabled(data.customerModuleEnabled ?? true);
      setLogoUrl(data.logoUrl);
      setCourtesyNotice(data.courtesyNotice || "");
      if (data.businessHours) {
        setBusinessHours(data.businessHours);
      }
      setLoading(false);
  };

  const fetchPolicy = async () => {
    try {
      const policy = await bookingPolicyService.getPolicy();
      if (policy) {
        setPolicyContent(policy.content);
      }
    } catch (error) {
      console.error("Failed to load policy", error);
    }
  };


  const fetchSettings = async () => {
    try {
      const data = await settingsService.getSettings();
      if (!data) return;
      populateSettings(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await settingsService.uploadLogo(file);
      setLogoUrl(result.logoUrl);
      // Update context as well
      await updateContextSettings({ logoUrl: result.logoUrl });
      toast.success("Logo uploaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload logo");
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const newSettings = {
        salonName,
        address,
        phone,
        email,
        timezone,
        depositAmount: parseFloat(depositAmount),
        notificationsEnabled,
        requireApproval,
        customerModuleEnabled,
        businessHours,
        courtesyNotice,
      };
      
      await updateContextSettings(newSettings);
      
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePolicy = async () => {
    setIsSubmitting(true);
    try {
      await bookingPolicyService.updatePolicy(policyContent);
      toast.success("Policy updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update policy");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDayChange = (day: string, field: string, value: any) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

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

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="container mx-auto p-6 max-w-7xl space-y-8 min-h-[80vh]"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight font-serif text-foreground">Settings</h1>
        <p className="text-muted-foreground text-lg">
          Manage your salon profile, business hours, and system preferences.
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="flex flex-wrap h-auto w-full gap-2 bg-muted/50 p-1 mb-8">
          <TabsTrigger value="general" className="flex-1 min-w-[100px] data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Store className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex-1 min-w-[80px] data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Clock className="w-4 h-4 mr-2" />
            Hours
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex-1 min-w-[90px] data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <CreditCard className="w-4 h-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1 min-w-[110px] data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="policy" className="flex-1 min-w-[80px] data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <ShieldCheck className="w-4 h-4 mr-2" />
            Policy
          </TabsTrigger>
          <TabsTrigger value="courtesy" className="flex-1 min-w-[90px] data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Info className="w-4 h-4 mr-2" />
            Courtesy
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex-1 min-w-[80px] data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <ImageIcon className="w-4 h-4 mr-2" />
            Gallery
          </TabsTrigger>
          <TabsTrigger value="promos" className="flex-1 min-w-[80px] data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Ticket className="w-4 h-4 mr-2" />
            Promos
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <motion.div variants={itemVariants} className="space-y-4">
            <Card className="border-border shadow-card hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="font-serif">Salon Information</CardTitle>
                <CardDescription>
                  Update your salon's public profile and contact details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Salon Logo</Label>
                  <div className="flex items-center gap-4">
                    {logoUrl && (
                      <div className="relative group">
                        <img 
                          src={logoUrl} 
                          alt="Salon Logo" 
                          className="w-20 h-20 object-cover rounded-xl border border-border shadow-sm"
                        />
                        <div className="absolute inset-0 bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                    <Input 
                      type="file" 
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="w-full max-w-xs cursor-pointer file:cursor-pointer file:text-primary file:font-medium"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="name">Salon Name</Label>
                  <Input
                    id="name"
                    value={salonName}
                    onChange={(e) => setSalonName(e.target.value)}
                    className="max-w-md"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="max-w-md"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2 max-w-md">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    placeholder="e.g. Africa/Lagos"
                  />
                  <p className="text-sm text-muted-foreground">
                    Use IANA timezone format (e.g., Africa/Lagos, America/New_York).
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border shadow-card hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="font-serif">Feature Toggles</CardTitle>
                <CardDescription>Enable or disable specific system modules.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
                  <div className="space-y-0.5">
                    <Label className="text-base">Customer Module</Label>
                    <p className="text-sm text-muted-foreground">Enable the customer management dashboard and visibility.</p>
                  </div>
                  <Switch
                    checked={customerModuleEnabled}
                    onCheckedChange={setCustomerModuleEnabled}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300 w-full sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        {/* Business Hours */}
        <TabsContent value="hours" className="space-y-4">
          <motion.div variants={itemVariants}>
            <Card className="border-border shadow-card hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="font-serif">Business Hours</CardTitle>
                <CardDescription>
                  Set your weekly operating hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                    <div key={day} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors gap-4">
                      <div className="flex items-center gap-4 w-32">
                          <Switch 
                              checked={businessHours[day]?.isOpen} 
                              onCheckedChange={(checked) => handleDayChange(day, 'isOpen', checked)}
                          />
                          <span className="font-medium capitalize">{day}</span>
                      </div>
                      
                      {businessHours[day]?.isOpen ? (
                          <div className="flex items-center gap-2">
                              <Input 
                                  type="time" 
                                  value={businessHours[day].start}
                                  onChange={(e) => handleDayChange(day, 'start', e.target.value)}
                                  className="w-32"
                              />
                              <span className="text-muted-foreground">to</span>
                              <Input 
                                  type="time" 
                                  value={businessHours[day].end}
                                  onChange={(e) => handleDayChange(day, 'end', e.target.value)}
                                  className="w-32"
                              />
                          </div>
                      ) : (
                          <span className="text-muted-foreground italic flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                            Closed
                          </span>
                      )}
                    </div>
                  ))}
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300 w-full sm:w-auto" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Hours
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payments" className="space-y-4">
          <motion.div variants={itemVariants}>
            <Card className="border-border shadow-card hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="font-serif">Payment Rules</CardTitle>
                <CardDescription>Manage deposit requirements and payment gateways.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-2 max-w-md">
                  <Label htmlFor="deposit">Booking Scheduling Fee ($)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input
                      id="deposit"
                      type="number"
                      className="pl-7"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Fixed fee charged upon booking (not deducted from service price).
                  </p>
                </div>

                <div className="pt-6 border-t">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-green-50/50 border border-green-100">
                    <div className="space-y-0.5">
                      <Label className="text-base text-green-900">Stripe Integration</Label>
                      <p className="text-sm text-green-700">
                        Accept credit card payments online.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-green-700 bg-green-100/50 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                      <CreditCard className="h-4 w-4" />
                      Connected
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <motion.div variants={itemVariants}>
            <Card className="border-border shadow-card hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="font-serif">Notifications</CardTitle>
                <CardDescription>Manage automated email and SMS alerts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/5 transition-colors">
                  <div className="space-y-0.5">
                    <Label>Enable Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send email and SMS notifications to customers
                    </p>
                  </div>
                  <Switch
                    checked={notificationsEnabled}
                    onCheckedChange={setNotificationsEnabled}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/5 transition-colors">
                  <div className="space-y-0.5">
                    <Label>Require Approval</Label>
                    <p className="text-sm text-muted-foreground">
                      Manually approve notifications before sending
                    </p>
                  </div>
                  <Switch
                    checked={requireApproval}
                    onCheckedChange={setRequireApproval}
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300">
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Policy Settings */}
        <TabsContent value="policy" className="space-y-4">
          <motion.div variants={itemVariants}>
            <Card className="border-border shadow-card hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="font-serif">Booking Policy</CardTitle>
                <CardDescription>Update the booking guidelines displayed to customers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="policy">Policy Content</Label>
                  <Textarea
                    id="policy"
                    value={policyContent}
                    onChange={(e) => setPolicyContent(e.target.value)}
                    className="min-h-[400px] font-mono text-sm"
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSavePolicy} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Policy
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Courtesy Notice Settings */}
        <TabsContent value="courtesy" className="space-y-4">
          <motion.div variants={itemVariants}>
            <Card className="border-border shadow-card hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="font-serif">Courtesy Notice</CardTitle>
                <CardDescription>Update the courtesy notice displayed above the Service selection.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="courtesy">Notice Content</Label>
                  <Textarea
                    id="courtesy"
                    value={courtesyNotice}
                    onChange={(e) => setCourtesyNotice(e.target.value)}
                    className="min-h-[300px]"
                    placeholder="Enter courtesy notice here..."
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Courtesy Notice
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Gallery Settings */}
        <TabsContent value="gallery" className="space-y-4">
          <motion.div variants={itemVariants}>
            <GallerySettings />
          </motion.div>
        </TabsContent>

        {/* Promo Settings */}
        <TabsContent value="promos" className="space-y-4">
          <motion.div variants={itemVariants}>
            <PromoSettings />
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
