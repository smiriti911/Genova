"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Maven_Pro } from "next/font/google";
import { getAvailableGenomes, getAvailableChromosomes } from "../utils/genome-api";
import { searchGenes } from "../utils/genome-api";
import { Select, SelectContent, SelectTrigger, SelectItem, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "./ui/table";

import GeneViewer from "./Geneviewer";

const MavenPro = Maven_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const GenomeAssembly = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [genomes, setGenomes] = useState([]);
  const [error, setError] = useState(null);
  const [selectedGenome, setSelectedGenome] = useState("hg38");
  const [chromosomes, setChromosomes] = useState([]);
  const [selectedChromosome, setSelectedChromosome] = useState("chr1");
  const [searchQuery, setSearchQuery] = useState("");
  const [mode, setMode] = useState("search");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedGene, setSelectedGene] = useState(null);

  useEffect(() => {
    const fetchGenomes = async () => {
      try {
        setIsLoading(true);
        const data = await getAvailableGenomes();
        if (data?.Human) setGenomes(data.Human);
      } catch {
        setError("Failed to fetch genomes");
      } finally {
        setIsLoading(false);
      }
    };
    fetchGenomes();
  }, []);

  useEffect(() => {
    const fetchChromosomes = async () => {
      try {
        setIsLoading(true);
        const data = await getAvailableChromosomes(selectedGenome);
        setChromosomes(data);
        if (data.length > 0) setSelectedChromosome(data[0].name);
      } catch {
        setError("Failed to fetch chromosomes");
      } finally {
        setIsLoading(false);
      }
    };
    fetchChromosomes();
  }, [selectedGenome]);

  const performGeneSearch = async (query, genome, filterFn) => {
    try {
      setIsLoading(true);
      const data = await searchGenes(query, genome);
      const results = filterFn ? data.results.filter(filterFn) : data.results;
      setSearchResults(results);
    } catch {
      setError("Failed to search genes");
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode) => {
    if (newMode === mode) return;
    setSearchResults([]);
    setSelectedGene(null);
   
    setError(null);
    if (newMode === "chromosome" && selectedChromosome) {
      performGeneSearch(selectedChromosome, selectedGenome, (gene) => gene.chrom === selectedChromosome);
    }
    setMode(newMode);
  };

  useEffect(() => {
    if (!selectedChromosome || mode !== "chromosome") return;
    performGeneSearch(selectedChromosome, selectedGenome, (gene) => gene.chrom === selectedChromosome);
  }, [selectedChromosome, selectedGenome, mode]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    performGeneSearch(searchQuery, selectedGenome);
  };

  const loadBRCA1Example = () => {
    setMode("search");
    setSearchQuery("BRCA1");
    performGeneSearch("BRCA1", selectedGenome);
  };

  const handleGenomeChange = (value) => {
    setSelectedGenome(value);
    
  };

  return (

    <main className="container mx-auto px-2 sm:px-3 lg:px-11 xl:px-15 py-6">
      {selectedGene ? (
          <GeneViewer
            gene={selectedGene}
            genomeId={selectedGenome}
            onClose={() => setSelectedGene(null)}
          />
        ): (
          <>
      <Card className="w-full mb-6 border-none py-0 bg-neutral-800/30">
        <CardHeader className="pt-4 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className={`text-lg sm:text-xl md:text-2xl font-extralight text-neutral-100 ${MavenPro.className}`}>
              Genome Assembly
            </CardTitle>
            <div className={`text-base sm:text-lg font-extralight text-neutral-400 ${MavenPro.className}`}>
              Organism: <span>Human</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <Select value={selectedGenome} onValueChange={handleGenomeChange} disabled={isLoading || error}>
            <SelectTrigger className="w-full h-9 border-neutral-500/20 text-neutral-50">
              <SelectValue placeholder="Select Genome Assembly" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border border-neutral-500/20 text-white">
              {genomes.map((genome) => (
                <SelectItem key={genome.id} value={genome.id}>
                  {genome.id} - {genome.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedGenome && (
            <p className="mt-3 px-1 text-sm text-neutral-400">
              {genomes.find((g) => g.id === selectedGenome)?.sourceName || ""}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="w-full mb-6 border-none py-0 bg-neutral-800/30">
        <CardHeader className="pt-4 pb-2">
          <CardTitle className={`text-lg sm:text-xl font-extralight text-neutral-100 ${MavenPro.className}`}>
            Browse
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <Tabs value={mode} onValueChange={switchMode}>
            <TabsList className="bg-neutral-800 rounded-md">
              <TabsTrigger value="search" className="text-neutral-300 data-[state=active]:bg-white data-[state=active]:text-black rounded-md px-4 py-1">
                Search Genes
              </TabsTrigger>
              <TabsTrigger value="chromosome" className="text-neutral-300 data-[state=active]:bg-white data-[state=active]:text-black rounded-md py-1">
                Search Chromosomes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="mt-2">
              <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Enter Gene Symbol or Name"
                    className="text-neutral-50 h-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !searchQuery.trim()}
                    className="absolute top-0 right-0 h-full cursor-pointer rounded-l-none border border-neutral-500/60 border-l-0 text-white hover:bg-neutral-700 bg-neutral-800"
                  >
                    <Search className="h-4 w-4" />
                    <span>Search</span>
                  </Button>
                </div>
              </form>
              <Button className="bg-transparent text-neutral-400 mt-2 hover:text-white" onClick={loadBRCA1Example}>
                Try BRCA1 example
              </Button>
            </TabsContent>

            <TabsContent value="chromosome">
              <div className="max-h-[200px] overflow-y-auto py-4">
                <div className="flex flex-wrap gap-2">
                  {chromosomes.map((chrom) => (
                    <Button
                      key={chrom.name}
                      variant="outline"
                      size="sm"
                      className={`h-8 px-3 py-1 text-sm rounded-md border border-neutral-500/20 text-neutral-300 hover:bg-neutral-700 hover:text-white ${
                        selectedChromosome === chrom.name ? "bg-neutral-700 text-white" : "bg-neutral-800"
                      }`}
                      onClick={() => setSelectedChromosome(chrom.name)}
                    >
                      {chrom.name}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-500/20 border-t-indigo-400"></div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {searchResults.length > 0 && !isLoading && (
            <div className="mt-6">
              <div className="mb-2">
                <h4 className="text-xs font-normal text-neutral-400">
                  {mode === "search" ? (
                    <>
                      Search Results:{" "}
                      <span className="font-medium text-neutral-100">
                        {searchResults.length} genes
                      </span>
                    </>
                  ) : (
                    <>
                      Genes on {selectedChromosome}:{" "}
                      <span className="font-medium text-neutral-100">
                        {searchResults.length} found
                      </span>
                    </>
                  )}
                </h4>
              </div>

              <div className="overflow-hidden rounded-md border border-neutral-700/40">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-neutral-700/40 hover:bg-neutral-600/40">
                      <TableHead className="text-xs font-normal text-neutral-400">Symbol</TableHead>
                      <TableHead className="text-xs font-normal text-neutral-400">Name</TableHead>
                      <TableHead className="text-xs font-normal text-neutral-400">Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((gene, index) => (
                      <TableRow
                        key={`${gene.symbol}-${index}`}
                        className="cursor-pointer border-b border-neutral-700/40 hover:bg-neutral-700/30"
                        onClick={() => setSelectedGene(gene)}
                      >
                        <TableCell className="py-2 font-medium text-neutral-100">{gene.symbol}</TableCell>
                        <TableCell className="py-2 font-medium text-neutral-100">{gene.name}</TableCell>
                        <TableCell className="py-2 font-medium text-neutral-100">{gene.chrom}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </>
  )}
    </main>
  );
};

export default GenomeAssembly;
