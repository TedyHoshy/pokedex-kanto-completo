import { createFileRoute } from "@tanstack/react-router";
import { PokedexApp } from "@/components/pokedex/pokedex-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <PokedexApp />;
}
