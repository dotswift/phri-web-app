import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { TrustBadges } from "@/components/shared/TrustBadges";
import { useUpload } from "@/context/UploadContext";
import { toast } from "sonner";
import { FileUp, Upload, X } from "lucide-react";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, state } = useUpload();
  const navigate = useNavigate();

  const handleFile = (f: File) => {
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are accepted");
      return;
    }
    if (f.size > MAX_SIZE) {
      toast.error("File must be under 10MB");
      return;
    }
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    // No PII needed — backend reads from Patient record
    upload(file, { firstName: "", lastName: "", dob: "" });
    navigate("/upload/progress");
  };

  const isUploading = state === "uploading";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold leading-none tracking-tight">
              Upload Medical Records
            </h1>
          </div>
          <CardDescription>
            Upload a PDF of your medical records. We'll extract and organize your
            health data automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop zone */}
          <div
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              dragOver
                ? "border-primary bg-primary/5"
                : file
                  ? "border-primary/50 bg-primary/5"
                  : "border-border hover:border-primary/50"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            aria-label="Drop PDF file here or click to browse"
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />

            {file ? (
              <div className="flex items-center gap-3">
                <FileUp className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">
                  Drop your PDF here or click to browse
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  PDF files up to 10MB
                </p>
              </>
            )}
          </div>

          <Button
            className="w-full"
            disabled={!file || isUploading}
            onClick={handleUpload}
          >
            {isUploading ? "Starting upload..." : "Upload & Process"}
          </Button>
        </CardContent>
      </Card>
      <TrustBadges />
    </div>
  );
}
