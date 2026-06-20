"use client";

import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";

export function OAuthDivider() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((res) => res.json())
      .then((providers) => setShow(!!providers?.google))
      .catch(() => setShow(false));
  }, []);

  if (!show) return null;

  return (
    <div className="relative my-6">
      <Separator />
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
        或
      </span>
    </div>
  );
}