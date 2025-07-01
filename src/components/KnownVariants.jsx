"use client";

import { analyzeVariantWithAPI } from "../utils/genome-api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  BarChart2,
  ExternalLink,
  RefreshCw,
  Search,
  Shield,
  Zap,
} from "lucide-react";

export default function KnownVariants({
  refreshVariants,
  showComparison,
  updateClinvarVariant,
  clinvarVariants,
  isLoadingClinvar,
  clinvarError,
  genomeId,
  gene,
}) {
  const analyzeVariant = async (variant) => {
    let variantDetails = null;
    const position = variant.location
      ? parseInt(variant.location.replaceAll(",", ""))
      : null;

    const refAltMatch = variant.title.match(/(\w)>(\w)/);

    if (refAltMatch && refAltMatch.length === 3) {
      variantDetails = {
        position,
        reference: refAltMatch[1],
        alternative: refAltMatch[2],
      };
    }

    if (
      !variantDetails ||
      !variantDetails.position ||
      !variantDetails.reference ||
      !variantDetails.alternative
    ) {
      return;
    }

    updateClinvarVariant(variant.clinvar_id, {
      ...variant,
      isAnalyzing: true,
    });

    try {
      const data = await analyzeVariantWithAPI({
        position: variantDetails.position,
        alternative: variantDetails.alternative,
        genomeId: genomeId,
        chromosome: gene.chrom,
      });

      const updatedVariant = {
        ...variant,
        isAnalyzing: false,
        evo2Result: data,
      };

      updateClinvarVariant(variant.clinvar_id, updatedVariant);
      showComparison(updatedVariant);
    } catch (error) {
      updateClinvarVariant(variant.clinvar_id, {
        ...variant,
        isAnalyzing: false,
        evo2Error: error instanceof Error ? error.message : "Analysis failed",
      });
    }
  };

  const getLabelColor = (label) => {
    switch (label?.toLowerCase()) {
      case "pathogenic":
        return "bg-red-500/20 text-red-400";
      case "likely pathogenic":
        return "bg-orange-500/20 text-orange-400";
      case "uncertain significance":
        return "bg-yellow-500/20 text-yellow-400";
      case "likely benign":
        return "bg-lime-500/20 text-lime-400";
      case "benign":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-neutral-800 text-neutral-100";
    }
  };

  return (
    <Card className="gap-0 border border-neutral-800 bg-neutral-900 py-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pt-4 pb-2">
        <CardTitle className="text-sm font-normal text-neutral-200">
          Known Variants in Gene from ClinVar
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshVariants}
          disabled={isLoadingClinvar}
          className="h-7 cursor-pointer text-xs text-neutral-300 hover:bg-indigo-400"
        >
          <RefreshCw className="mr-1 h-3 w-3" />
          Refresh
        </Button>
      </CardHeader>

      <CardContent className="pb-4">
        {clinvarError && (
          <div className="mb-4 rounded-md bg-red-900/20 p-3 text-xs text-red-400">
            {clinvarError}
          </div>
        )}

        {isLoadingClinvar ? (
          <div className="flex justify-center py-6">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-300"></div>
          </div>
        ) : clinvarVariants.length > 0 ? (
          <div className="h-96 max-h-96 overflow-y-scroll rounded-md border border-neutral-800">
            <Table>
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="bg-neutral-800">
                  {["Variant", "Type", "Clinical Significance", "Actions"].map(
                    (head) => (
                      <TableHead
                        key={head}
                        className="py-2 text-xs font-medium text-neutral-300"
                      >
                        {head}
                      </TableHead>
                    )
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {clinvarVariants.map((variant) => (
                  <TableRow
                    key={variant.clinvar_id}
                    className="border-b border-neutral-800 hover:bg-neutral-800/30"
                  >
                    <TableCell className="py-2">
                      <div className="text-xs font-medium text-neutral-200">
                        {variant.title}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-neutral-400">
                        <p>Location: {variant.location}</p>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-6 cursor-pointer px-0 text-xs text-indigo-400 hover:text-indigo-300"
                          onClick={() =>
                            window.open(
                              `https://www.ncbi.nlm.nih.gov/clinvar/variation/${variant.clinvar_id}`,
                              "_blank"
                            )
                          }
                        >
                          View in ClinVar
                          <ExternalLink className="ml-1 inline-block h-2 w-2" />
                        </Button>
                      </div>
                    </TableCell>

                    <TableCell className="py-2 text-xs text-neutral-300">
                      {variant.variation_type}
                    </TableCell>

                    <TableCell className="py-2 text-xs">
                      <div
                        className={`w-fit rounded-md px-2 py-1 text-center text-xs font-normal ${getLabelColor(
                          variant.classification
                        )}`}
                      >
                        {variant.classification || "Unknown"}
                      </div>
                      {variant.evo2Result && (
                        <div className="mt-2">
                          <div
                            className={`flex w-fit items-center gap-1 rounded-md px-2 py-1 text-xs ${getLabelColor(
                              variant.evo2Result.prediction
                            )}`}
                          >
                            <Shield className="h-3 w-3" />
                            <span>Evo2: {variant.evo2Result.prediction}</span>
                          </div>
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="py-2 text-xs">
                      <div className="flex flex-col items-end gap-1">
                        {variant.variation_type
                          .toLowerCase()
                          .includes("single nucleotide") ? (
                          !variant.evo2Result ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 cursor-pointer border border-neutral-700 bg-neutral-800 px-3 text-xs text-neutral-200 hover:bg-neutral-700"
                              disabled={variant.isAnalyzing}
                              onClick={() => analyzeVariant(variant)}
                            >
                              {variant.isAnalyzing ? (
                                <>
                                  <span className="mr-1 inline-block h-3 w-3 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-300"></span>
                                  Analyzing...
                                </>
                              ) : (
                                <>
                                  <Zap className="mr-1 inline-block h-3 w-3" />
                                  Analyze with Evo2
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 cursor-pointer border border-neutral-700 bg-neutral-800 px-3 text-xs text-neutral-200 hover:bg-neutral-700"
                              onClick={() => showComparison(variant)}
                            >
                              <BarChart2 className="mr-1 inline-block h-3 w-3" />
                              Compare Results
                            </Button>
                          )
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex h-48 flex-col items-center justify-center text-center text-neutral-500">
            <Search className="mb-4 h-10 w-10 text-neutral-600" />
            <p className="text-sm leading-relaxed">
              No ClinVar variants found for this gene.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
