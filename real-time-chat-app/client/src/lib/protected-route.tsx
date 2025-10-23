import { useAuth } from "@/hooks/use-auth";
import { Redirect, RouteProps, Route } from "wouter";

export function ProtectedRoute({ component: Component, ...rest }: RouteProps & { component: React.ComponentType<any> }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return <Route {...rest} component={Component} />;
}
