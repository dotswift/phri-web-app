import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-medium">{user?.email ?? "User"}</p>
            <p className="text-sm text-muted-foreground">Account</p>
          </div>
        </CardContent>
      </Card>

      <Link to="/profile/settings">
        <Card className="transition-colors hover:bg-accent">
          <CardContent className="flex items-center gap-4 p-4">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Settings</p>
              <p className="text-sm text-muted-foreground">
                Manage your account, connections, and preferences
              </p>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
