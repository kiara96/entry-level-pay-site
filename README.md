# Entry-level pay in Europe

Static site with charts of advertised pay for internships and junior roles across Europe, built from 63,394 job postings collected by Karimi.

- `index.html` – the page (d3 v7 from cdnjs, no build step)
- `data/` – aggregated CSVs behind each chart, plus `salaries_clean.csv` (row-level, de-duplicated salaried postings)

Serve locally with `python3 -m http.server` and open http://localhost:8000.
