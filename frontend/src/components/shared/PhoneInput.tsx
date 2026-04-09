"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { CountryCode } from "libphonenumber-js";
import {
  PHONE_COUNTRIES,
  detectCountryFromE164,
  formatPhoneInput,
  parsePhoneForCountry,
} from "@/lib/phone";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PhoneInputState {
  displayValue: string;
  e164: string | null;
  isValid: boolean;
  error: string | null;
  country: CountryCode;
}

interface PhoneInputProps {
  initialValue?: string | null;
  disabled?: boolean;
  onStateChange?: (state: PhoneInputState) => void;
  className?: string;
}

const DEFAULT_COUNTRY: CountryCode = "PH";

export default function PhoneInput({
  initialValue = null,
  disabled,
  onStateChange,
  className,
}: PhoneInputProps) {
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  const [countryQuery, setCountryQuery] = useState("");
  const [country, setCountry] = useState<CountryCode>(() =>
    detectCountryFromE164(initialValue, DEFAULT_COUNTRY)
  );
  const [displayValue, setDisplayValue] = useState<string>(() => {
    const detectedCountry = detectCountryFromE164(initialValue, DEFAULT_COUNTRY);
    return initialValue ? formatPhoneInput(initialValue, detectedCountry) : "";
  });

  useEffect(() => {
    const parsed = parsePhoneForCountry(displayValue, country);
    onStateChangeRef.current?.({
      displayValue,
      e164: parsed.e164,
      isValid: parsed.isValid,
      error: parsed.error,
      country,
    });
  }, [displayValue, country]);

  const selectedCountry = PHONE_COUNTRIES.find((entry) => entry.code === country);
  const validation = parsePhoneForCountry(displayValue, country);
  const filteredCountries = PHONE_COUNTRIES.filter((entry) => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      entry.name.toLowerCase().includes(q) ||
      entry.code.toLowerCase().includes(q) ||
      entry.dialCode.toLowerCase().includes(q)
    );
  });

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex gap-2">
        <Select
          value={country}
          onValueChange={(value) => {
            const nextCountry = value as CountryCode;
            setCountry(nextCountry);
            setDisplayValue((prev) => formatPhoneInput(prev, nextCountry));
            setCountryQuery("");
          }}
          disabled={disabled}
        >
          <SelectTrigger className="h-10 w-fit shrink-0 rounded-xl bg-muted/50 border-0 px-2.5 text-sm">
            <SelectValue placeholder="Country">
              {selectedCountry ? (
                <span className="inline-flex max-w-full items-center gap-2">
                  {selectedCountry.image ? (
                    <Image
                      src={selectedCountry.image}
                      alt={`${selectedCountry.name} flag`}
                      width={24}
                      height={16}
                      className="h-4 w-6 rounded-[3px] object-cover"
                    />
                  ) : (
                    <span className="text-base leading-none">{selectedCountry.emoji}</span>
                  )}
                  <span className="font-medium">{selectedCountry.code}</span>
                  <span className="text-muted-foreground">{selectedCountry.dialCode}</span>
                </span>
              ) : (
                "Country"
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-80 w-[24rem] p-0">
            <div className="sticky top-0 z-10 border-b border-border/60 bg-popover p-2">
              <input
                value={countryQuery}
                onChange={(event) => setCountryQuery(event.target.value)}
                onKeyDown={(event) => event.stopPropagation()}
                placeholder="Search country, code, or dial code"
                className="h-9 w-full rounded-md border border-border/70 bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {filteredCountries.map((entry) => (
              <SelectItem key={entry.code} value={entry.code} className="py-2">
                <span className="inline-flex w-full min-w-0 items-center gap-2">
                  {entry.image ? (
                    <Image
                      src={entry.image}
                      alt={`${entry.name} flag`}
                      width={24}
                      height={16}
                      className="h-4 w-6 shrink-0 rounded-[3px] object-cover"
                    />
                  ) : (
                    <span className="shrink-0 text-base leading-none">{entry.emoji}</span>
                  )}
                  <span className="min-w-0 flex-1 truncate">{entry.name}</span>
                  <span className="shrink-0 text-muted-foreground">{entry.dialCode}</span>
                </span>
              </SelectItem>
            ))}
            {!filteredCountries.length && (
              <div className="px-3 py-2 text-sm text-muted-foreground">No matching country.</div>
            )}
          </SelectContent>
        </Select>

        <input
          value={displayValue}
          onChange={(event) => {
            const next = formatPhoneInput(event.target.value, country);
            setDisplayValue(next);
          }}
          placeholder={`${selectedCountry?.dialCode ?? "+63"} 917 123 4567`}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          disabled={disabled}
          className="w-full h-10 px-3 rounded-xl bg-muted/50 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      {displayValue && !validation.isValid ? (
        <p className="text-xs text-destructive">{validation.error}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Store format: {validation.e164 ?? "Will be saved in E.164 format"}
        </p>
      )}
    </div>
  );
}
