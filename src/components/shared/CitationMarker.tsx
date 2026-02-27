import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FHIR_RESOURCE_COLORS } from "@/lib/colors";
import {
  useResourceDetail,
  endpointForResourceType,
} from "@/context/ResourceDetailContext";
import {
  Heart,
  FileText,
  Stethoscope,
  Syringe,
  Eye,
  Activity,
  Pill,
  AlertTriangle,
} from "lucide-react";
import type { ChatCitation } from "@/types/api";

const RESOURCE_ICONS: Record<string, React.ElementType> = {
  Condition: Heart,
  DiagnosticReport: FileText,
  Encounter: Stethoscope,
  Immunization: Syringe,
  Observation: Eye,
  Procedure: Activity,
  MedicationRequest: Pill,
  AllergyIntolerance: AlertTriangle,
};

interface CitationMarkerProps {
  citation: ChatCitation;
}

export function CitationMarker({ citation }: CitationMarkerProps) {
  const { openResourceDetail } = useResourceDetail();
  const color = FHIR_RESOURCE_COLORS[citation.resourceType];
  const Icon = RESOURCE_ICONS[citation.resourceType];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <sup className="ml-0.5 cursor-pointer rounded bg-primary/10 px-1 text-xs font-medium text-primary hover:bg-primary/20">
          [{citation.index}]
        </sup>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 text-sm"
        style={color ? { borderLeft: `4px solid ${color.badge}` } : undefined}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            {Icon && (
              <Icon
                className="h-3.5 w-3.5"
                style={color ? { color: color.badge } : undefined}
              />
            )}
            <p className="font-medium">{citation.resourceType}</p>
          </div>
          {citation.date && (
            <p className="text-muted-foreground">
              {new Date(citation.date).toLocaleDateString()}
            </p>
          )}
          <p className="text-xs italic text-muted-foreground">
            "{citation.excerpt}"
          </p>
          <button
            type="button"
            className="mt-2 block text-xs text-primary hover:underline"
            onClick={() =>
              openResourceDetail(
                citation.fhirResourceId,
                endpointForResourceType(citation.resourceType),
              )
            }
          >
            View Source
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
