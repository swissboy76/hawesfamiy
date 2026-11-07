# The Hawes Family Archive

An evidence-led, mobile-friendly shared Hawes family archive with an interactive branching tree, personal biographies, historical photographs, and research sources. It is designed for all branches of the family, without describing relationships relative to any individual visitor. Research sources include the Ancestry and Findmypast GEDCOM exports from 6 November 2026.

## Features
- Interactive family-member cards with evidence notes
- Filterable chronological timeline
- Biographical chapter outlines and source register
- Outstanding research questions
- Living-generation privacy by default

## Source policy
The source GEDCOM is NOT included in this repository because it contains information about living family members. Family tree assertions and recollections are labelled separately from published contemporary evidence. No unverified portraits are presented as authentic.

Open questions include William Edward Wilson Hawes's occupation (family recollection: banking), his Thornton Heath address (1881 census RG11/820 f.88 p.31), Walter Hawes's clerkship, the 243/406 Strand premises, and the duplicate Sophia Maria Davison/Day entries.

## Run
Open `index.html` in any browser; there is no build step.

## Publish
The repository is currently named `hawesfamiy` (missing the second L from `hawesfamily`) and is private.

**Cloudflare Pages:** connect this GitHub repo, branch `main`, framework preset `None`, no build command, output directory `/`.

**GitHub Pages:** Settings → Pages → Deploy from a branch → `main` → root. Availability for a private repository depends on your GitHub plan.

Do not publish the complete GEDCOM or personal details of living relatives.


## Cloudflare Pages and R2 (November 2026)

Live project name: `hawesfamiy` — `https://hawesfamiy.pages.dev/`.
GitHub remains the source of site code and historical research. Publish using Cloudflare Pages connected to the `main` branch, framework **None**, no build command, output directory `/` (repository root).

### Bind private image storage

1. Create/select Cloudflare R2 bucket `hawes-family-archive`.
2. Cloudflare dashboard → Workers & Pages → `hawesfamiy` → Settings → Bindings → Add → R2 bucket.
3. Set **Variable name** `ARCHIVE`; set **R2 bucket** `hawes-family-archive`. Save and redeploy. Also bind Preview if you need preview URLs to show photographs.
4. Upload approved historical JPEGs to the **root of the R2 bucket**, with exactly the filenames listed in `functions/images/[filename].js`. Do not upload them into an `images/` folder: the endpoint already maps `/images/<name>` to the root key `<name>`.
5. The site continues to refer to images as relative paths such as `images/william-hawes.jpg`. On Cloudflare Pages they are served by the function from private R2; there is no need to enable the R2 public development URL or set up a public bucket.

**Privacy:** The endpoint has an explicit allowlist. Uploading additional objects to R2 does not make them available through the public site. Keep originals or any documents involving living people in separate unlisted keys or, preferably, a separate private bucket. There is no public upload endpoint or credential in the repository.

**Troubleshooting:** `/images/william-hawes.jpg` returns 503 if the `ARCHIVE` binding is missing; 404 if the requested image has not been uploaded under the expected root key; and 200 with a JPEG once configured. The Pages-specific `_routes.json` restricts Function invocations to `/images/*` so regular static pages remain static.
