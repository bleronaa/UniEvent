"use client";

import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCircle, Mail, BookOpen, Building2, PencilLine, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

// Definimi i tipit për eventet
interface Event {
  _id: string;
  title: string;
  date: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [events, setEvents] = useState<Event[]>([]); // Përdorimi i tipit të events

  useEffect(() => {
    const fetchEvents = async () => {
      if (user?.id) {
        try {
            const response = await fetch(`/api/events/eventsuser?user-id=${user.id}`);
          if (response.ok) {
            const data = await response.json();
            setEvents(data);
          } else {
            console.error("Failed to fetch events");
          }
        } catch (error) {
          console.error("Error fetching events:", error);
        }
      }
    };

    if (user?.id) {
      fetchEvents();
    }
  }, [user?.id]);

  const isEventPast = (eventDate: string): boolean => {
    const eventDateObj = new Date(eventDate);
    const currentDate = new Date();
    return eventDateObj < currentDate;
  };

  const handleDelete = async (eventId: string) => {
    // Funksioni për fshirjen e eventeve
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setEvents(events.filter(event => event._id !== eventId)); // Përshtatja e listës pas fshirjes
      } else {
        console.error("Failed to delete event");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Please log in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-red-100 text-red-800",
      staff: "bg-purple-100 text-purple-800",
      student: "bg-blue-100 text-blue-800",
      computer_engineering: "bg-green-100 text-green-800",
      mechanical_engineering: "bg-orange-100 text-orange-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </div>
            <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Save Changes</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <UserCircle className="h-16 w-16 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-medium">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              
              <div className="grid gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Email: {user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Role: {user.role}</span>
                </div>
                {(user.role === "computer_engineering" || user.role === "mechanical_engineering") && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Department: {user.role.replace("_", " ").split(" ").map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(" ")}</span>
                  </div>
                )}
              </div>

              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsEditing(true)}
              >
                <PencilLine className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Created Events</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p>No events created yet.</p>
            ) : (
              <ul>
                {events.map((event) => (
                  <li key={event._id} className="py-2">
                    <h4 className="font-medium">{event.title}</h4>
                    <p className="text-sm text-muted-foreground">{event.date}</p>

                     {/* Kontrollo nëse eventi ka kaluar */}
                  {isEventPast(event.date) ? (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        disabled 
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={() => handleDelete(event._id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => console.log(`Editing event ${event._id}`)}
                    >
                      <PencilLine className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
