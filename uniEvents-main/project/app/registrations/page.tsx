"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { Footer } from "@/components/footer";

interface Registration {
  _id: string;
  user: string;
  event: {
    _id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    capacity: number;
    category: string;
  };
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
}

export default function RegistrationsPage() {
  const router = useRouter();
  const { user, getAuthHeader } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    async function fetchRegistrations() {
      try {
        const authHeader = getAuthHeader();
        if (!authHeader) {
          router.push("/login");
          return;
        }

        const res = await fetch("/api/registrations", {
          headers: authHeader,
        });

        if (!res.ok) {
          throw new Error("Failed to fetch registrations");
        }

        const data = await res.json();
        setRegistrations(data);
      } catch (error) {
        console.error("Failed to load registrations", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRegistrations();
  }, [user, router]);

  async function registerForEvent(eventId: string) {
    try {
      const authHeader = getAuthHeader();
      if (!authHeader) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({ eventId }),
      });

      const data = await res.json();

      if (res.status === 400 && data.error === "You have already applied for this event.") {
        console.log("Error: You have already applied for this event.");
        setPopupMessage("You have already applied for this event. Please wait until the admin checks your application.");
        setShowPopup(true);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setRegistrations([...registrations, data]);
    } catch (error: any) {
      console.error(error.message);
    }
  }

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">My Registrations</h1>
          <div className="grid gap-4">
            {[1, 2, 3].map((n) => (
              <Card key={n}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-full"></div>
                      <div className="h-4 bg-muted rounded w-full"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Registrations</h1>
        <div className="grid gap-4">
          {registrations.map((registration) => {
            const eventDate = new Date(registration.event.date);
            const isPast = eventDate < new Date();

            return (
              <Card key={registration._id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold">{registration.event.title}</h2>
                      <p className="text-muted-foreground line-clamp-2">{registration.event.description}</p>

                      <div className="grid gap-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarDays className="h-4 w-4" />
                          <span>{format(eventDate, "EEEE, MMMM d, yyyy 'at' h:mm a")}</span>
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{registration.event.location}</span>
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{`${registration.event.capacity - 1} spots left`}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Button
                        onClick={() => registerForEvent(registration.event._id)}
                        disabled={isPast || registration.status !== "pending"}
                      >
                        {registration.status === "pending" ? "Apply Again" : registration.status}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
    <Footer/>
    </>
  );
}
