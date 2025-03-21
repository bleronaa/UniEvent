"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Users, MapPin, Tag, User, Share2, Clock, Building } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";
import { Footer } from "@/components/footer";

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
}

export default function EventDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, getAuthHeader } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registrationCount, setRegistrationCount] = useState(0);
  const [otherEvents, setOtherEvents]=useState<Event[]>([]);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${params.id}`);
        if (!res.ok) throw new Error("Failed to fetch event");
        const data = await res.json();
        setEvent(data);
      } catch (error) {
        toast.error("Failed to load event details");
        router.push("/");
      } finally {
        setLoading(false);
      }
    }

    async function fetchOtherEvents (){
      try{
        const res= await fetch(`/api/events`);
        if(!res.ok) throw new Error ("Failed to fetch events");
        const data:Event[]=await res.json();

        //Exclude the current event
        setOtherEvents(data.filter((e) => e._id !== params.id));
      } catch(error){
        console.error("Failed to load other events:", error)
      }
    }

    if (params.id) {
      fetchEvent();
      fetchOtherEvents();
    }
  }, [params.id, router]);

  async function handleRegister() {
    if (!user) {
      router.push("/login");
      return;
    }
  
    const authHeader = getAuthHeader();
    console.log("Auth Header:", authHeader);
  
    if (!authHeader) {
      toast.error("Authentication required");
      router.push("/login");
      return;
    }
  
    setRegistering(true);
    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,  // Make sure this contains { Authorization: 'Bearer <token>' }
        },
        body: JSON.stringify({ eventId: event?._id }),
      });
  
      console.log("Response Status:", res.status);
      const data = await res.json();
      console.log("Response Data:", data);
  
      if (!res.ok) {
        throw new Error(data.error || "Failed to register");
      }
      
      toast.success("Successfully registered for event");
      router.push("/registrations");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to register for event");
    } finally {
      setRegistering(false);
    }
  }
  

  async function handleShare() {
    try {
      await navigator.share({
        title: event?.title,
        text: event?.description,
        url: window.location.href,
      });
    } catch (error) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Event link copied to clipboard");
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
  const spotsLeft = event.capacity - registrationCount;

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
                  <span>Organizuar nga {event.organizer.name}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Ndaje
                </Button>
                {isUpcoming && user && (
                  <Button onClick={handleRegister} disabled={registering || spotsLeft <= 0}>
                    {registering ? "Registering..." : spotsLeft <= 0 ? "Event Full" : "Register Now"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <div>
                <h2 className="text-xl font-semibold mb-4">Rreth këtij eventi</h2>
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
                        {format(eventDate, "EEEE, MMMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-medium">Koha</p>
                      <p className="text-muted-foreground">
                        {format(eventDate, "h:mm a")}
                      </p>
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
                        {event.capacity} maksimumi i pjesëmarrësve
                        {spotsLeft > 0 && ` (${spotsLeft} vende të lira)`}
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
                  <CardTitle>Informacion i shpejtë</CardTitle>
                  <CardDescription>Detaje të rëndësishme për eventin</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Gjendja</span>
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      isUpcoming 
                        ? spotsLeft > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {isUpcoming 
                        ? spotsLeft > 0 
                          ? 'Regjistrimi i hapur' 
                          : 'Plotësisht i rezervuar'
                        : 'Event i shkuar'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Kapaciteti</span>
                    <span className="text-sm">
                      {registrationCount}/{event.capacity}
                    </span>
                  </div>

                  {isUpcoming && (
                    <div className="pt-4">
                      {user ? (
                        <Button 
                          className="w-full" 
                          onClick={handleRegister}
                          disabled={registering || spotsLeft <= 0}
                        >
                          {registering 
                            ? "Duke u regjitruar..." 
                            : spotsLeft <= 0 
                              ? "Eventi plot" 
                              : "Regjistrohu tani"}
                        </Button>
                      ) : (
                        <Button className="w-full" onClick={() => router.push('/login')}>
                          Login to Register
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

      {/* other event Section */}
      {otherEvents.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Evente Tjera</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherEvents.map((otherEvent)=>(
                <Card key={otherEvent._id} className="p-4">
                <h3 className="text-lg font-semibold">{otherEvent.title}</h3>
                <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <p className="text-sm text-muted-foreground">
                  {format(new Date(otherEvent.date), "MMMM d, yyyy")}
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
    <Footer/>
</>
  );
}