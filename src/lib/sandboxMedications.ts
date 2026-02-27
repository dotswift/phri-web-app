import type {
  MedicationsResponse,
  MedicationInsightsResponse,
} from "@/types/api";

// Demo patient profile: ~58-year-old with Type 2 diabetes, hypertension,
// hyperlipidemia, hypothyroidism, GERD, and mild depression. Managed across
// a PCP (Dr. Chen), cardiologist (Dr. Park), psychiatrist (Dr. Santos), and
// urgent care (Dr. Nguyen). Several medications have been dose-escalated over
// time, and cross-provider duplicates exist for Metformin.

export const DEMO_MEDICATIONS: MedicationsResponse = {
  active: [
    {
      id: "demo-med-2",
      name: "Metformin 1000mg",
      status: "active",
      dosage: "Take 1 tablet twice daily with meals",
      dateRecorded: "2025-06-20",
      source: "Dr. Sarah Chen — Metro Internal Medicine",
      citation: {
        resourceType: "MedicationRequest",
        resourceId: "demo-med-2",
        excerpt:
          "Metformin hydrochloride 1000 mg oral tablet [RxNorm: 861004]",
        date: "2025-06-20",
        source: "Dr. Sarah Chen — Metro Internal Medicine",
      },
    },
    {
      id: "demo-med-3",
      name: "Metformin 1000mg",
      status: "active",
      dosage: "Take 1 tablet twice daily with meals",
      dateRecorded: "2025-07-10",
      source: "Dr. James Park — Lakeside Cardiology",
      citation: {
        resourceType: "MedicationRequest",
        resourceId: "demo-med-3",
        excerpt:
          "Metformin hydrochloride 1000 mg oral tablet [RxNorm: 861004]",
        date: "2025-07-10",
        source: "Dr. James Park — Lakeside Cardiology",
      },
    },
    {
      id: "demo-med-5",
      name: "Lisinopril 10mg",
      status: "active",
      dosage: "Take 1 tablet daily",
      dateRecorded: "2025-10-02",
      source: "Dr. Sarah Chen — Metro Internal Medicine",
      citation: {
        resourceType: "MedicationRequest",
        resourceId: "demo-med-5",
        excerpt: "Lisinopril 10 mg oral tablet [RxNorm: 314076]",
        date: "2025-10-02",
        source: "Dr. Sarah Chen — Metro Internal Medicine",
      },
    },
    {
      id: "demo-med-7",
      name: "Atorvastatin 40mg",
      status: "active",
      dosage: "Take 1 tablet at bedtime",
      dateRecorded: "2025-09-15",
      source: "Dr. James Park — Lakeside Cardiology",
      citation: {
        resourceType: "MedicationRequest",
        resourceId: "demo-med-7",
        excerpt: "Atorvastatin calcium 40 mg oral tablet [RxNorm: 617311]",
        date: "2025-09-15",
        source: "Dr. James Park — Lakeside Cardiology",
      },
    },
    {
      id: "demo-med-8",
      name: "Omeprazole 20mg",
      status: "active",
      dosage: "Take 1 capsule daily before breakfast",
      dateRecorded: "2025-01-10",
      source: "Dr. Sarah Chen — Metro Internal Medicine",
      citation: {
        resourceType: "MedicationRequest",
        resourceId: "demo-med-8",
        excerpt:
          "Omeprazole 20 mg delayed release oral capsule [RxNorm: 198053]",
        date: "2025-01-10",
        source: "Dr. Sarah Chen — Metro Internal Medicine",
      },
    },
    {
      id: "demo-med-9",
      name: "Amlodipine 5mg",
      status: "active",
      dosage: "Take 1 tablet daily",
      dateRecorded: "2025-03-18",
      source: "Dr. James Park — Lakeside Cardiology",
      citation: {
        resourceType: "MedicationRequest",
        resourceId: "demo-med-9",
        excerpt: "Amlodipine besylate 5 mg oral tablet [RxNorm: 197361]",
        date: "2025-03-18",
        source: "Dr. James Park — Lakeside Cardiology",
      },
    },
    {
      id: "demo-med-10",
      name: "Levothyroxine 50mcg",
      status: "active",
      dosage: "Take 1 tablet daily on empty stomach, 30 min before breakfast",
      dateRecorded: "2024-11-05",
      source: "Dr. Sarah Chen — Metro Internal Medicine",
      citation: {
        resourceType: "MedicationRequest",
        resourceId: "demo-med-10",
        excerpt:
          "Levothyroxine sodium 0.05 mg oral tablet [RxNorm: 966224]",
        date: "2024-11-05",
        source: "Dr. Sarah Chen — Metro Internal Medicine",
      },
    },
    {
      id: "demo-med-11",
      name: "Sertraline 50mg",
      status: "active",
      dosage: "Take 1 tablet daily in the morning",
      dateRecorded: "2025-02-14",
      source: "Dr. Maria Santos — Behavioral Health Associates",
      citation: {
        resourceType: "MedicationRequest",
        resourceId: "demo-med-11",
        excerpt: "Sertraline hydrochloride 50 mg oral tablet [RxNorm: 312940]",
        date: "2025-02-14",
        source: "Dr. Maria Santos — Behavioral Health Associates",
      },
    },
    {
      id: "demo-med-12",
      name: "Aspirin 81mg",
      status: "active",
      dosage: "Take 1 tablet daily",
      dateRecorded: "2024-09-01",
      source: "Dr. James Park — Lakeside Cardiology",
      citation: {
        resourceType: "MedicationRequest",
        resourceId: "demo-med-12",
        excerpt:
          "Aspirin 81 mg delayed release oral tablet [RxNorm: 243670]",
        date: "2024-09-01",
        source: "Dr. James Park — Lakeside Cardiology",
      },
    },
  ],
  other: [
    {
      id: "demo-med-1",
      name: "Metformin 500mg",
      status: "stopped",
      dosage: "Take 1 tablet twice daily with meals",
      dateRecorded: "2024-06-15",
      source: "Dr. Sarah Chen — Metro Internal Medicine",
      citation: {
        resourceType: "MedicationRequest",
        resourceId: "demo-med-1",
        excerpt:
          "Metformin hydrochloride 500 mg oral tablet [RxNorm: 860975]",
        date: "2024-06-15",
        source: "Dr. Sarah Chen — Metro Internal Medicine",
      },
    },
    {
      id: "demo-med-4",
      name: "Lisinopril 5mg",
      status: "stopped",
      dosage: "Take 1 tablet daily",
      dateRecorded: "2024-04-12",
      source: "Dr. Sarah Chen — Metro Internal Medicine",
      citation: {
        resourceType: "MedicationRequest",
        resourceId: "demo-med-4",
        excerpt: "Lisinopril 5 mg oral tablet [RxNorm: 314077]",
        date: "2024-04-12",
        source: "Dr. Sarah Chen — Metro Internal Medicine",
      },
    },
    {
      id: "demo-med-6",
      name: "Atorvastatin 20mg",
      status: "stopped",
      dosage: "Take 1 tablet at bedtime",
      dateRecorded: "2024-08-20",
      source: "Dr. James Park — Lakeside Cardiology",
      citation: {
        resourceType: "MedicationRequest",
        resourceId: "demo-med-6",
        excerpt: "Atorvastatin calcium 20 mg oral tablet [RxNorm: 259255]",
        date: "2024-08-20",
        source: "Dr. James Park — Lakeside Cardiology",
      },
    },
    {
      id: "demo-med-13",
      name: "Amoxicillin 500mg",
      status: "completed",
      dosage: "Take 1 capsule three times daily for 10 days",
      dateRecorded: "2025-07-05",
      source: "Dr. Lisa Nguyen — Urgent Care Associates",
      citation: {
        resourceType: "MedicationRequest",
        resourceId: "demo-med-13",
        excerpt: "Amoxicillin 500 mg oral capsule [RxNorm: 308182]",
        date: "2025-07-05",
        source: "Dr. Lisa Nguyen — Urgent Care Associates",
      },
    },
    {
      id: "demo-med-14",
      name: "Ibuprofen 400mg",
      status: "stopped",
      dosage: "Take 1 tablet every 6 hours as needed",
      dateRecorded: "2025-06-18",
      source: "Dr. Lisa Nguyen — Urgent Care Associates",
      citation: {
        resourceType: "MedicationRequest",
        resourceId: "demo-med-14",
        excerpt: "Ibuprofen 400 mg oral tablet [RxNorm: 197806]",
        date: "2025-06-18",
        source: "Dr. Lisa Nguyen — Urgent Care Associates",
      },
    },
    {
      id: "demo-med-15",
      name: "Prednisone 10mg",
      status: "completed",
      dosage:
        "Take as directed: 4 tablets days 1-3, 3 tablets days 4-6, 2 tablets days 7-9, 1 tablet days 10-12",
      dateRecorded: "2025-04-22",
      source: "Dr. Lisa Nguyen — Urgent Care Associates",
      citation: {
        resourceType: "MedicationRequest",
        resourceId: "demo-med-15",
        excerpt: "Prednisone 10 mg oral tablet [RxNorm: 312615]",
        date: "2025-04-22",
        source: "Dr. Lisa Nguyen — Urgent Care Associates",
      },
    },
  ],
};

export const DEMO_MEDICATION_INSIGHTS: MedicationInsightsResponse = {
  insights: {
    duplicates: [
      {
        drug: "Metformin 1000mg",
        occurrences: [
          {
            id: "demo-med-2",
            date: "2025-06-20",
            source: "Dr. Sarah Chen — Metro Internal Medicine",
            dosage: "Take 1 tablet twice daily with meals",
            citation: {
              resourceType: "MedicationRequest",
              resourceId: "demo-med-2",
              excerpt:
                "Metformin hydrochloride 1000 mg oral tablet [RxNorm: 861004]",
              date: "2025-06-20",
              source: "Dr. Sarah Chen — Metro Internal Medicine",
            },
          },
          {
            id: "demo-med-3",
            date: "2025-07-10",
            source: "Dr. James Park — Lakeside Cardiology",
            dosage: "Take 1 tablet twice daily with meals",
            citation: {
              resourceType: "MedicationRequest",
              resourceId: "demo-med-3",
              excerpt:
                "Metformin hydrochloride 1000 mg oral tablet [RxNorm: 861004]",
              date: "2025-07-10",
              source: "Dr. James Park — Lakeside Cardiology",
            },
          },
        ],
      },
      {
        drug: "Lisinopril",
        occurrences: [
          {
            id: "demo-med-4",
            date: "2024-04-12",
            source: "Dr. Sarah Chen — Metro Internal Medicine",
            dosage: "5mg — Take 1 tablet daily",
            citation: {
              resourceType: "MedicationRequest",
              resourceId: "demo-med-4",
              excerpt: "Lisinopril 5 mg oral tablet [RxNorm: 314077]",
              date: "2024-04-12",
              source: "Dr. Sarah Chen — Metro Internal Medicine",
            },
          },
          {
            id: "demo-med-5",
            date: "2025-10-02",
            source: "Dr. Sarah Chen — Metro Internal Medicine",
            dosage: "10mg — Take 1 tablet daily",
            citation: {
              resourceType: "MedicationRequest",
              resourceId: "demo-med-5",
              excerpt: "Lisinopril 10 mg oral tablet [RxNorm: 314076]",
              date: "2025-10-02",
              source: "Dr. Sarah Chen — Metro Internal Medicine",
            },
          },
        ],
      },
      {
        drug: "Atorvastatin",
        occurrences: [
          {
            id: "demo-med-6",
            date: "2024-08-20",
            source: "Dr. James Park — Lakeside Cardiology",
            dosage: "20mg — Take 1 tablet at bedtime",
            citation: {
              resourceType: "MedicationRequest",
              resourceId: "demo-med-6",
              excerpt:
                "Atorvastatin calcium 20 mg oral tablet [RxNorm: 259255]",
              date: "2024-08-20",
              source: "Dr. James Park — Lakeside Cardiology",
            },
          },
          {
            id: "demo-med-7",
            date: "2025-09-15",
            source: "Dr. James Park — Lakeside Cardiology",
            dosage: "40mg — Take 1 tablet at bedtime",
            citation: {
              resourceType: "MedicationRequest",
              resourceId: "demo-med-7",
              excerpt:
                "Atorvastatin calcium 40 mg oral tablet [RxNorm: 617311]",
              date: "2025-09-15",
              source: "Dr. James Park — Lakeside Cardiology",
            },
          },
        ],
      },
    ],
    changes: [
      {
        drug: "Metformin",
        history: [
          {
            id: "demo-med-1",
            date: "2024-06-15",
            dosage: "500mg — Take 1 tablet twice daily with meals",
            status: "active",
            citation: {
              resourceType: "MedicationRequest",
              resourceId: "demo-med-1",
              excerpt:
                "Metformin hydrochloride 500 mg oral tablet [RxNorm: 860975]",
              date: "2024-06-15",
              source: "Dr. Sarah Chen — Metro Internal Medicine",
            },
          },
          {
            id: "demo-med-1",
            date: "2025-06-18",
            dosage: "500mg — Take 1 tablet twice daily with meals",
            status: "stopped",
            citation: {
              resourceType: "MedicationRequest",
              resourceId: "demo-med-1",
              excerpt:
                "Metformin hydrochloride 500 mg oral tablet [RxNorm: 860975]",
              date: "2025-06-18",
              source: "Dr. Sarah Chen — Metro Internal Medicine",
            },
          },
          {
            id: "demo-med-2",
            date: "2025-06-20",
            dosage: "1000mg — Take 1 tablet twice daily with meals",
            status: "active",
            citation: {
              resourceType: "MedicationRequest",
              resourceId: "demo-med-2",
              excerpt:
                "Metformin hydrochloride 1000 mg oral tablet [RxNorm: 861004]",
              date: "2025-06-20",
              source: "Dr. Sarah Chen — Metro Internal Medicine",
            },
          },
        ],
      },
      {
        drug: "Lisinopril",
        history: [
          {
            id: "demo-med-4",
            date: "2024-04-12",
            dosage: "5mg — Take 1 tablet daily",
            status: "active",
            citation: {
              resourceType: "MedicationRequest",
              resourceId: "demo-med-4",
              excerpt: "Lisinopril 5 mg oral tablet [RxNorm: 314077]",
              date: "2024-04-12",
              source: "Dr. Sarah Chen — Metro Internal Medicine",
            },
          },
          {
            id: "demo-med-4",
            date: "2025-09-30",
            dosage: "5mg — Take 1 tablet daily",
            status: "stopped",
            citation: {
              resourceType: "MedicationRequest",
              resourceId: "demo-med-4",
              excerpt: "Lisinopril 5 mg oral tablet [RxNorm: 314077]",
              date: "2025-09-30",
              source: "Dr. Sarah Chen — Metro Internal Medicine",
            },
          },
          {
            id: "demo-med-5",
            date: "2025-10-02",
            dosage: "10mg — Take 1 tablet daily",
            status: "active",
            citation: {
              resourceType: "MedicationRequest",
              resourceId: "demo-med-5",
              excerpt: "Lisinopril 10 mg oral tablet [RxNorm: 314076]",
              date: "2025-10-02",
              source: "Dr. Sarah Chen — Metro Internal Medicine",
            },
          },
        ],
      },
      {
        drug: "Atorvastatin",
        history: [
          {
            id: "demo-med-6",
            date: "2024-08-20",
            dosage: "20mg — Take 1 tablet at bedtime",
            status: "active",
            citation: {
              resourceType: "MedicationRequest",
              resourceId: "demo-med-6",
              excerpt:
                "Atorvastatin calcium 20 mg oral tablet [RxNorm: 259255]",
              date: "2024-08-20",
              source: "Dr. James Park — Lakeside Cardiology",
            },
          },
          {
            id: "demo-med-6",
            date: "2025-09-12",
            dosage: "20mg — Take 1 tablet at bedtime",
            status: "stopped",
            citation: {
              resourceType: "MedicationRequest",
              resourceId: "demo-med-6",
              excerpt:
                "Atorvastatin calcium 20 mg oral tablet [RxNorm: 259255]",
              date: "2025-09-12",
              source: "Dr. James Park — Lakeside Cardiology",
            },
          },
          {
            id: "demo-med-7",
            date: "2025-09-15",
            dosage: "40mg — Take 1 tablet at bedtime",
            status: "active",
            citation: {
              resourceType: "MedicationRequest",
              resourceId: "demo-med-7",
              excerpt:
                "Atorvastatin calcium 40 mg oral tablet [RxNorm: 617311]",
              date: "2025-09-15",
              source: "Dr. James Park — Lakeside Cardiology",
            },
          },
        ],
      },
    ],
    summary: {
      totalUnique: 11,
      totalActive: 8,
      totalStopped: 3,
    },
  },
  methodology: {
    description:
      "Medication insights are generated by analyzing MedicationRequest FHIR resources across all connected provider sources. Medications are matched by RxNorm code and normalized drug name to detect duplicates and track dosage changes over time.",
    steps: [
      "Extract all MedicationRequest resources from consolidated patient record",
      "Normalize medication names and map to RxNorm codes where available",
      "Group medications by normalized drug identity to detect duplicates across sources",
      "Order grouped records chronologically to identify dosage and status changes",
      "Flag potential interactions and summarize active medication counts",
    ],
    limitations: [
      "Duplicate detection relies on RxNorm codes; medications without codes may not be matched",
      "Dosage change tracking requires structured sig data; free-text instructions may be missed",
      "Over-the-counter medications and supplements are only included if recorded by a provider",
    ],
  },
};
