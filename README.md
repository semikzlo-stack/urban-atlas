# Urban Atlas v0.6 — Gdańsk geospatial research toolkit

Single-file web application with five modules, using OpenStreetMap and public Overpass API queries. The software is provided as a research prototype, not a validated urban-planning report.

## Start

Open `index.html` in a browser with an Internet connection. If your browser blocks network requests from `file://`, run `python3 -m http.server 8080` in this folder, then open `http://localhost:8080`.

## Modules

1. **Buildings and housing estimates**: request OSM building polygons in a selected radius. Count outlines and explicitly tagged residential buildings. Estimate dwellings as `footprint area × tagged or default 3 storeys × 0.75 / average unit area`, unless `building:flats` is present. Residents estimate = estimated dwellings × occupancy. These numbers are model assumptions, not cadastral counts. The tool cannot infer new developments if construction dates are untagged.
2. **Walking accessibility**: Dijkstra shortest paths on locally downloaded foot-accessible OSM ways. Calculates the traversable road portions in 5/10/15/20 minutes, plus nearby mapped POIs. Uses 4.5 km/h; no signals/slope/crossing delay. The road network topology is approximate and may misrepresent overpasses or some special access restrictions.
3. **Street connectivity (Space Syntax exploration)**: local street junction degree and network segments. This is a *preliminary connectivity measure*, **not a complete Space Syntax axial or angular choice/integration study**.
4. **Urban centres**: count mapped POI nodes by broad category in roughly 250m bins. This is supply/concentration, not measured visitor interest, tourists, or Google review volume.
5. **City comparison**: apply the same OSM POI count in a 1-km radius from preselected city centres (Gdańsk + cities chosen in the UI). Counts depend on mapping coverage. Neither unique attraction benchmarking nor coastal redevelopment site matching is implemented.

## Data quality, licensing and cost

OpenStreetMap data: © OpenStreetMap contributors; ODbL. Public Overpass endpoints can throttle, time out or block traffic. These endpoints are a convenience, not guaranteed uptime. Commercial deployment should use an OSM extract/cache and follow tile-server usage policy. No paid API key required for this prototype. Network connectivity is required. Full municipal demographics, tourist flow, verified new development registers and Google's proprietary POI/review data are **not** included.

## Export

The app exports per-module GeoJSON and CSV as available. Accessibility also provides raw OSM JSON import/export and print-to-PDF via browser.

## Caveats

The map is fixed to the initially selected city (Gdańsk) but supports selecting local points. Compare module fetches separate city-centre data. This is an MVP designed for extension; not a production-ready reliable GIS model. Validate geographic outputs against QGIS and authoritative data before publication.

## Official source catalogue (not yet automatically merged)

- Polish cadastral EGiB WFS: https://mapy.geoportal.gov.pl/wss/service/PZGIK/EGIB/WFS/UslugaZbiorcza
- EGiB download portal: https://www.geoportal.gov.pl/pl/dane/ewidencja-gruntow-i-budynkow-egib/
- GUS BDL statistics: https://bdl.stat.gov.pl/
- Gdańsk municipal open-data: https://www.gdansk.pl/otwarte-dane-w-gdansku

Data-source links are not equivalent to data integration. No automatic cadastral, GUS or tourism import is claimed.

## Publishing

This project is a static `index.html` site. Drag this folder into Vercel, Netlify, or Cloudflare Pages, or connect it to a Git repository. The public Overpass API and OSM tile endpoint are not suitable for high traffic without usage planning. For a production service add persistent caching and server-side ingestion, not direct repeated broad public queries.
