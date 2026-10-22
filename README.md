# Urban Atlas 1.0 — tested release candidate

**Status:** locally tested source code; live third-party API requests, full in-browser flows, and deployment to user-owned Vercel have not been verified from this environment.

# Urban Atlas v0.7 — Gdańsk

## What's changed

- Five existing OSM analysis modules retained.
- Official Polish GUS BDL read-only API integration via `/api/gus` (Vercel Node.js Function); search Gdańsk units and retrieve yearly values by an *explicit GUS variable ID*. City statistics are not disaggregated to individual blocks.
- Experimental BDOT10k Polish Geoportal WMS toggle in Leaflet. The initial WMS layer configuration is unverified against the live capabilities document; if tiles fail to render, use official Geoportal to inspect the layer. **No cadastral counts are imported yet.**
- Fixed numeric stability in building footprint area via local-coordinate shoelace; accounted for connector distance from selected point to road network in pedestrian budget.
- Math tests: `node tests/math.test.cjs`.

## Deploy

Upload `index.html`, `api/gus.js` and `tests/math.test.cjs` (or use the ZIP) to the root of the GitHub repository linked to Vercel. The `api/` path **must** remain at root. Vercel will automatically redeploy on commit. No GUS API key is required for anonymous quota. Do not upload the ZIP as a file inside the repository.

## Methodology limitations

Walk accessibility assumes 4.5 km/h on OSM pedestrian ways and simple nearest-node snapping; footpaths with no OSM tags may be absent; barriers, crossings, slopes, weather and waiting are not represented. Snap connector is Euclidean and might cross barriers. POI snapping is approximate. Network segments cut at reachable distance are displayed rather than a validated polygon isochrone. Only nodes with POI tags are counted (OSM ways and relations excluded). Building area uses a local equirectangular projection, reasonable for neighborhood-scale footprints; official survey area should use a projected Polish CRS. Building floor counts, dwelling and resident figures are scenarios, not cadastral facts. Space Syntax is degree-connectivity proxy, not angular integration/choice. No claims of measured tourist footfall or review ratings are made.

## Data sources

- OSM contributors, ODbL: https://www.openstreetmap.org/copyright
- GUS BDL API: https://api.stat.gov.pl/Home/BdlApi
- Geoportal GUGiK: https://www.geoportal.gov.pl/en/services/download-service-wfs/
- BDOT10k overview: https://www.geoportal.gov.pl/en/data/topographic-objects-database-bdot10k/

Live external services and cross-origin WMS are not verified from this build environment. See browser developer console and Vercel function logs for external failures.

## v0.8 verification and revisions
- Included official GUGiK **Nowe budynki BDOT10k** WMS as an experimental visual overlay; the published WMS endpoint is official, but `layers=0` and browser tile rendering have not been verified against live GetCapabilities. This is **not** a structured import of new-buildings attributes.
- Corrected nearest-OSM-node lookup to examine neighboring grid rings rather than stopping when the first occupied ring is encountered.
- GUS BDL proxy now supports fetching variable metadata so the interface displays variable names where available. Serverless API has a local mock-contract test.
- Tests: `node tests/math.test.cjs` and `node tests/api.test.cjs`. The latter mocks GUS responses: it does not test external network availability.
- The public site is only updated when changes are committed to GitHub. ZIP contents do not automatically update a previously deployed URL.

## Verified checks for this release

Run `node tests/syntax.test.cjs`, `node tests/math.test.cjs`, `node tests/api.test.cjs`.

- Correct reachable *union* of partial segments when both ends of a street are reachable but its middle is not.
- Haversine distance, approximate footprint area, shortest path cutoff, partial edge, access connector budget.
- GUS BDL request validation and response parsing with local mock server.
- Browser JavaScript syntax parsing.

## Known constraints (do not mistake these for verified research results)

- Buildings: OSM geometry and hypothetical dwellings, not official permit dates or population.
- Walking: nearest road-node model, no accurate snapping to interior of edges, grade, restrictions on access or timed crossings; network line fragments are not validated isochrone polygons.
- Space Syntax: only degree proxy, not axial or angular integration/choice.
- Centre: OSM tagged POIs, not observed visitor flows.
- Cities: comparable OSM query but sampling/coverage varies widely.
- GUS: `/api/gus` serverless handler on Vercel; user must select official unit and variable IDs.
- WMS overlays with unverified internal layer names were disabled to avoid blank/unreliable overlays. Official data source links remain.

## Production release procedure

Replace repository root `index.html`, `api/gus.js`, `vercel.json`, `README.md`, and `tests/` with ZIP contents. Commit and inspect the production deploy. Verify browser developer console, request to `/api/gus?action=units&name=Gda%C5%84sk`, and one real Overpass walking analysis.
