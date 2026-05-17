# FullStop — The Human Intelligence Layer
## "The Ogilvy of AI": Key Activities of the Human Workforce

*David Ogilvy built the world's most respected advertising agency through obsessive craft, research, and people who knew things from experience. He hired brilliant, opinionated humans and let them develop their art. FullStop does the same — except the artists improve AI agents instead of writing ads. The output scales. The craft doesn't dilute.*

---

## THE PHILOSOPHY

Ogilvy's greatest insight was that advertising was a craft, not a factory.
He was wrong about one thing: it can be both — if the craftspeople work on the factory, not in it.

At FullStop, zero humans are in the client delivery loop.
But the humans who work on the factory are its most valuable asset.

**Their job:** Take everything they know from experience — what makes a great headline, why this logo doesn't work, what a plumber's site needs that a salon's doesn't, why this CTA converts and that one doesn't — and encode that knowledge permanently into the AI agents that serve every client.

**The compound:** One experienced human improves one prompt. That improvement runs on every future build. Thousands of clients benefit from a single act of craft.

**The neurodivergent advantage:** Pattern recognition beyond the norm. Obsessive attention to detail. Hyperfocus that neurotypical environments can't harness. The exact cognitive profile that makes AI output reviewers, prompt engineers, and quality sheriffs extraordinary at their work — and that traditional agencies systematically underemploy.

---

## THE HUMAN ROLES

### 1. Agent Quality Directors
*The creative directors of the AI factory.*

Experienced agency people — senior copywriters, creative directors, brand strategists, UX designers — who have spent years knowing what "great" looks like and can tell when an AI misses it.

Their job is not to do the work. Their job is to raise the bar of the agents who do.

### 2. Vertical Intelligence Specialists
*One per industry. Deep experience. Encyclopedic knowledge.*

A former restaurant owner who knows every mistake a hospitality site makes. An ex-medical practice manager who knows exactly how a clinic's patient pathway works online. A retired contractor who knows what makes a trade services site generate leads.

Their job is to encode decades of vertical experience into the agent prompts and presets for their industry.

### 3. Prompt Engineers
*The translators between human expertise and machine execution.*

Technically literate people — often neurodivergent, often former developers or writers — who take the knowledge of the Quality Directors and Vertical Specialists and translate it into precise, testable, versioned prompt improvements.

### 4. Output Reviewers
*The quality sheriffs. Often neurodivergent. Always relentless.*

People who review every agent output against a rubric. Who notice that the hero headline is 12 words when it should be 8. Who catch when the testimonial sounds like it was written by a robot. Who flag when the colour palette is technically correct but aesthetically wrong for the industry.

Their feedback is structured, scored, and fed directly into prompt improvement sprints.

### 5. Competitive Intelligence Analysts
*They watch what the best agencies in the world are doing and encode it.*

Monitoring the best-in-class digital work from real agencies — Ogilvy, BBDO, Wieden+Kennedy at the high end; the best boutique local agencies at the SME level — and identifying what FullStop's agents should learn from them.

---

## KEY ACTIVITIES — THE FULL LIST

### A. OUTPUT QUALITY

**A1. Site Review & Scoring (weekly)**
Every site built by the factory is reviewed by a human Output Reviewer within 48 hours of deployment.
- Scored against a rubric: copy quality, design coherence, SEO structure, CTA effectiveness, brand accuracy, mobile experience, accessibility
- Scores tracked over time per agent, per archetype, per vertical
- Systematic patterns identified → sent to prompt improvement queue

**A2. Failure Autopsy (per failed build)**
Every factory pipeline failure — self-healed or not — is manually reviewed.
- Root cause categorised: which agent failed, at which stage, why
- Fix classified: prompt update, preset update, Golden Image update, infra fix
- Resolution documented in lessons-learned library

**A3. A/B Output Comparison (monthly)**
Two versions of the same brief run through the factory. Human reviewers pick the better output without knowing which prompt variant produced it. The winner's prompt is locked.

**A4. Hallucination Audit (weekly)**
Systematic review of AI-generated copy for:
- Made-up facts, awards, or statistics
- Generic corporate language that leaked through
- Wrong industry tone (a law firm that sounds like a café)
- CTAs that point to the wrong page
- Testimonials that sound AI-generated

**A5. Accessibility Review (monthly)**
Neurodivergent reviewers who experience the web differently are particularly valuable here:
- Colour contrast verification (WCAG AA minimum)
- Screen reader flow testing
- Touch target sizing on mobile
- Reading level assessment of copy

---

### B. AGENT TRAINING & PROMPT ENGINEERING

**B1. Prompt Improvement Sprints (fortnightly)**
Two-week cycles where a cross-functional team (Quality Director + Prompt Engineer + Vertical Specialist) reviews the score data, identifies the weakest outputs, and writes improved prompts.

Process:
1. Pull lowest-scoring sites from the review queue
2. Identify the agent responsible for each failure
3. Write improved prompt with specific examples of what good looks like
4. A/B test against control prompt on synthetic briefs
5. Deploy winning prompt to production
6. Monitor first 10 builds post-deployment

**B2. Exemplar Library Curation (ongoing)**
A curated library of the best real-world examples for each:
- Industry × block type combination
- Hero headline by archetype
- Testimonial by vertical
- CTA by conversion goal
- Visual identity by brand mood

These examples are injected into agent system prompts as few-shot examples. The library grows permanently.

**B3. Failure Pattern Encoding (ongoing)**
Every failure type that a human reviewer catches is documented as a specific constraint added to the relevant agent's system prompt:
- "NEVER use the phrase 'solutions' or 'cutting-edge'"
- "For restaurant archetypes, the hero heading must include a sensory word"
- "Testimonial roles for product businesses must be 'Loyal Customer' or 'Repeat Buyer' — NEVER 'Operations Director'"

**B4. Industry Knowledge Injection (per vertical)**
Each Vertical Intelligence Specialist spends dedicated time encoding what they know into the system:
- What does a great [plumber / salon / clinic / restaurant] site do that average ones don't?
- What questions do [industry] customers always ask before booking?
- What trust signals matter most in [vertical]?
- What mistakes do [industry] businesses make on their website most often?

This knowledge becomes part of the vertical-specific page presets and archetype prompt variants.

**B5. Cross-Agent Consistency Checks (monthly)**
Review outputs where multiple agents touch the same content:
- Does the Content Writer's copy match the tone the Design Director chose?
- Does the UI Architect's layout serve the Content Writer's headlines?
- Does the Payload Expert's CMS structure match what the UI Architect designed?

Misalignment patterns → fed into the Queen's Byzantine consensus checks.

---

### C. GOLDEN IMAGE MAINTENANCE

**C1. Block Library Expansion (quarterly)**
The 10 core blocks are the minimum viable vocabulary. Human designers and developers add new blocks based on:
- Client request patterns (what's being asked for most often)
- Industry needs not currently served
- Competitive gaps (what the best agency sites have that FullStop doesn't)
- Accessibility improvements

Each new block is:
1. Designed by a human designer to a production standard
2. Built by a developer into the Golden Image
3. Given a copy specification by a senior copywriter
4. Added to the Design Director's and Content Writer's agent vocabulary
5. Tested across 5 archetype permutations before release

**C2. Design System Calibration (quarterly)**
Human creative directors review whether the 6 palettes and 5 font pairings are still:
- Commercially current (design trends move)
- Correctly matched to industry (does forest still work for sustainability brands?)
- Accessible (contrast ratios, readability)
- Technically correct in Tailwind

**C3. Preset Quality Review (monthly)**
The 8 page presets are reviewed for output quality across real tenant sites:
- Are the block sequences producing good results?
- Are any presets consistently underperforming?
- Do the presets need a new variant for an emerging pattern?

**C4. SEO Defaults Audit (quarterly)**
SEO specialists review the technical SEO baked into every deployment:
- Core Web Vitals benchmarks
- Schema markup completeness
- Sitemap and robots.txt correctness
- Meta tag patterns
- Heading hierarchy rules

Standards updated in the Golden Image before each quarterly review.

---

### D. VERTICAL PLAYBOOK DEVELOPMENT

**D1. Vertical Research (before entering each new vertical)**
Before FullStop officially targets a new industry vertical, a Vertical Intelligence Specialist:
1. Audits the 20 best websites in that industry globally
2. Audits the 20 worst (to understand what to avoid)
3. Interviews 5–10 business owners in that vertical about their digital frustrations
4. Documents the specific page structure, copy patterns, trust signals, and CTAs that work
5. Builds a vertical brief that becomes the foundation of the archetype preset

**D2. Local Market Calibration (by geography)**
Digital expectations vary by market. An Australian clinic site has different trust signals than a UK clinic site. A Melbourne café has different aesthetics than a Sydney café.

Human local market experts review and calibrate:
- Copy conventions (Australian directness vs. UK formality)
- Visual preferences (what local brands look like)
- Pricing references (local market context)
- Local SEO signals (suburb-level specificity)

**D3. Competitor Gap Analysis (per vertical, quarterly)**
What are the best agency-built sites in each vertical doing that FullStop sites don't do yet? Vertical specialists document the gap and feed it into the block development backlog.

---

### E. COMPETITIVE INTELLIGENCE

**E1. Agency Watch (monthly)**
Monitor what Ogilvy, BBDO, Dentsu, Leo Burnett, and the best boutique agencies are producing for SME-adjacent clients:
- What creative approaches are winning awards?
- What copy styles are converting?
- What UI patterns are becoming standard?
- What are they saying about AI in advertising?

Document insights → route to relevant agent improvement queue.

**E2. AI Tool Benchmarking (monthly)**
Monitor every competitor AI tool — Wix AI, Squarespace, Durable, 10Web, Framer AI, Webflow AI:
- What are they doing well?
- What are they shipping that FullStop doesn't have?
- Where is their output quality visibly worse than FullStop's?
- What do their failure modes look like?

**E3. Client Site Benchmarking (ongoing)**
Compare random sample of live FullStop sites against:
- The best agency-built sites in the same industry
- The best AI-built sites in the same industry
- The client's actual competitors' sites

Score the gap. The gap is the product roadmap.

---

### F. STANDARDS & CRAFT DOCUMENTATION

**F1. The FullStop Standard (living document)**
An Ogilvy-style standards document — updated continuously — that defines what "excellent" looks like for every aspect of a FullStop output:
- What a great hero headline reads like (with examples)
- What a great testimonial sounds like (with examples)
- What a great CTA converts like (with data)
- What a great colour palette feels like for each industry
- What a great About page says for a service business

This document is:
- Written by experienced humans
- Maintained by Quality Directors
- Used as the scoring rubric for output review
- Injected as examples into agent system prompts

**F2. The Brand Voice Taxonomy (quarterly review)**
A library of documented brand voice archetypes — with real examples — that the CEO Agent references when extracting client voice:
- Warm & conversational (local service)
- Authoritative & precise (professional services)
- Bold & energetic (fitness, food)
- Calm & reassuring (healthcare, wellness)
- Playful & irreverent (creative, entertainment)

Updated as new archetypes emerge from real client briefs.

**F3. Copy Review Standards (monthly)**
Senior copywriters review 20 randomly selected pieces of AI-generated copy across 5 archetypes and document:
- What's consistently good (don't touch this)
- What's consistently mediocre (improve this)
- What's occasionally terrible (fix this urgently)
- What new patterns are appearing (encode these)

---

### G. WORKFORCE DEVELOPMENT

**G1. Neurodivergent Hiring Pipeline**
Active partnership with:
- Neurodiversity employment programmes
- Disability employment services
- University neurodiversity support offices
- Online neurodivergent communities

Roles specifically suited to neurodivergent strengths:
- **Output Reviewer** — pattern recognition, detail orientation, consistency
- **Prompt Engineer** — systematic thinking, precision, edge case awareness
- **Accessibility Tester** — first-person experience of accessibility needs
- **Competitive Analyst** — hyperfocus on domain, encyclopedic memory
- **Vertical Specialist** — deep domain expertise in a single industry

**G2. Experience-Based Hiring**
FullStop hires for lived experience in digital agency roles, not credentials:
- Former copywriters who know what makes copy convert
- Ex-designers who know when something is visually wrong
- Retired SEO specialists who know what Google actually rewards
- Ex-account managers who know what clients actually complain about

These people don't need managing. They need focus. FullStop gives them one clear job: make the AI better at what they used to do.

**G3. The Craft Apprenticeship**
Junior team members (including neurodivergent graduates) work alongside experienced reviewers, learning:
- What "great" looks like in digital marketing
- How to articulate that standard precisely enough to encode into an AI
- How to run prompt experiments and read the results

Over 12–18 months, they develop both the domain knowledge and the technical ability to run improvement sprints independently.

**G4. No Silos — The Quality Loop**
Every human role feeds every other:
```
Output Reviewer spots pattern →
Vertical Specialist confirms it's an industry issue →
Quality Director articulates the standard →
Prompt Engineer encodes it →
Output Reviewer verifies improvement →
Golden Image updated →
All future tenants benefit
```

This loop runs continuously. Every improvement is permanent.

---

### H. THE OGILVY PARALLELS

| What Ogilvy did | What FullStop does |
|----------------|-------------------|
| "The customer is not a moron — she is your wife." Respect the audience. | Respect the SME owner. Every output is reviewed against: would a real business owner be proud of this? |
| Hired researchers alongside creatives. Data + craft. | Output Reviewers (craft) + Score tracking (data). Neither alone is enough. |
| "Give me the freedom of a tight brief." | The CEO Agent + BMC pipeline IS the tight brief. Structure enables creativity. |
| Maintained standards documents across all offices globally. | The FullStop Standard document. One truth, applied across all agents, all tenants, all verticals. |
| Great ads ran forever. | Great prompts run forever. One improvement compounds across thousands of future builds. |
| Trained people in "the Ogilvy way." | Quality Directors train Prompt Engineers. Vertical Specialists train junior reviewers. The way is documented and transferred. |
| Hired people smarter than himself. | Hire neurodivergent specialists who see things the founder can't. They make the factory smarter than any individual. |
| Obsessed over the first line of every ad. | Obsess over the hero headline of every site. It's the first thing every visitor reads. It's what the Output Reviewer checks first. |
| Never ran an ad he wouldn't want his family to see. | Never deploy a site a business owner wouldn't be proud of. That's the quality bar. |

---

## THE COMPOUND EFFECT

This is why FullStop can become the Ogilvy of AI — not just a commodity AI tool:

**Year 1:** 100 builds. Each reviewed. 50 prompt improvements. Output quality rises.

**Year 2:** 1,000 builds. 200 prompt improvements accumulated. Each new build benefits from everything learned. Output quality is significantly higher than Year 1.

**Year 5:** 50,000 builds. The factory has accumulated thousands of encoded improvements from experienced humans. New competitors starting from scratch cannot catch up — they have the same AI access, but none of the encoded craft.

**The moat is not the technology. The moat is the accumulated human knowledge encoded permanently into the system.**

That is what Ogilvy built. That is what FullStop is building.

---

*FullStop Human Intelligence Layer — v1 — May 2026*
*This document is reviewed and updated quarterly by the Quality Director team.*
