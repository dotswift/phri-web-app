import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrustBadges } from "@/components/shared/TrustBadges";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Search,
  MapPin,
  Phone,
  Globe,
  Mail,
  Loader2,
  ArrowLeft,
  ArrowRight,
  FileUp,
  FileText,
  Printer,
  Shield,
} from "lucide-react";

// --- Types matching backend response ---

interface NpiAddress {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  phone: string | null;
  fax: string | null;
}

interface NpiSpecialty {
  code: string;
  description: string;
  isPrimary: boolean;
}

interface ProviderResult {
  npi: string;
  name: string;
  specialties: NpiSpecialty[];
  practiceAddress: NpiAddress | null;
  mailingAddress: NpiAddress | null;
}

interface ContactOption {
  type: "email" | "phone" | "fax" | "website" | "contact_form";
  value: string;
  label: string;
  source: string;
  confidence: "high" | "medium" | "low";
}

interface EnrichmentResult {
  npi: string;
  providerName: string;
  contactOptions: ContactOption[];
  _confidence: "high" | "medium" | "low" | "none";
  _sources: string[];
}

// --- Loading messages ---

const ENRICHMENT_MESSAGES = [
  "Finding your doctor's info...",
  "Searching Google Places...",
  "Looking up contact details...",
  "Checking for email addresses...",
  "Scanning their website...",
  "Almost there...",
  "You're closer to owning your healthcare records",
];

const CONTACT_ICONS: Record<ContactOption["type"], typeof Phone> = {
  phone: Phone,
  email: Mail,
  fax: Printer,
  website: Globe,
  contact_form: FileText,
};

const TYPE_LABELS: Record<ContactOption["type"], string> = {
  phone: "Phone",
  email: "Email",
  fax: "Fax",
  website: "Website",
  contact_form: "Contact Form",
};

function ContactLink({ option }: { option: ContactOption }) {
  const Icon = CONTACT_ICONS[option.type];

  let href: string | undefined;
  if (option.type === "phone") href = `tel:${option.value}`;
  else if (option.type === "fax") href = `tel:${option.value}`;
  else if (option.type === "email") href = `mailto:${option.value}`;
  else if (option.type === "website" || option.type === "contact_form") href = option.value;

  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        {href ? (
          <a
            href={href}
            target={option.type === "website" || option.type === "contact_form" ? "_blank" : undefined}
            rel={option.type === "website" || option.type === "contact_form" ? "noopener noreferrer" : undefined}
            className="text-sm font-medium text-foreground hover:underline break-all"
          >
            {option.value}
          </a>
        ) : (
          <span className="text-sm font-medium break-all">{option.value}</span>
        )}
        <p className="text-xs text-muted-foreground mt-0.5">{TYPE_LABELS[option.type]}</p>
      </div>
    </div>
  );
}

function buildNpiFallbackOptions(provider: ProviderResult | null): ContactOption[] {
  if (!provider) return [];
  const options: ContactOption[] = [];
  const addr = provider.practiceAddress || provider.mailingAddress;
  if (addr?.phone) {
    options.push({
      type: "phone",
      value: addr.phone,
      label: "Office phone (NPPES registry)",
      source: "nppes",
      confidence: "medium",
    });
  }
  if (addr?.fax) {
    options.push({
      type: "fax",
      value: addr.fax,
      label: "Office fax (NPPES registry)",
      source: "nppes",
      confidence: "medium",
    });
  }
  return options;
}

export function ProviderSearchPage() {
  const navigate = useNavigate();
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ProviderResult[] | null>(null);
  const [enriching, setEnriching] = useState<string | null>(null);
  const [enriched, setEnriched] = useState<EnrichmentResult | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ProviderResult | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(ENRICHMENT_MESSAGES[0]);
  const messageInterval = useRef<ReturnType<typeof setInterval>>(undefined);

  // Cycle through loading messages while enriching
  useEffect(() => {
    if (enriching) {
      let idx = 0;
      setLoadingMessage(ENRICHMENT_MESSAGES[0]);
      messageInterval.current = setInterval(() => {
        idx = Math.min(idx + 1, ENRICHMENT_MESSAGES.length - 1);
        setLoadingMessage(ENRICHMENT_MESSAGES[idx]);
      }, 2500);
    } else {
      clearInterval(messageInterval.current);
    }
    return () => clearInterval(messageInterval.current);
  }, [enriching]);

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!lastName.trim()) return;
      setSearching(true);
      setResults(null);
      setEnriched(null);
      try {
        const params = new URLSearchParams();
        params.set("last_name", lastName.trim());
        if (firstName.trim()) params.set("first_name", firstName.trim());
        if (city.trim()) params.set("city", city.trim());
        if (stateCode.trim()) params.set("state", stateCode.trim().toUpperCase());
        params.set("type", "individual");
        params.set("limit", "10");

        const data = await api.get<{ count: number; providers: ProviderResult[] }>(
          `/api/providers/search?${params}`,
        );
        setResults(data.providers || []);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Search failed",
        );
      } finally {
        setSearching(false);
      }
    },
    [lastName, firstName, city, stateCode],
  );

  const handleEnrich = useCallback(async (npi: string, provider: ProviderResult) => {
    setEnriching(npi);
    setEnriched(null);
    setSelectedProvider(provider);
    try {
      const data = await api.get<EnrichmentResult>(
        `/api/providers/${npi}/enrich`,
      );
      setEnriched(data);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to get contact info",
      );
    } finally {
      setEnriching(null);
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-start gap-6 p-4 pt-12">
      <div className="w-full max-w-2xl">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Find Your Provider</h1>
          <p className="mt-1 text-muted-foreground">
            Search for your healthcare provider to get their contact information
            for requesting your records.
          </p>
        </div>

        {/* Search form */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="provLastName">Last Name</Label>
                  <Input
                    id="provLastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Smith"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provFirstName">First Name</Label>
                  <Input
                    id="provFirstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="provCity">City</Label>
                  <Input
                    id="provCity"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="San Francisco"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provState">State</Label>
                  <Input
                    id="provState"
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    placeholder="CA"
                    maxLength={2}
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={!lastName.trim() || searching}
              >
                {searching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search Providers
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {results !== null && results.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            No providers found. Try adjusting your search.
          </p>
        )}

        {results && results.length > 0 && (
          <div className="space-y-3">
            {results.map((provider) => (
              <Card key={provider.npi}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{provider.name}</CardTitle>
                  {provider.specialties.length > 0 && (
                    <CardDescription>
                      {provider.specialties.map((s) => s.description).join(", ")}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {provider.practiceAddress && (
                        <>
                          <MapPin className="h-3.5 w-3.5" />
                          <span>
                            {[provider.practiceAddress.city, provider.practiceAddress.state]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={enriching === provider.npi}
                      onClick={() => handleEnrich(provider.npi, provider)}
                    >
                      {enriching === provider.npi ? (
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Phone className="mr-1 h-3.5 w-3.5" />
                      )}
                      Get contact info
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Enrichment loading state */}
        {enriching && (
          <Card className="mt-6 border-primary/30">
            <CardContent className="py-10">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="relative">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <Shield className="absolute inset-0 m-auto h-4 w-4 text-primary/60" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{loadingMessage}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    This may take a few seconds while we search multiple sources
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enriched contact info */}
        {enriched && !enriching && (
          <Card className="mt-6 border-primary/30">
            <CardHeader>
              <CardTitle className="text-base">
                Contact: {enriched.providerName}
              </CardTitle>
              <CardDescription>
                {enriched.contactOptions.length > 0
                  ? "Use this information to request your medical records"
                  : "We couldn't find additional contact info for this provider"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(() => {
                // Build fallback options from NPI data if enrichment returned nothing
                let options = enriched.contactOptions.length > 0
                  ? enriched.contactOptions
                  : buildNpiFallbackOptions(selectedProvider);

                // Filter out contact_form when an email exists
                const hasEmail = options.some((o) => o.type === "email");
                if (hasEmail) {
                  options = options.filter((o) => o.type !== "contact_form");
                }

                return options.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      {options.map((option, i) => (
                        <ContactLink key={`${option.type}-${i}`} option={option} />
                      ))}
                    </div>

                    <div className="mt-4 rounded-md bg-muted p-3 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">
                        How to request your records:
                      </p>
                      <ol className="list-decimal list-inside space-y-1 text-xs">
                        <li>Call or email the provider's medical records department</li>
                        <li>Request a copy of your complete medical records in PDF format</li>
                        <li>Once you receive your records, come back and upload them</li>
                      </ol>
                    </div>

                    <Button
                      className="w-full mt-4"
                      onClick={() => {
                        localStorage.setItem(
                          "phri_saved_provider",
                          JSON.stringify({
                            providerName: enriched!.providerName,
                            npi: enriched!.npi,
                            contactOptions: options.map((o) => ({ type: o.type, value: o.value })),
                            savedAt: new Date().toISOString(),
                          }),
                        );
                        navigate("/home");
                      }}
                    >
                      Continue to your dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    We couldn't find contact information for this provider. Try searching for their office directly.
                  </p>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Bottom actions */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <Button onClick={() => navigate("/upload")} variant="outline">
            <FileUp className="mr-2 h-4 w-4" />
            I have my records — Upload now
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              navigate("/home");
            }}
          >
            Skip for now
          </Button>
        </div>
      </div>

      <TrustBadges />
    </div>
  );
}
