import { describe, expect, it } from "vitest";

import { bibtexKey, buildBibtex } from "./bibtex";

describe("bibtexKey", () => {
  it("uses first author surname, year, first significant title word", () => {
    expect(
      bibtexKey(
        ["Maryam Ramezani", "Hamid R. Rabiee"],
        2024,
        "The DANI: fast inference",
      ),
    ).toBe("ramezani2024dani");
  });

  it("strips accents and punctuation", () => {
    expect(bibtexKey(["José Núñez-Díaz"], 2020, "On Graphs")).toBe(
      "nunezdiaz2020graphs",
    );
  });
});

describe("buildBibtex", () => {
  it("emits @article for journals with a doi", () => {
    const bib = buildBibtex({
      title: "DANI",
      authors: ["Maryam Ramezani", "Hamid R. Rabiee"],
      year: 2024,
      venue: { name: "Scientific Reports", type: "journal" },
      links: [{ type: "doi", url: "https://doi.org/10.1/x" }],
    });
    expect(bib).toContain("@article{ramezani2024dani,");
    expect(bib).toContain("author = {Maryam Ramezani and Hamid R. Rabiee}");
    expect(bib).toContain("journal = {Scientific Reports}");
    expect(bib).toContain("doi = {10.1/x}");
    expect(bib.trim().endsWith("}")).toBe(true);
  });

  it("emits @inproceedings for conferences and workshops", () => {
    const conf = buildBibtex({
      title: "X",
      authors: ["A B"],
      year: 2025,
      venue: { name: "KDD", type: "conference" },
      links: [],
    });
    expect(conf).toMatch(/^@inproceedings\{/);
    expect(conf).toContain("booktitle = {KDD}");
  });

  it("emits @misc with eprint for arXiv preprints", () => {
    const pre = buildBibtex({
      title: "X",
      authors: ["A B"],
      year: 2025,
      venue: { name: "arXiv", type: "preprint" },
      links: [{ type: "arxiv", url: "https://arxiv.org/abs/2501.00001v2" }],
    });
    expect(pre).toMatch(/^@misc\{/);
    expect(pre).toContain("eprint = {2501.00001}");
    expect(pre).toContain("archivePrefix = {arXiv}");
  });

  it("protects title capitalisation with braces", () => {
    const bib = buildBibtex({
      title: "Text-to-SQL with LLMs",
      authors: ["A B"],
      year: 2025,
      venue: { name: "V", type: "journal" },
      links: [],
    });
    expect(bib).toContain("title = {{Text-to-SQL with LLMs}}");
  });
});
