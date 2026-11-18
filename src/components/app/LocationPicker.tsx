import { useEffect, useState } from "react";
import { Loader2, LocateFixed, MapPin, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { searchPlaces, type Place } from "@/lib/aqi";
import { placeStore } from "@/lib/store";

export function LocationPicker() {
  const place = placeStore.use();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      searchPlaces(query)
        .then(setResults)
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const choose = (p: Place) => {
    placeStore.set(p);
    setOpen(false);
    setQuery("");
  };

  const locate = () => {
    if (!navigator.geolocation) {
      toast("Location isn't available in this browser — try searching instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        choose({
          name: "My location",
          lat: round(pos.coords.latitude),
          lon: round(pos.coords.longitude),
        });
      },
      () => {
        setLocating(false);
        toast("We couldn't get your location. You can search for your city instead.");
      },
      { timeout: 10000 },
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="max-w-full justify-start"
          aria-label={`Change location, now showing ${place.name}`}
        >
          <MapPin aria-hidden="true" className="text-primary" />
          <span className="truncate">{place.name}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80 rounded-2xl p-3"
        role="dialog"
        aria-label="Choose a location"
      >
        <Button variant="soft" className="w-full" onClick={locate} disabled={locating}>
          {locating ? <Loader2 className="animate-spin" /> : <LocateFixed />}
          Use my current location
        </Button>
        <div className="relative mt-3">
          <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a city…"
            aria-label="Search a city"
            type="search"
            className="rounded-full pl-9"
            autoFocus
          />
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {query.trim().length >= 2 ? `${results.length} places found` : ""}
        </p>
        <ul className="mt-2 max-h-64 overflow-auto" aria-label="Matching places">
          {results.map((r) => (
            <li key={`${r.lat},${r.lon}`}>
              <button
                type="button"
                onClick={() => choose(r)}
                className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted"
              >
                {r.name}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function round(n: number) {
  return Math.round(n * 1000) / 1000;
}
