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
The repository is currently named `hawesfamiy` (missing the second L from `hawesfamily`) and is public.

**Cloudflare Pages:** connect this GitHub repo, branch `main`, framework preset `None`, no build command, output directory `/`.

**GitHub Pages:** Settings → Pages → Deploy from a branch → `main` → root. Availability for a private repository depends on your GitHub plan.

Do not publish the complete GEDCOM or personal details of living relatives.


## Cloudflare Pages and GitHub images (November 2026)

Public site: https://hawesfamiy.pages.dev/

The `main` branch of this repository is the source for the Cloudflare Pages site (framework None, no build command, output directory repository root). All website pages, historical research and published photographs are stored in GitHub. Historical images are ordinary binary JPEG files under `images/`, with references such as `images/william-hawes.jpg` or `../images/walter-hawes-pension-particulars.jpg`.

The initial collection of 13 family-supplied photographs and archive scans was committed on 7 November 2026. No separate Cloudflare Worker, Pages Function, R2 bucket binding or public R2 access is needed for the published site. The `hawes-family-archive` bucket can remain unused.

**Future additions:** Add approved historical photographs as binary objects to `images/` in GitHub and reference the correct filenames from biographies and source pages. Any unpublished or potentially living-person information requires privacy review before adding it to this public repository.

Cloudflare Pages deploys changes from the main branch automatically, assuming its GitHub deployment integration remains enabled.
