import { useState, useCallback } from "react";
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
  FileUp,
} from "lucide-react";

interface ProviderResult {
  npi: string;
  name: string;
  specialty?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
}

interface EnrichedProvider {
  npi: string;
  name: string;
  phone?: string;
  email?: string;
  website?: string;
  contactForms?: string[];
  address?: string;
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
  const [enriched, setEnriched] = useState<EnrichedProvider | null>(null);

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

        const data = await api.get<{ results: ProviderResult[] }>(
          `/api/providers/search?${params}`,
        );
        setResults(data.results || []);
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

  const handleEnrich = useCallback(async (npi: string) => {
    setEnriching(npi);
    try {
      const data = await api.get<EnrichedProvider>(
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
          onClick={() => navigate("/records-choice")}
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
                  {provider.specialty && (
                    <CardDescription>{provider.specialty}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {(provider.city || provider.state) && (
                        <>
                          <MapPin className="h-3.5 w-3.5" />
                          <span>
                            {[provider.city, provider.state]
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
                      onClick={() => handleEnrich(provider.npi)}
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

        {/* Enriched contact info */}
        {enriched && (
          <Card className="mt-6 border-primary/30">
            <CardHeader>
              <CardTitle className="text-base">
                Contact: {enriched.name}
              </CardTitle>
              <CardDescription>
                Use this information to request your medical records
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {enriched.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${enriched.phone}`}
                    className="text-primary hover:underline"
                  >
                    {enriched.phone}
                  </a>
                </div>
              )}
              {enriched.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`mailto:${enriched.email}`}
                    className="text-primary hover:underline"
                  >
                    {enriched.email}
                  </a>
                </div>
              )}
              {enriched.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={enriched.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {enriched.website}
                  </a>
                </div>
              )}
              {enriched.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{enriched.address}</span>
                </div>
              )}

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
