/**
 * CompareVersions Component
 * 
 * Displays a side-by-side comparison of two prompt versions with highlighted differences.
 * Shows additions in green, deletions in red, and unchanged content in neutral colors.
 */

import { useState, useEffect } from "react";
import { diffWords, diffLines } from "diff";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type PromptVersion } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Calendar } from "lucide-react";

interface CompareVersionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: PromptVersion[];
  currentVersion: number;
}

interface DiffSegment {
  value: string;
  added?: boolean;
  removed?: boolean;
}

/**
 * Renders a text diff with highlighted additions and deletions
 */
function DiffViewer({ oldText, newText, multiline = false }: { oldText: string; newText: string; multiline?: boolean }) {
  const diff = multiline ? diffLines(oldText, newText) : diffWords(oldText, newText);
  
  return (
    <div className={`${multiline ? 'font-mono text-sm' : 'text-sm'} whitespace-pre-wrap`}>
      {diff.map((part: DiffSegment, index: number) => {
        if (part.added) {
          return (
            <span key={index} className="bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-200">
              {part.value}
            </span>
          );
        }
        if (part.removed) {
          return (
            <span key={index} className="bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-200 line-through">
              {part.value}
            </span>
          );
        }
        return <span key={index}>{part.value}</span>;
      })}
    </div>
  );
}

/**
 * Renders a side-by-side comparison of a single field
 */
function FieldComparison({
  label,
  oldValue,
  newValue,
  multiline = false,
}: {
  label: string;
  oldValue: string;
  newValue: string;
  multiline?: boolean;
}) {
  const hasChanged = oldValue !== newValue;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-semibold">{label}</Label>
        {hasChanged && (
          <Badge variant="outline" className="text-xs">Changed</Badge>
        )}
      </div>
      
      {hasChanged ? (
        multiline ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Old Version */}
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-medium">Before</div>
              <div className="bg-muted/50 p-3 rounded-md border">
                <pre className="font-mono text-sm whitespace-pre-wrap text-foreground/80">
                  {oldValue}
                </pre>
              </div>
            </div>
            
            {/* New Version */}
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-medium">After</div>
              <div className="bg-muted/50 p-3 rounded-md border">
                <pre className="font-mono text-sm whitespace-pre-wrap text-foreground/80">
                  {newValue}
                </pre>
              </div>
            </div>
            
            {/* Diff View */}
            <div className="md:col-span-2 space-y-1">
              <div className="text-xs text-muted-foreground font-medium">Changes</div>
              <div className="bg-muted/50 p-3 rounded-md border">
                <DiffViewer oldText={oldValue} newText={newValue} multiline={multiline} />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-muted/50 p-3 rounded-md border">
            <DiffViewer oldText={oldValue} newText={newValue} />
          </div>
        )
      ) : (
        <div className="bg-muted/50 p-3 rounded-md border">
          <p className="text-sm text-muted-foreground">No changes</p>
          <p className="text-sm">{oldValue}</p>
        </div>
      )}
    </div>
  );
}

export function CompareVersions({ open, onOpenChange, versions, currentVersion }: CompareVersionsProps) {
  const [fromVersion, setFromVersion] = useState<number | null>(null);
  const [toVersion, setToVersion] = useState<number | null>(null);
  
  // Initialize with sensible defaults when opening
  useEffect(() => {
    if (open && versions.length >= 2) {
      if (!fromVersion || !toVersion) {
        // Default: compare current version with previous version
        const sorted = [...versions].sort((a, b) => b.version - a.version);
        setToVersion(sorted[0].version); // Latest
        setFromVersion(sorted[1]?.version || sorted[0].version); // Previous or same
      }
    }
  }, [open, versions, fromVersion, toVersion]);
  
  const fromVersionData = versions.find(v => v.version === fromVersion);
  const toVersionData = versions.find(v => v.version === toVersion);
  
  const hasComparison = fromVersionData && toVersionData;
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[90vw] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Compare Versions</SheetTitle>
          <SheetDescription>
            View the differences between two versions of this prompt
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Version Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            {/* From Version */}
            <div className="space-y-2">
              <Label>From Version</Label>
              <Select
                value={fromVersion?.toString()}
                onValueChange={(val) => setFromVersion(parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((v) => (
                    <SelectItem key={v.version} value={v.version.toString()}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">v{v.version}</span>
                        {v.version === currentVersion && (
                          <Badge variant="default" className="text-xs">Current</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          ({formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Arrow Icon */}
            <div className="hidden sm:flex items-center justify-center pb-2">
              <ArrowRight className="w-6 h-6 text-muted-foreground" />
            </div>
            
            {/* To Version */}
            <div className="space-y-2">
              <Label>To Version</Label>
              <Select
                value={toVersion?.toString()}
                onValueChange={(val) => setToVersion(parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((v) => (
                    <SelectItem key={v.version} value={v.version.toString()}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">v{v.version}</span>
                        {v.version === currentVersion && (
                          <Badge variant="default" className="text-xs">Current</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          ({formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Separator />
          
          {/* Comparison View */}
          {hasComparison ? (
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-6 pr-4">
                {/* Version Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">From:</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">v{fromVersionData.version}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDistanceToNow(new Date(fromVersionData.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">To:</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">v{toVersionData.version}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDistanceToNow(new Date(toVersionData.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Field Comparisons */}
                <FieldComparison
                  label="Title"
                  oldValue={fromVersionData.title}
                  newValue={toVersionData.title}
                />
                
                <Separator />
                
                <FieldComparison
                  label="Prompt Content"
                  oldValue={fromVersionData.prompt}
                  newValue={toVersionData.prompt}
                  multiline
                />
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldComparison
                    label="Domain"
                    oldValue={fromVersionData.domain}
                    newValue={toVersionData.domain}
                  />
                  
                  <FieldComparison
                    label="Task"
                    oldValue={fromVersionData.task}
                    newValue={toVersionData.task}
                  />
                </div>
                
                <Separator />
                
                <FieldComparison
                  label="Model Used"
                  oldValue={fromVersionData.modelUsed || "Not specified"}
                  newValue={toVersionData.modelUsed || "Not specified"}
                />
                
                <Separator />
                
                <FieldComparison
                  label="Notes"
                  oldValue={fromVersionData.notes || "No notes"}
                  newValue={toVersionData.notes || "No notes"}
                  multiline
                />
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Select two versions to compare</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
