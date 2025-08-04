import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCities, type City } from "@/hooks/useCities";
import { cn } from "@/lib/utils";

interface CitySelectorProps {
  value?: City | null;
  onSelect: (city: City | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const CitySelector = ({ 
  value, 
  onSelect, 
  placeholder = "Select city...", 
  className,
  disabled = false 
}: CitySelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: cities = [], isLoading } = useCities(searchQuery);

  const handleSelect = (city: City) => {
    onSelect(city);
    setOpen(false);
    setSearchQuery("");
  };

  const handleClear = () => {
    onSelect(null);
    setSearchQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {value ? (
              <span>{value.city_name}, {value.state_province || value.country}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search cities..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>
            {isLoading ? "Loading cities..." : "No cities found."}
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {value && (
              <CommandItem
                onSelect={handleClear}
                className="text-destructive"
              >
                Clear selection
              </CommandItem>
            )}
            {cities.map((city) => (
              <CommandItem
                key={city.id}
                onSelect={() => handleSelect(city)}
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{city.city_name}</span>
                  <span className="text-sm text-muted-foreground">
                    {city.state_province ? `${city.state_province}, ` : ""}{city.country}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};