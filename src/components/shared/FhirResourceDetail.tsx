import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { CitationBadge } from "./CitationBadge";
import type { TimelineDetail } from "@/types/api";

interface FhirResourceDetailProps {
  detail: TimelineDetail;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function getStructuredFields(resourceType: string, data: any) {
  switch (resourceType) {
    case "Condition":
      return [
        {
          label: "Clinical Status",
          value: data?.clinicalStatus?.coding?.[0]?.code,
        },
        { label: "Condition", value: data?.code?.coding?.[0]?.display },
      ];
    case "Observation":
      return [
        {
          label: "Value",
          value:
            data?.valueQuantity?.value != null
              ? `${data.valueQuantity.value} ${data.valueQuantity.unit ?? ""}`
              : data?.valueCodeableConcept?.coding?.[0]?.display,
        },
        {
          label: "Reference Range",
          value: data?.referenceRange?.[0]?.text,
        },
      ];
    case "Encounter":
      return [
        { label: "Class", value: data?.class?.code },
        {
          label: "Period",
          value:
            data?.period?.start &&
            `${new Date(data.period.start).toLocaleDateString()}${data.period.end ? ` — ${new Date(data.period.end).toLocaleDateString()}` : ""}`,
        },
      ];
    case "Immunization":
      return [
        {
          label: "Vaccine",
          value: data?.vaccineCode?.coding?.[0]?.display,
        },
        { label: "Status", value: data?.status },
      ];
    case "Procedure":
      return [
        { label: "Procedure", value: data?.code?.coding?.[0]?.display },
        {
          label: "Performed",
          value:
            data?.performedDateTime &&
            new Date(data.performedDateTime).toLocaleDateString(),
        },
      ];
    case "DiagnosticReport":
      return [
        { label: "Report", value: data?.code?.coding?.[0]?.display },
        { label: "Conclusion", value: data?.conclusion },
      ];
    default:
      return [];
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function FhirResourceDetail({ detail }: FhirResourceDetailProps) {
  const fields = getStructuredFields(detail.resourceType, detail.data);

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <Badge>{detail.resourceType}</Badge>
          <CitationBadge citation={detail.citation} />
        </div>
        <h3 className="mt-2 text-lg font-medium">
          {detail.displayText ?? "Unknown"}
        </h3>
        {detail.dateRecorded && (
          <p className="text-sm text-muted-foreground">
            {new Date(detail.dateRecorded).toLocaleDateString()}
          </p>
        )}
        {detail.source && (
          <p className="text-sm text-muted-foreground">{detail.source}</p>
        )}
      </div>

      {fields.filter((f) => f.value).length > 0 && (
        <div className="space-y-2">
          {fields
            .filter((f) => f.value)
            .map((field) => (
              <div key={field.label}>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  {field.label}
                </p>
                <p className="text-sm">{field.value}</p>
              </div>
            ))}
        </div>
      )}

      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between">
            View Raw FHIR
            <ChevronDown className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">
            {JSON.stringify(detail.data, null, 2)}
          </pre>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
