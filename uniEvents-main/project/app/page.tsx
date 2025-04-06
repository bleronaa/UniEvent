"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      
      <section id="events" className="wrapper my-8 flex flex-col gap-8 bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center gap-8">
            <div className="flex flex-col md:flex-row justify-between items-center w-full max-w-6xl gap-4">
              <h1 className="text-4xl font-bold text-gray-900">Shfleto të gjitha eventet</h1>
              {user && (
                <div className="flex gap-4">
                  <Button className="bg-primary hover:bg-primary/90" asChild>
                    <Link href="/create">Krijo event</Link>
                  </Button>
                  <select
                    className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
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
            
            <div className="w-full max-w-6xl">
              <input
                type="text"
                placeholder="Kërko event..."
                className="w-full p-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="w-full h-64 flex items-center justify-center">
                <p className="text-lg text-gray-600">Duke ngarkuar eventet...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <Card key={event._id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white">
                      <CardHeader className="space-y-4 pb-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <Badge variant="secondary" className="mb-2">
                              {event.category}
                            </Badge>
                            <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                              <Link href={`/events/${event._id}`}>
                                {event.title}
                              </Link>
                            </CardTitle>
                            <CardDescription className="text-gray-600 line-clamp-2">
                              {event.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <CalendarDays className="h-5 w-5 text-primary" />
                            <span className="text-sm">{new Date(event.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="h-5 w-5 text-primary" />
                            <span className="text-sm">{event.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Users className="h-5 w-5 text-primary" />
                            <span className="text-sm">Kapaciteti: {event.capacity}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Menu className="h-5 w-5 text-primary" />
                            <span className="text-sm">Organizuar nga: {event.organizer.name}</span>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-gray-100">
                          <Button 
                            variant="outline" 
                            className="w-full hover:bg-primary hover:text-white transition-colors"
                            asChild
                          >
                            <Link href={`/events/${event._id}`}>Shiko detajet</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-2 h-64 flex items-center justify-center bg-white rounded-lg">
                    <p className="text-lg text-gray-600">Nuk u gjet asnjë event.</p>
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