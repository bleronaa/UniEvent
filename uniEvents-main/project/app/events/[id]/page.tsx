"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Users, MapPin, Tag, User, Share2, Clock, Building, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { sq } from "date-fns/locale";
import Image from "next/image"; // Shto importin për Image

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  category: string;
  organizer: {
    _id: string;
    name: string;
  };
  imageUrl?: string;
}

interface Registration {
  status: "pending" | "confirmed" | "cancelled";
}

export default function EventDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, getAuthHeader } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registrationCount, setRegistrationCount] = useState(0);
  const [otherEvents, setOtherEvents] = useState<Event[]>([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<"pending" | "confirmed" | "cancelled" | null>(null);

  async function checkRegistration() {
    if (!user) {
      console.log("No user logged in, skipping registration check");
      return;
    }
    try {
      const res = await fetch(`/api/registrations?eventId=${params.id}`, {
        headers: getAuthHeader(),
      });
      if (!res.ok) {
        const errorData = await res.json();
        console.error("Failed to check registration:", errorData);
        throw new Error(errorData.error || "Failed to check registration status");
      }
      const data: { isRegistered: boolean; registration: Registration | null } = await res.json();
      console.log("Registration check response:", data);
      setIsRegistered(data.isRegistered);
      setRegistrationStatus(data.registration?.status || null);
    } catch (error) {
      console.error("Error checking registration:", error);
      toast.error("Dështoi kontrolli i statusit të regjistrimit");
    }
  }

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${params.id}`);
        if (!res.ok) throw new Error("Failed to fetch event");
        const data = await res.json();
        setEvent(data);
        setRegistrationCount(data.registrationCount || 0);
      } catch (error) {
        toast.error("Dështoi ngarkimi i detajeve të eventit");
        router.push("/");
      }
    }

    async function fetchOtherEvents() {
      try {
        const res = await fetch(`/api/events`);
        if (!res.ok) throw new Error("Failed to fetch events");
        const data: Event[] = await res.json();
        const otherEvents = data.filter((e) => e._id !== params.id);
        const shuffled = otherEvents.sort(() => 0.5 - Math.random());
        const randomSix = shuffled.slice(0, 6);
        setOtherEvents(randomSix);
      } catch (error) {
        console.error("Dështoi ngarkimi i eventeve të tjera:", error);
      }
    }

    if (params.id) {
      fetchEvent();
      fetchOtherEvents();
      if (user) {
        checkRegistration();
      }
    }

    setLoading(false);
  }, [params.id, router, user]);

  async function handleRegister() {
    if (!user) {
      router.push(`/login?redirect=/events/${params.id}`);
      return;
    }

    const authHeader = getAuthHeader();
    if (!authHeader) {
      toast.error("Kërkohet autentikim");
      router.push(`/login?redirect=/events/${params.id}`);
      return;
    }

    setRegistering(true);
    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({ eventId: event?._id }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "Je regjistruar tashmë për këtë event") {
          toast.info("Faleminderit, ju jeni regjistruar më parë!");
          setIsRegistered(true);
          await checkRegistration();
          return;
        }
        throw new Error(data.error || "Failed to register");
      }

      toast.success("Regjistrimi u krye me sukses");
      setIsRegistered(true);
      setRegistrationStatus("pending");
      await checkRegistration();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Dështoi regjistrimi për eventin");
    } finally {
      setRegistering(false);
    }
  }

  async function handleShare() {
    try {
      const shareUrl = `${window.location.origin}${pathname}`;
      await navigator.share({
        title: event?.title,
        text: event?.description,
        url: shareUrl,
      });
    } catch (error) {
      const shareUrl = `${window.location.origin}${pathname}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Linku i eventit u kopjua në clipboard");
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="p-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!event) return null;

  const eventDate = new Date(event.date);
  const isUpcoming = eventDate > new Date();
  const hasCapacity = typeof event.capacity === "number";
  const spotsLeft = hasCapacity ? event.capacity - registrationCount : Infinity;
  const isRegistrationOpen = isUpcoming && (spotsLeft > 0 || !hasCapacity);

  const statusTranslations = {
    pending: "Në pritje",
    confirmed: "Konfirmuar",
    cancelled: "Anuluar",
  };

  return (
    <>
      <div className="container mx-auto py-8 px-4">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-8">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Organizuar nga {event.organizer?.name || "I panjohur"}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Ndaje
                  </Button>
                  {isUpcoming && user && !isRegistered && (
                    <Button onClick={handleRegister} disabled={registering || !isRegistrationOpen}>
                      {registering ? "Duke u regjistruar..." : spotsLeft <= 0 ? "Event plot" : "Regjistrohu tani"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <CardContent className="p-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                {/* Shto seksionin për imazhin e eventit */}
                  <div className="relative w-full h-64 sm:h-80 rounded-lg overflow-hidden">
                        {event.imageUrl ? (
                    <Image
                      src={event.imageUrl}
                      alt={event.title}
                      fill
                      className="object-cover"
                      priority
                    />
               
                ) : (
                  <div className="w-full h-64 sm:h-80 bg-gray-200 flex items-center justify-center rounded-lg">
                    <span className="text-gray-500">Nuk ka imazh</span>
                  </div>
                )}
   </div>
                <div>
                  <h2 className="text-xl font-semibold mb-4">Përshkrimi i eventit</h2>
                  <div className="prose max-w-none">
                    <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Detajet e eventit</h2>
                  <div className="grid gap-6">
                    <div className="flex items-start gap-3">
                      <CalendarDays className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium">Data</p>
                        <p className="text-muted-foreground">
                          {format(eventDate, "d MMMM yyyy", { locale: sq })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium">Koha</p>
                        <p className="text-muted-foreground">{format(eventDate, "H:mm")}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Building className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium">Lokacioni</p>
                        <p className="text-muted-foreground">{event.location}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium">Kapaciteti</p>
                        <p className="text-muted-foreground">
                          {typeof event.capacity === "number"
                            ? `${event.capacity} maksimumi i pjesëmarrësve${
                                spotsLeft > 0 ? ` (${spotsLeft} vende të lira)` : ""
                              }`
                            : "I papërcaktuar"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Tag className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium">Kategoria</p>
                        <p className="text-muted-foreground">{event.category}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle>Ndjek eventin?</CardTitle>
                    <CardDescription>Detaje të rëndësishme për eventin</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-1 rounded-full text-sm ${
                          isUpcoming
                            ? spotsLeft > 0
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {isRegistrationOpen
                          ? "Regjistrimi i hapur"
                          : isUpcoming
                          ? "Plotësisht i rezervuar"
                          : "Eventi ka kaluar"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm px-2 py-1">
                        {typeof event.capacity === "number"
                          ? `${registrationCount}/${event.capacity}`
                          : "I papërcaktuar"}
                      </span>
                    </div>

                    {isUpcoming && (
                      <div className="pt-4">
                        {user ? (
                          isRegistered ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-5 w-5" />
                                <span>
                                  Faleminderit, keni aplikuar!<br></br> Statusi:
                                  {statusTranslations[registrationStatus!] || registrationStatus || "Në pritje"}
                                </span>
                              </div>
                              <Button variant="link" asChild>
                                <Link href="/registrations">Shiko regjistrimet e tua</Link>
                              </Button>
                            </div>
                          ) : (
                            <Button
                              className="w-full"
                              onClick={handleRegister}
                              disabled={registering || !isRegistrationOpen}
                            >
                              {registering
                                ? "Duke u regjistruar..."
                                : spotsLeft <= 0
                                ? "Eventi plot"
                                : "Regjistrohu tani"}
                            </Button>
                          )
                        ) : (
                          <Button
                            className="w-full"
                            onClick={() => router.push(`/login?redirect=/events/${params.id}`)}
                          >
                            Hyr për tu Regjistruar
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        {otherEvents.length > 0 && (
          <div className="mt-12 px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-4">Evente Tjera</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherEvents.map((otherEvent) => (
                <Card key={otherEvent._id} className="p-6">
                  <h3 className="text-lg font-semibold">{otherEvent.title}</h3>
                  <div className="flex items-center gap-2 text-muted-foreground py-2">
                    <CalendarDays className="h-4 w-4" />
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(otherEvent.date), "d MMMM yyyy", { locale: sq })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <p className="text-sm text-muted-foreground">{otherEvent.location}</p>
                  </div>
                  <Button variant="outline" asChild className="mt-4 w-full">
                    <Link href={`/events/${otherEvent._id}`} className="text-primary mt-2 inline-block">
                      Shiko detajet →
                    </Link>
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}