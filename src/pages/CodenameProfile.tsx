import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";

const CodenameProfile = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-juice-orange/5 to-juice-pink/5 pb-20">
      <div className="container mx-auto px-4 py-6 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This feature has been updated to use anonymous usernames.</p>
            <p>Individual codename profiles are no longer available.</p>
          </CardContent>
        </Card>
      </div>
      <Navigation />
    </div>
  );
};

export default CodenameProfile;