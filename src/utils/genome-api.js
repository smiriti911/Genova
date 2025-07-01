

const genomeAssemblyFromSearch = {
  id: "",
  name: "",
  sourceName: "",
  active: true,
};

const chromosomeFromSearch = {
  name:"",
  size: ""
}

export async function getAvailableGenomes() {
  console.log("Fetching available genomes...");

  const apiUrl = "https://api.genome.ucsc.edu/list/ucscGenomes";

  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error("Failed to fetch genomes");
  }

  const genomeData = await response.json();
  const genomes = genomeData.ucscGenomes;

  if (!genomes) {
    throw new Error("No valid genome data found");
  }

  const structuredGenomes = {};

  for (const genomeId in genomes) {
    const genomeInfo = genomes[genomeId];
    const organism = genomeInfo.organism || "Other";

    if (!structuredGenomes[organism]) {
      structuredGenomes[organism] = [];
    }

    structuredGenomes[organism].push({
      id: genomeId,
      name: genomeInfo.description || genomeId,
      sourceName: genomeInfo.sourceName || genomeId,
      active: Boolean(genomeInfo.active), // safe coercion
    });
  }

  return structuredGenomes;
}


export async function getAvailableChromosomes(genomeId) {
  console.log("Fetching available chromosomes...");

  const apiUrl = `https://api.genome.ucsc.edu/list/chromosomes?genome=${genomeId}`;

  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error("Failed to fetch chromosomes");
  }

  const chromosomeData = await response.json();

  if (!chromosomeData.chromosomes) {
    throw new Error("No valid chromosomes data found");
  }

  const structuredChromosomes = [];

  for (const chromosomeId in chromosomeData.chromosomes) {
    // Filter unwanted chromosomes
    if (
      chromosomeId.includes("_") ||
      chromosomeId.includes("Un") ||
      chromosomeId.includes("random")
    ) {
      continue;
    }

    structuredChromosomes.push({
      name: chromosomeId,
      size: chromosomeData.chromosomes[chromosomeId],
    });
  }

  // Sort: numeric chr1–chr22 first, then chrX, chrY, chrM
    structuredChromosomes.sort((a, b) => {
    const anum = a.name.replace("chr", "");
    const bnum = b.name.replace("chr", "");
    const isNumA = /^\d+$/.test(anum);
    const isNumB = /^\d+$/.test(bnum);
    if (isNumA && isNumB) return Number(anum) - Number(bnum);
    if (isNumA) return -1;
    if (isNumB) return 1;
    return anum.localeCompare(bnum);
  });

  return structuredChromosomes;
}


export async function searchGenes(query, genome) {
  const url = "https://clinicaltables.nlm.nih.gov/api/ncbi_genes/v3/search";

  // Define query parameters
  const params = new URLSearchParams({
    terms: query,
    df: "chromosome,Symbol,description,map_location,type_of_gene", // fields returned directly
    ef: "chromosome,Symbol,description,map_location,type_of_gene,GenomicInfo,GeneID", // extended fields
  });

  // Make the API call
  const response = await fetch(`${url}?${params}`);
  if (!response.ok) {
    throw new Error("NCBI API Error");
  }

  const data = await response.json();
  const results = [];

  // data[0] = total results count
  // data[2] = field map
  // data[3] = actual results (array of arrays)

  if (data[0] > 0) {
    const fieldMap = data[2];
    const geneIds = fieldMap.GeneID || [];

    // Limit to first 10 results
    for (let i = 0; i < Math.min(10, data[0]); ++i) {
      if (i < data[3].length) {
        try {
          const display = data[3][i]; // i-th gene data array
          let chrom = display[0];     // chromosome field
          if (chrom && !chrom.startsWith("chr")) {
            chrom = `chr${chrom}`;    // normalize to "chrX"
          }

          results.push({
            symbol: display[2],       // Symbol field
            name: display[3],         // description
            chrom,
            description: display[3],  // duplicate of name
            gene_id: geneIds[i] || "", // GeneID (if available)
          });
        } catch {
          continue; // skip malformed result
        }
      }
    }
  }

  return { query, genome, results };
}


export async function fetchGeneDetails(geneId) {
  try {
    const detailUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=gene&id=${geneId}&retmode=json`;
    const detailsResponse = await fetch(detailUrl);

    if (!detailsResponse.ok) {
      console.error(`Failed to fetch gene details: ${detailsResponse.statusText}`);
      return { geneDetails: null, geneBounds: null, initialRange: null };
    }

    const detailData = await detailsResponse.json();

    if (detailData.result && detailData.result[geneId]) {
      const detail = detailData.result[geneId];

      if (detail.genomicinfo && detail.genomicinfo.length > 0) {
        const info = detail.genomicinfo[0];

        const minPos = Math.min(info.chrstart, info.chrstop);
        const maxPos = Math.max(info.chrstart, info.chrstop);
        const bounds = { min: minPos, max: maxPos };

        const geneSize = maxPos - minPos;
        const seqStart = minPos;
        const seqEnd = geneSize > 10000 ? minPos + 10000 : maxPos;
        const range = { start: seqStart, end: seqEnd };

        return { geneDetails: detail, geneBounds: bounds, initialRange: range };
      }
    }

    return { geneDetails: null, geneBounds: null, initialRange: null };
  } catch (err) {
    return { geneDetails: null, geneBounds: null, initialRange: null };
  }
}


export async function fetchGeneSequence(chrom, start, end, genomeId) {
  try {
    const chromosome = chrom.startsWith("chr") ? chrom : `chr${chrom}`;

    const apiStart = start - 1;
    const apiEnd = end;

    const apiUrl = `https://api.genome.ucsc.edu/getData/sequence?genome=${genomeId};chrom=${chromosome};start=${apiStart};end=${apiEnd}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    const actualRange = { start, end };

    if (data.error || !data.dna) {
      return { sequence: "", actualRange, error: data.error };
    }

    const sequence = data.dna.toUpperCase();

    return { sequence, actualRange };
  } catch (err) {
    return {
      sequence: "",
      actualRange: { start, end },
      error: "Internal error in fetch gene sequence",
    };
  }
}

export async function fetchClinvarVariants(chrom, geneBound, genomeId) {
  const chromFormatted = chrom.replace(/^chr/i, "");

  const minBound = Math.min(geneBound.min, geneBound.max);
  const maxBound = Math.max(geneBound.min, geneBound.max);

  const positionField = genomeId === "hg19" ? "chrpos37" : "chrpos38";
  const searchTerm = `${chromFormatted}[chromosome] AND ${minBound}:${maxBound}[${positionField}]`;

  const searchUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
  const searchParams = new URLSearchParams({
    db: "clinvar",
    term: searchTerm,
    retmode: "json",
    retmax: "20",
  });

  const searchResponse = await fetch(`${searchUrl}?${searchParams.toString()}`);

  if (!searchResponse.ok) {
    throw new Error("ClinVar search failed: " + searchResponse.statusText);
  }

  const searchData = await searchResponse.json();

  if (
    !searchData.esearchresult ||
    !searchData.esearchresult.idlist ||
    searchData.esearchresult.idlist.length === 0
  ) {
    console.log("No ClinVar variants found");
    return [];
  }

  const variantIds = searchData.esearchresult.idlist;

  const summaryUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";
  const summaryParams = new URLSearchParams({
    db: "clinvar",
    id: variantIds.join(","),
    retmode: "json",
  });

  const summaryResponse = await fetch(`${summaryUrl}?${summaryParams.toString()}`);

  if (!summaryResponse.ok) {
    throw new Error("Failed to fetch variant details: " + summaryResponse.statusText);
  }

  const summaryData = await summaryResponse.json();
  const variants = [];

  if (summaryData.result && summaryData.result.uids) {
    for (const id of summaryData.result.uids) {
      const variant = summaryData.result[id];
      variants.push({
        clinvar_id: id,
        title: variant.title,
        variation_type: (variant.obj_type || "Unknown")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(" "),
        classification: variant.germline_classification?.description || "Unknown",
        gene_sort: variant.gene_sort || "",
        chromosome: chromFormatted,
        location: variant.location_sort
          ? parseInt(variant.location_sort).toLocaleString()
          : "Unknown",
      });
    }
  }

  return variants;
}
export async function analyzeVariantWithAPI({ position, alternative, genomeId, chromosome }) {
  const url = process.env.NEXT_PUBLIC_ANALYZE_SINGLE_VARIANT_BASE_URL;

  const body = {
    variant_position: position,
    alternative,
    genome: genomeId,
    chromosome,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error("Failed to analyze variant: " + errorText);
  }

  const result = await response.json();
  return result;
}
