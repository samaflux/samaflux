import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import api from '../utils/api';
import { User, Mail, Phone, MapPin, Globe } from 'lucide-react';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="profile-page">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2" style={{fontFamily: 'DM Sans'}} data-testid="page-heading">Profile</h1>
          <p className="text-muted-foreground" data-testid="page-description">Your account information</p>
        </div>

        <div className="space-y-6">
          <Card className="border shadow-sm" data-testid="profile-card">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl" data-testid="user-name">{user?.first_name} {user?.surname}</CardTitle>
                  <CardDescription data-testid="user-email">{user?.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border shadow-sm" data-testid="personal-info-card">
            <CardHeader>
              <CardTitle data-testid="personal-info-title">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>First Name</span>
                  </div>
                  <p className="font-medium" data-testid="first-name">{user?.first_name}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Surname</span>
                  </div>
                  <p className="font-medium" data-testid="surname">{user?.surname}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </div>
                  <p className="font-medium" data-testid="email">{user?.email}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>Phone Number</span>
                  </div>
                  <p className="font-medium" data-testid="phone">{user?.phone_number}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm" data-testid="address-card">
            <CardHeader>
              <CardTitle data-testid="address-title">Address Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Home Address</span>
                </div>
                <p className="font-medium" data-testid="address">{user?.address}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">City</p>
                  <p className="font-medium" data-testid="city">{user?.city}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">State</p>
                  <p className="font-medium" data-testid="state">{user?.state}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Zip Code</p>
                  <p className="font-medium" data-testid="zip-code">{user?.zip_code}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span>Country</span>
                </div>
                <p className="font-medium" data-testid="country">{user?.country}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;