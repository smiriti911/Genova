"use client";

import {
  fetchGeneDetails,
  fetchGeneSequence as apiFetchGeneSequence,
  fetchClinvarVariants as apiFetchClinvarVariants,
} from "../utils/genome-api";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { GeneInformation } from "./GeneInformation";
import { GeneSequence } from "./GeneSequence";
import KnownVariants from "./KnownVariants";
import { VariantComparisonModal } from "./VariantComparisonModal";
import VariantAnalysis from "./VariantAnalysis";


export default function GeneViewer({ gene, genomeId, onClose }) {
  const [geneSequence, setGeneSequence] = useState("");
  const [geneDetail, setGeneDetail] = useState(null);
  const [geneBounds, setGeneBounds] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [startPosition, setStartPosition] = useState("");
  const [endPosition, setEndPosition] = useState("");
  const [isLoadingSequence, setIsLoadingSequence] = useState(false);

  const [clinvarVariants, setClinvarVariants] = useState([]);
  const [isLoadingClinvar, setIsLoadingClinvar] = useState(false);
  const [clinvarError, setClinvarError] = useState(null);

  const [actualRange, setActualRange] = useState(null);
  const [comparisonVariant, setComparisonVariant] = useState(null);

  const [activeSequencePosition, setActiveSequencePosition] = useState(null);
  const [activeReferenceNucleotide, setActiveReferenceNucleotide] = useState(null);

  const variantAnalysisRef = useRef(null);

  const updateClinvarVariant = (clinvar_id, updateVariant) => {
    setClinvarVariants((currentVariants) =>
      currentVariants.map((v) => (v.clinvar_id == clinvar_id ? updateVariant : v))
    );
  };

  const fetchGeneSequence = useCallback(async (start, end) => {
    try {
      setIsLoadingSequence(true);
      setError(null);

      const {
        sequence,
        actualRange: fetchedRange,
        error: apiError,
      } = await apiFetchGeneSequence(gene.chrom, start, end, genomeId);

      setGeneSequence(sequence);
      setActualRange(fetchedRange);

      if (apiError) {
        setError(apiError);
      }
    } catch (err) {
      setError("Failed to load sequence data");
    } finally {
      setIsLoadingSequence(false);
    }
  }, [gene.chrom, genomeId]);

  useEffect(() => {
    const initializeGeneData = async () => {
      setIsLoading(true);

      if (!gene.gene_id) {
        setError("Gene ID is missing, cannot fetch details");
        setIsLoading(false);
        return;
      }

      try {
        const {
          geneDetails: fetchedDetail,
          geneBounds: fetchedGeneBounds,
          initialRange: fetchedRange,
        } = await fetchGeneDetails(gene.gene_id);

        setGeneDetail(fetchedDetail);
        setGeneBounds(fetchedGeneBounds);

        if (fetchedRange) {
          setStartPosition(String(fetchedRange.start));
          setEndPosition(String(fetchedRange.end));
          await fetchGeneSequence(fetchedRange.start, fetchedRange.end);
        }
      } catch {
        setError("Failed to load gene information. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    initializeGeneData();
  }, [gene, genomeId]);

  const handleSequenceClick = useCallback((position, nucleotide) => {
    setActiveSequencePosition(position);
    setActiveReferenceNucleotide(nucleotide);
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (variantAnalysisRef.current) {
      variantAnalysisRef.current.focusAlternativeInput();
    }
  }, []);

  const handleLoadSequence = useCallback(() => {
    const start = parseInt(startPosition);
    const end = parseInt(endPosition);
    let validationError = null;

    if (isNaN(start) || isNaN(end)) {
      validationError = "Please enter valid start and end positions";
    } else if (start >= end) {
      validationError = "Start position must be less than end position";
    } else if (geneBounds) {
      const minBound = Math.min(geneBounds.min, geneBounds.max);
      const maxBound = Math.max(geneBounds.min, geneBounds.max);
      if (start < minBound) {
        validationError = `Start position (${start.toLocaleString()}) is below the minimum value (${minBound.toLocaleString()})`;
      } else if (end > maxBound) {
        validationError = `End position (${end.toLocaleString()}) exceeds the maximum value (${maxBound.toLocaleString()})`;
      }

      if (end - start > 10000) {
        validationError = `Selected range exceeds maximum view range of 10,000 bp.`;
      }
    }

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    fetchGeneSequence(start, end);
  }, [startPosition, endPosition, fetchGeneSequence, geneBounds]);

  const fetchClinvarVariants = async () => {
    if (!gene.chrom || !geneBounds) return;

    setIsLoadingClinvar(true);
    setClinvarError(null);

    try {
      const variants = await apiFetchClinvarVariants(gene.chrom, geneBounds, genomeId);
      setClinvarVariants(variants);
    } catch (error) {
      setClinvarError("Failed to fetch ClinVar variants");
      setClinvarVariants([]);
    } finally {
      setIsLoadingClinvar(false);
    }
  };




  const showComparison = (variant) => {
    if (variant.evo2Result) {
      setComparisonVariant(variant);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="cursor-pointer text-neutral-50 hover:bg-indigo-400 hover:text-neutral-50"
        onClick={onClose}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to results
      </Button>

      <VariantAnalysis
        ref={variantAnalysisRef}
        gene={gene}
        genomeId={genomeId}
        chromosome={gene.chrom}
        clinvarVariants={clinvarVariants}
        referenceSequence={activeReferenceNucleotide}
        sequencePosition={activeSequencePosition}
        geneBounds={geneBounds}
      />

      <KnownVariants
        refreshVariants={fetchClinvarVariants}
        showComparison={showComparison}
        updateClinvarVariant={updateClinvarVariant}
        clinvarVariants={clinvarVariants}
        isLoadingClinvar={isLoadingClinvar}
        clinvarError={clinvarError}
        genomeId={genomeId}
        gene={gene}
      />

      <GeneSequence
        geneBounds={geneBounds}
        geneDetail={geneDetail}
        startPosition={startPosition}
        endPosition={endPosition}
        onStartPositionChange={setStartPosition}
        onEndPositionChange={setEndPosition}
        sequenceData={geneSequence}
        sequenceRange={actualRange}
        isLoading={isLoadingSequence}
        error={error}
        onSequenceLoadRequest={handleLoadSequence}
        onSequenceClick={handleSequenceClick}
        maxViewRange={10000}
      />

      <GeneInformation
        gene={gene}
        geneDetail={geneDetail}
        geneBounds={geneBounds}
      />

      <VariantComparisonModal
        comparisonVariant={comparisonVariant}
        onClose={() => setComparisonVariant(null)}
      />
    </div>
  );
}
