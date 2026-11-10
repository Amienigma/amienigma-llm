import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useOrbit } from "@/lib/chat/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  useEffect(() => {
    const view = new URLSearchParams(window.location.search).get("view");
    if (view === "imagine" || view === "motion" || view === "discover") {
      useOrbit.getState().setView(view);
    }
  }, []);
  return <AppShell />;
}
