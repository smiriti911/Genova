import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ExternalLink } from "lucide-react";

export function GeneInformation({ gene, geneDetail, geneBounds }) {
  return (
    <Card className="gap-0 border border-neutral-800 bg-neutral-900 py-0 text-white shadow-sm">
      <CardHeader className="pt-4 pb-2">
        <CardTitle className="text-sm font-normal text-neutral-300">
          Gene Information
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex">
              <span className="w-28 text-xs text-neutral-400">Symbol:</span>
              <span className="text-xs">{gene.symbol}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-xs text-neutral-400">Name:</span>
              <span className="text-xs">{gene.name}</span>
            </div>
            {gene.description && gene.description !== gene.name && (
              <div className="flex">
                <span className="w-28 text-xs text-neutral-400">Description:</span>
                <span className="text-xs">{gene.description}</span>
              </div>
            )}
            <div className="flex">
              <span className="w-28 text-xs text-neutral-400">Chromosome:</span>
              <span className="text-xs">{gene.chrom}</span>
            </div>
            {geneBounds && (
              <div className="flex">
                <span className="w-28 text-xs text-neutral-400">Position:</span>
                <span className="text-xs">
                  {Math.min(geneBounds.min, geneBounds.max).toLocaleString()} -{" "}
                  {Math.max(geneBounds.min, geneBounds.max).toLocaleString()} (
                  {Math.abs(geneBounds.max - geneBounds.min + 1).toLocaleString()} bp)
                  {geneDetail?.genomicinfo?.[0]?.strand === "-" && " (reverse strand)"}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {gene.gene_id && (
              <div className="flex">
                <span className="w-28 text-xs text-neutral-400">Gene ID:</span>
                <span className="text-xs">
                  <a
                    href={`https://www.ncbi.nlm.nih.gov/gene/${gene.gene_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-400 hover:underline"
                  >
                    {gene.gene_id}
                    <ExternalLink className="ml-1 inline-block h-3 w-3" />
                  </a>
                </span>
              </div>
            )}

            {geneDetail?.organism && (
              <div className="flex">
                <span className="w-28 text-xs text-neutral-400">Organism:</span>
                <span className="text-xs">
                  {geneDetail.organism.scientificname}
                  {geneDetail.organism.commonname &&
                    ` (${geneDetail.organism.commonname})`}
                </span>
              </div>
            )}

            {geneDetail?.summary && (
              <div className="mt-4">
                <h3 className="mb-2 text-xs font-medium text-neutral-200">Summary:</h3>
                <p className="text-xs leading-relaxed text-neutral-300">
                  {geneDetail.summary}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
