"use client";

import { Button } from "./ui/button";
import { Check, ExternalLink, Shield, X } from "lucide-react";
import {
  getClassificationColorClasses,
  getNucleotideColorClass,
} from "../utils/coloring-utils";

export function VariantComparisonModal({ comparisonVariant, onClose }) {
  if (!comparisonVariant || !comparisonVariant.evo2Result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-neutral-900">
        {/* Modal header */}
        <div className="border-b border-[#3c4f3d]/10 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-neutral-50">
              Variant Analysis Comparison
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 cursor-pointer p-0 text-neutral-50 hover:bg-[#9eeea]/70 hover:text-indigo-400"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Modal content */}
        <div className="p-5">
          <div className="space-y-6">
            <div className="rounded-md border border-[#3c4f3d]/10 bg-neutral-900 p-4">
              <h4 className="mb-3 text-sm font-medium text-neutral-50">
                Variant Information
              </h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="w-28 text-xs text-neutral-50">
                        Position:
                      </span>
                      <span className="text-xs text-neutral-50">
                        {comparisonVariant.location}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-28 text-xs text-neutral-50">
                        Type:
                      </span>
                      <span className="text-xs text-neutral-50">
                        {comparisonVariant.variation_type}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="w-28 text-xs text-neutral-50">
                        Variant:
                      </span>
                      <span className="font-mono text-xs">
                        {(() => {
                          const match =
                            comparisonVariant.title.match(/(\w)>(\w)/);
                          if (match && match.length === 3) {
                            const [, ref, alt] = match;
                            return (
                              <>
                                <span className={getNucleotideColorClass(ref)}>
                                  {ref}
                                </span>
                                <span>{">"}</span>
                                <span className={getNucleotideColorClass(alt)}>
                                  {alt}
                                </span>
                              </>
                            );
                          }
                          return comparisonVariant.title;
                        })()}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-28 text-xs text-neutral-50">
                        ClinVar ID:
                      </span>
                      <a
                        href={`https://www.ncbi.nlm.nih.gov/clinvar/variation/${comparisonVariant.clinvar_id}`}
                        className="text-xs text-indigo-400 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {comparisonVariant.clinvar_id}
                      </a>
                      <ExternalLink className="ml-1 inline-block h-3 w-3 text-indigo-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Variant results */}
            <div>
              <h4 className="mb-3 text-sm font-medium text-neutral-50">
                Analysis Comparison
              </h4>
              <div className="rounded-md border border-[#3c4f3d]/10 bg-neutral-900 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* ClinVar Assesment */}
                  <div className="rounded-md bg-neutral-900 p-4">
                    <h5 className="mb-2 flex items-center gap-2 text-xs font-medium text-neutral-50">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3c4f3d]/10">
                        <span className="h-3 w-3 rounded-full bg-emerald-300"></span>
                      </span>
                      ClinVar Assessment
                    </h5>
                    <div className="mt-2">
                      <div
                        className={`w-fit rounded-md px-2 py-1 text-xs font-normal ${getClassificationColorClasses(
                          comparisonVariant.classification
                        )}`}
                      >
                        {comparisonVariant.classification ||
                          "Unknown significance"}
                      </div>
                    </div>
                  </div>

                  {/* Evo2 Prediction */}
                  <div className="rounded-md bg-neutral-900 p-4">
                    <h5 className="mb-2 flex items-center gap-2 text-xs font-medium text-neutral-50">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3c4f3d]/10">
                        <span className="h-3 w-3 rounded-full bg-orange-300"></span>
                      </span>
                      Evo2 Prediction
                    </h5>
                    <div className="mt-2">
                      <div
                        className={`flex w-fit items-center gap-1 rounded-md px-2 py-1 text-xs font-normal ${getClassificationColorClasses(
                          comparisonVariant.evo2Result.prediction
                        )}`}
                      >
                        <Shield className="h-3 w-3" />
                        {comparisonVariant.evo2Result.prediction}
                      </div>
                    </div>
                    {/* Delta score */}
                    <div className="mt-3">
                      <div className="mb-1 text-xs text-neutral-50">
                        Delta Likelihood Score:
                      </div>
                      <div className="text-sm font-medium text-neutral-50">
                        {comparisonVariant.evo2Result.delta_score.toFixed(6)}
                      </div>
                      <div className="text-xs text-neutral-50/60">
                        {comparisonVariant.evo2Result.delta_score < 0
                          ? "Negative score indicates loss of function"
                          : "Positive score indicated gain/neutral function"}
                      </div>
                    </div>
                    {/* Confidence bar */}
                    <div className="mt-3">
                      <div className="mb-1 text-xs text-neutral-50">
                        Confidence:
                      </div>
                      <div className="mt-1 h-2 w-full rounded-full bg-white">
                        <div
                          className={`h-2 rounded-full ${
                            comparisonVariant.evo2Result.prediction.includes(
                              "pathogenic"
                            )
                              ? "bg-red-600"
                              : "bg-green-600"
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              comparisonVariant.evo2Result
                                .classification_confidence * 100
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <div className="mt-1 text-right text-xs text-neutral-50/60">
                        {Math.round(
                          comparisonVariant.evo2Result
                            .classification_confidence * 100
                        )}
                        %
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assessment Agreement */}
                <div className="mt-4 rounded-md bg-neutral-800 p-3 text-xs leading-relaxed">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full ${
                        comparisonVariant.classification.toLowerCase() ===
                        comparisonVariant.evo2Result.prediction.toLowerCase()
                          ? "bg-green-100"
                          : "bg-yellow-100"
                      }`}
                    >
                      {comparisonVariant.classification.toLowerCase() ===
                      comparisonVariant.evo2Result.prediction.toLowerCase() ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <span className="flex h-3 w-3 items-center justify-center text-yellow-600">
                          <p>!</p>
                        </span>
                      )}
                    </span>
                    <span className="font-medium text-neutral-50">
                      {comparisonVariant.classification.toLowerCase() ===
                      comparisonVariant.evo2Result.prediction.toLowerCase()
                        ? "Evo2 prediction agrees with ClinVar classification"
                        : "Evo2 prediction differs from ClinVar classification"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal footer */}
        <div className="flex justify-end border-t border-[#3c4f3d]/10 bg-neutral-900 p-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="cursor-pointer border-[#3c4f3d]/10 bg-netral-800 text-neutral-50 hover:bg-orange-300"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
