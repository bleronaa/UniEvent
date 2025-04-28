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
  imageUrl?: string;
}

const categories = ["Inxh.Kompjuterike", "Inxh.Mekanike"];

export default function Home() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showMore, setShowMore] = useState(false);

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
      {/* Hero Section */}
      <section className="bg-primary-50 py-6 md:py-12 lg:py-16">
        <div className="wrapper px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-center">
          <div className="flex flex-col justify-center gap-4 sm:gap-6 md:gap-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Mikpritës, Ndërlidhës dhe Inspirues
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-700">
              Organizo dhe eksploro aktivitete që lidhin studentët, klubet dhe fakultetet, duke sjellë ide dhe mundësi të reja për të gjithë komunitetin universitar.
            </p>
            {showMore && (
              <div className="space-y-3 text-sm sm:text-base md:text-lg text-gray-600">
                <p>
                  Me anë të platformës sonë, studentët mund të zbulojnë ngjarje të rëndësishme, të krijojnë lidhje me bashkëmoshatarët dhe të angazhohen në aktivitete që pasurojnë jetën universitare.
                </p>
                <p>
                  Pavarësisht nëse je pjesë e një klubi apo thjesht dëshiron të marrësh pjesë në një event, ne të ndihmojmë të jesh gjithmonë i/e informuar dhe i/e përfshirë.
                </p>
                <p>
                  Bashkohu me komunitetin dhe bëhu pjesë e ndryshimit pozitiv në universitetin tonë!
                </p>
              </div>
            )}
            <Button
              size="lg"
              onClick={() => setShowMore(prev => !prev)}
              className="w-full sm:w-auto px-6 py-3 text-base sm:text-lg"
            >
              {showMore ? "Mbylle" : "Zbulo më Shumë"}
            </Button>
          </div>
          <div className="relative w-full h-64 sm:h-80 md:h-[50vh] lg:h-[60vh]">
            <Image 
              src="/assets/images/hero.png"
              alt="heroImage"
              fill
              className="object-contain md:object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="wrapper py-8 sm:py-12 lg:py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col gap-6 sm:gap-8 lg:gap-12">
            {/* Header and Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                Shfleto të gjitha eventet
              </h1>
              {user && (
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto" asChild>
                    <Link href="/create">Krijo event</Link>
                  </Button>
                  <select
                    className="w-full sm:w-48 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
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

            {/* Search Input */}
            <div className="w-full">
              <input
                type="text"
                placeholder="Kërko event..."
                className="w-full p-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm sm:text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Events Grid */}
            {loading ? (
              <div className="w-full h-64 flex items-center justify-center">
                <p className="text-base sm:text-lg text-gray-600">Duke ngarkuar eventet...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <Card key={event._id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white">
                      <CardHeader className="space-y-4 pb-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <Badge variant="secondary" className="mb-2">
                              {event.category}
                            </Badge>
                            <CardTitle className="text-xl sm:text-2xl group-hover:text-primary transition-colors">
                              <Link href={`/events/${event._id}`}>
                                {event.title}
                              </Link>
                            </CardTitle>
                            <CardDescription className="text-sm sm:text-base text-gray-600 line-clamp-2">
                              {event.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="relative w-full h-48 sm:h-56 rounded-lg overflow-hidden">
                          {event.imageUrl ? (
                            <Image 
                              src={event.imageUrl} 
                              alt={event.title} 
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500">Nuk ka imazh</span>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm sm:text-base">
                          <div className="flex items-center gap-2 text-gray-600">
                            <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            <span>{new Date(event.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            <span>{event.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            <span>Kapaciteti: {event.capacity}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Menu className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            <span>Organizuar nga: {event.organizer.name}</span>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-gray-100">
                          <Button 
                            variant="outline" 
                            className="w-full hover:bg-primary hover:text-white transition-colors text-sm sm:text-base"
                            asChild
                          >
                            <Link href={`/events/${event._id}`}>Shiko detajet</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-1 sm:col-span-2 lg:col-span-3 h-64 flex items-center justify-center bg-white rounded-lg">
                    <p className="text-base sm:text-lg text-gray-600">Nuk u gjet asnjë event.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}