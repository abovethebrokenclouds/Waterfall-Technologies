import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="gradient-text text-6xl font-bold">404</div>
      <p className="mt-3 text-muted-foreground">That page isn't part of the Command Center.</p>
      <Button asChild className="mt-6">
        <Link to="/">Back to Dashboard</Link>
      </Button>
    </div>
  );
}
