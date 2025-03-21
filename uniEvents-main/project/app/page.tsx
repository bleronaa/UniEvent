"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Users, MapPin, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
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

const categories = ["Inxh.Kompjuterike", "Inxh.Mekanike"];

export default function Home() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("Failed to fetch events");
        const data = await res.json();
        setEvents(data);
      } catch (error) {
        toast.error("Failed to load events");
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedCategory === "All" || event.category === selectedCategory)
  );

  return (
    <main className="min-h-screen bg-background">
      <section className="bg-primary-50 py-5 md:py-10">
        <div className="wrapper grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="flex flex-col justify-center gap-8">
            <h1 className="h1-bold">Mikpritës, Ndërlidhës dhe Inspirues</h1>
            <p className="p-regular-20">
              Organizo dhe eksploro aktivitete që lidhin studentët, klubet dhe fakultetet, duke sjellë ide dhe mundësi të reja për të gjithë komunitetin universitar.
            </p>
            <Button size="lg" asChild className="button w-full sm:w-fit">
              <Link href="#events">Zbulo më Shumë</Link>
            </Button>
          </div>
          <Image 
            src="/assets/images/hero.png"
            alt="heroImage"
            width={1000}
            height={1000}
            className="max-h-[70vh] object-contain"
          />
        </div>
      </section>
      
      <section id="events" className="wrapper my-8 flex flex-col gap-8">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center gap-8">
            <div className="flex justify-between items-center w-full max-w-3xl">
              <h1 className="text-3xl font-bold">Të gjitha eventet</h1>
              {user && (
                <div className="flex gap-4">
                  <Button asChild>
                    <Link href="/create">Krijo event</Link>
                  </Button>
                  <select
                    className="border border-gray-300 rounded-md p-2"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="All">Të gjitha kategoritë</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <input
              type="text"
              placeholder="Kërko event..."
              className="w-full max-w-3xl p-2 border border-gray-300 rounded-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {loading ? (
              <p>Duke ngarkuar eventet...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <Card key={event._id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>
                              <Link href={`/events/${event._id}`} className="hover:underline">
                                {event.title}
                              </Link>
                            </CardTitle>
                            <CardDescription>{event.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-6">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CalendarDays className="h-4 w-4" />
                            <span>{new Date(event.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>Kapaciteti: {event.capacity}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Menu className="h-4 w-4" />
                            <span>Kategoria: {event.category}</span>
                          </div>
                        </div>
                        <div className="flex justify-center mt-4">
                          <Button variant="outline" asChild>
                            <Link href={`/events/${event._id}`}>Shiko detajet</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="w-full text-center">
                    <p>Nuk u gjet asnjë event.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer/>
    </main>
  );
}
