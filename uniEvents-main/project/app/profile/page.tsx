"use client";

import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCircle, Mail, BookOpen, Building2, PencilLine, Trash2, Calendar, Users, X } from "lucide-react";
import { useState, useEffect } from "react";

// Tipi për eventet
interface Event {
  _id: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  capacity?: number;
  category: string;
  image?: string;
  status: string;
}

// Tipi për regjistrimet
interface Registration {
  _id: string;
  user: {
    name: string;
    email: string;
  };
  status: string;
}

export default function ProfilePage() {
  const { user, updateUser, getAuthHeader } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<{ [key: string]: Registration[] }>({}); // Regjistrimet sipas eventId
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null); // Event i zgjedhur për regjistrimet
  const [editingEventId, setEditingEventId] = useState<string | null>(null); // Event i zgjedhur për editim
  const [editFormData, setEditFormData] = useState<Partial<Event>>({}); // Të dhënat e formularit të editimit

  // Merr eventet e krijuara nga përdoruesi
  useEffect(() => {
    const fetchEvents = async () => {
      if (user?.id) {
        try {
          const response = await fetch(`/api/events/eventsuser?user-id=${user.id}`, {
            headers: getAuthHeader(),
          });
          if (response.ok) {
            const data = await response.json();
            setEvents(data);
          } else {
            console.error("Nuk u morën dot eventet");
          }
        } catch (error) {
          console.error("Gabim gjatë marrjes së eventeve:", error);
        }
      }
    };

    if (user?.id) {
      fetchEvents();
    }
  }, [user?.id, getAuthHeader]);

  // Fshi një event
  const handleDelete = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/eventsuser?eventId=${eventId}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });

      if (response.ok) {
        setEvents(events.filter((event) => event._id !== eventId));
      } else {
        console.error("Nuk u fshi dot eventi");
      }
    } catch (error) {
      console.error("Gabim gjatë fshirjes së eventit:", error);
    }
  };

  // Merr regjistrimet për një event
  const fetchRegistrations = async (eventId: string) => {
    try {
      const response = await fetch(`/api/registrations?eventId=${eventId}`, {
        headers: getAuthHeader(),
      });
      if (response.ok) {
        const data = await response.json();
        setRegistrations((prev) => ({
          ...prev,
          [eventId]: Array.isArray(data) ? data : [],
        }));
        setSelectedEventId(eventId);
      } else {
        console.error("Nuk u morën dot regjistrimet");
      }
    } catch (error) {
      console.error("Gabim gjatë marrjes së regjistrimeve:", error);
    }
  };

  // Ndërro gjendjen e shfaqjes së regjistrimeve
  const toggleRegistrations = (eventId: string) => {
    if (selectedEventId === eventId) {
      setSelectedEventId(null); // Mbyll seksionin
    } else {
      fetchRegistrations(eventId); // Hap seksionin dhe merr regjistrimet
    }
  };

  // Fillo editimin e një eventi
  const startEditing = (event: Event) => {
    setEditingEventId(event._id);
    setEditFormData({
      title: event.title,
      description: event.description,
      date: new Date(event.date).toISOString().slice(0, 16), // Formato për datetime-local
      location: event.location,
      capacity: event.capacity,
      category: event.category,
      image: event.image,
      status: event.status,
    });
  };

  // Anulo editimin
  const cancelEditing = () => {
    setEditingEventId(null);
    setEditFormData({});
  };

  // Përditëso eventin
  const handleEditSubmit = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/eventsuser?eventId=${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        const updatedEvent = await response.json();
        setEvents(events.map((event) => (event._id === eventId ? updatedEvent : event)));
        setEditingEventId(null);
        setEditFormData({});
      } else {
        console.error("Nuk u përditësua dot eventi");
      }
    } catch (error) {
      console.error("Gabim gjatë përditësimit të eventit:", error);
    }
  };

  // Përditëso profilin
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser);
        setIsEditing(false);
      } else {
        console.error("Nuk u përditësua dot profili");
      }
    } catch (error) {
      console.error("Gabim gjatë përditësimit të profilit:", error);
    }
  };

  // Formato datën
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("sq-AL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Përcakto ngjyrën e badge sipas rolit
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

  // Përcakto ngjyrën e badge për statusin e regjistrimit
  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // Nëse përdoruesi nuk është i kyçur
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Ju lutem kyçuni për të parë profilin tuaj.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Profili</CardTitle>
              <CardDescription>Menaxhoni cilësimet e llogarisë tuaj</CardDescription>
            </div>
            <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Emri</Label>
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
                <Button type="submit">Ruaj ndryshimet</Button>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Anulo
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
                  <span className="text-sm">Roli: {user.role}</span>
                </div>
                {(user.role === "computer_engineering" || user.role === "mechanical_engineering") && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Departamenti:{" "}
                      {user.role
                        .replace("_", " ")
                        .split(" ")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ")}
                    </span>
                  </div>
                )}
              </div>
              <Button variant="outline" className="mt-4" onClick={() => setIsEditing(true)}>
                <PencilLine className="h-4 w-4 mr-2" />
                Edito Profilin
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Eventet tuaja të krijuara
            </CardTitle>
            <CardDescription>Menaxhoni eventet tuaja</CardDescription>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Asnjë event nuk është krijuar deri tani.</p>
                <Button className="mt-4" variant="outline">
                  Krijo eventin tënd të parë
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <Card key={event._id} className="bg-muted/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-semibold text-lg">{event.title}</h4>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <time className="text-sm">{formatDate(event.date)}</time>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleRegistrations(event._id)}
                          >
                            {selectedEventId === event._id ? (
                              <>
                                <X className="h-4 w-4 mr-2" />
                                Mbyll
                              </>
                            ) : (
                              <>
                                <Users className="h-4 w-4 mr-2" />
                                Shiko Regjistrimet
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditing(event)}
                          >
                            <PencilLine className="h-4 w-4 mr-2" />
                            Edito
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(event._id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Fshi
                          </Button>
                        </div>
                      </div>
                      {editingEventId === event._id && (
                        <div className="mt-4 p-4 border rounded-lg bg-white animate-in fade-in duration-300">
                          <h5 className="font-semibold text-lg mb-4">Edito Eventin</h5>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleEditSubmit(event._id);
                            }}
                            className="space-y-4"
                          >
                            <div className="space-y-2">
                              <Label htmlFor={`title-${event._id}`}>Titulli</Label>
                              <Input
                                id={`title-${event._id}`}
                                value={editFormData.title || ""}
                                onChange={(e) =>
                                  setEditFormData({ ...editFormData, title: e.target.value })
                                }
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`description-${event._id}`}>Përshkrimi</Label>
                              <Input
                                id={`description-${event._id}`}
                                value={editFormData.description || ""}
                                onChange={(e) =>
                                  setEditFormData({ ...editFormData, description: e.target.value })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`date-${event._id}`}>Data dhe Ora</Label>
                              <Input
                                id={`date-${event._id}`}
                                type="datetime-local"
                                value={editFormData.date || ""}
                                onChange={(e) =>
                                  setEditFormData({ ...editFormData, date: e.target.value })
                                }
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`location-${event._id}`}>Vendndodhja</Label>
                              <Input
                                id={`location-${event._id}`}
                                value={editFormData.location || ""}
                                onChange={(e) =>
                                  setEditFormData({ ...editFormData, location: e.target.value })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`capacity-${event._id}`}>Kapaciteti</Label>
                              <Input
                                id={`capacity-${event._id}`}
                                type="number"
                                value={editFormData.capacity || ""}
                                onChange={(e) =>
                                  setEditFormData({
                                    ...editFormData,
                                    capacity: parseInt(e.target.value),
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`category-${event._id}`}>Kategoria</Label>
                              <Select
                                value={editFormData.category || ""}
                                onValueChange={(value) =>
                                  setEditFormData({ ...editFormData, category: value })
                                }
                              >
                                <SelectTrigger id={`category-${event._id}`}>
                                  <SelectValue placeholder="Zgjidh kategorinë" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Inxh.Kompjuterike">
                                    Inxhinieri Kompjuterike
                                  </SelectItem>
                                  <SelectItem value="Inxh.Mekanike">Inxhinieri Mekanike</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`image-${event._id}`}>URL e Imazhit</Label>
                              <Input
                                id={`image-${event._id}`}
                                value={editFormData.image || ""}
                                onChange={(e) =>
                                  setEditFormData({ ...editFormData, image: e.target.value })
                                }
                              />
                            </div>
                          
                            <div className="flex gap-2">
                              <Button type="submit">Ruaj ndryshimet</Button>
                              <Button type="button" variant="outline" onClick={cancelEditing}>
                                Anulo
                              </Button>
                            </div>
                          </form>
                        </div>
                      )}
                      {selectedEventId === event._id && registrations[event._id] && (
                        <div className="mt-4 animate-in fade-in duration-300">
                          <h5 className="font-semibold text-lg mb-2">Regjistrimet për këtë event</h5>
                          {registrations[event._id].length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                              Asnjë regjistrim për këtë event.
                            </p>
                          ) : (
                            <div className="border rounded-lg overflow-hidden">
                              <div className="grid grid-cols-3 gap-4 bg-gray-50 p-3 font-semibold text-sm text-gray-600">
                                <span>Emri</span>
                                <span>Email</span>
                                <span>Statusi</span>
                              </div>
                              {registrations[event._id].map((reg) => (
                                <div
                                  key={reg._id}
                                  className="grid grid-cols-3 gap-4 p-3 border-t items-center"
                                >
                                  <span className="text-sm">{reg.user.name}</span>
                                  <span className="text-sm">{reg.user.email}</span>
                                  <Badge
                                    className={`${getStatusBadgeColor(
                                      reg.status
                                    )} px-2 py-1 text-xs inline-flex items-center justify-center`}
                                  >
                                    {reg.status === "pending"
                                      ? "Në pritje"
                                      : reg.status === "confirmed"
                                      ? "Konfirmuar"
                                      : "Anuluar"}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}