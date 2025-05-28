"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users, MapPin, Menu, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Footer } from "@/components/footer";
import { format } from 'date-fns';
import { sq } from 'date-fns/locale';

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number | null;
  category: string;
  organizer: {
    _id: string;
    name: string;
  };
  imageUrl?: string;
}

const categories = ["Inxh.Kompjuterike", "Inxh.Mekanike"];
const EVENTS_PER_PAGE = 6; // Maksimumi 6 evente për faqe

export default function Home() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  // State for carousel
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Array of image URLs for the carousel
  const carouselImages = [
    "/uploads/umib.jpg",
    "/uploads/event5.jpg",
    "/uploads/event6.jpg",
    "/uploads/event4.jpg",
  ];

  // Handle carousel navigation
  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? carouselImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === carouselImages.length - 1 ? 0 : prev + 1));
  };

  // Auto-advance carousel every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev === carouselImages.length - 1 ? 0 : prev + 1));
    }, 4000); // 4000ms = 4 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [carouselImages.length]);

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

  // Llogarit numrin total të faqeve
  const totalPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE);

  // Merr eventet për faqen aktuale
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * EVENTS_PER_PAGE,
    currentPage * EVENTS_PER_PAGE
  );

  // Funksion për të ndryshuar faqen
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Lëviz te seksioni i eventeve në vend të kryes të faqes
      const eventsSection = document.getElementById("events");
      if (eventsSection) {
        eventsSection.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

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
              Organizo dhe eksploro aktivitete që lidhin studentët, klubet dhe fakultetet, duke sjellë ide dhe mundësi të reja për të gjithë komunitetin universitar.<br></br>
              Këtu ke mundësinë të zbulosh evente interesante, të njoftohesh me studentë të tjerë dhe të përfshihesh në aktivitete që e bëjnë jetën universitare më të gjallë dhe argëtuese.
              Bashkohu me komunitetin tonë dhe jepi vetes mundësinë të bësh diçka të bukur gjatë kohës në universitet!
            </p>
            <Button
              size="lg"
              className="w-full sm:w-auto px-6 py-3 text-base sm:text-lg"
            >
              <Link href="#events">Shiko Eventet</Link>
            </Button>
          </div>
          <div className="relative w-full h-64 sm:h-80 md:h-[50vh] lg:h-[60vh]">
            {/* Carousel Container */}
            <div className="relative w-full h-full overflow-hidden rounded-lg">
              {carouselImages.map((src, index) => (
                <div
                  key={src}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    index === currentImageIndex ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <Image
                    src={src}
                    alt={`Hero Image ${index + 1}`}
                    fill
                    className="object-contain md:object-cover"
                    priority={index === 0} // Priority for the first image
                  />
                </div>
              ))}
              {/* Navigation Arrows */}
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                aria-label="Previous Image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                aria-label="Next Image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="wrapper py-8 sm:py-12 lg:pt-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col gap-6 sm:gap-8 lg:gap-12">
            {/* Header and Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                Shfleto eventet
              </h1>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {user && (
                  <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto" asChild>
                    <Link href="/create">Krijo event</Link>
                  </Button>
                )}
                <select
                  className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="All">Të gjitha kategoritë</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
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
              <>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {paginatedEvents.length > 0 ? (
    paginatedEvents.map((event) => (
      <Link
        key={event._id}
        href={`/events/${event._id}`}
        className="group block"
      >
        <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white cursor-pointer flex flex-col h-full">
          <CardHeader className="space-y-4 pb-4 flex-none">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <Badge variant="secondary" className="mb-2">
                  {event.category}
                </Badge>
                <CardTitle className="text-xl sm:text-2xl group-hover:text-primary transition-colors">
                  {event.title}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 line-clamp-2 max-h-12">
                  {event.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 flex flex-col flex-grow justify-between">
            <div className="space-y-4">
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
                  <span>{format(new Date(event.date), 'd MMMM yyyy', { locale: sq })}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <span>{event.location}</span>
                </div>
                {event.capacity !== null && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <span>{event.capacity}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Menu className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <span>{event.organizer?.name || "I panjohur"}</span>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                className="w-full hover:bg-primary hover:text-white transition-colors text-sm sm:text-base"
              >
                Shiko detajet
              </Button>
            </div>
          </CardContent>
        </Card>
      </Link>
    ))
  ) : (
    <div className="col-span-1 sm:col-span-2 lg:col-span-3 h-64 flex items-center justify-center bg-white rounded-lg">
      <p className="text-base sm:text-lg text-gray-600">Nuk u gjet asnjë event.</p>
    </div>
  )}
</div>
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}