# Website Test Plan and Results

Live site: https://aec9692.github.io/portfolio/  
Test date: November 2, 2026 (America/New_York)  
Browser: headless Chrome 156.0.8078.74, Playwright automation  
Viewports: phone **390 × 844**, laptop **1366 × 768**, device scale factor 1  
Accessibility tool: Lighthouse 12.8.2, mobile and desktop Accessibility audits

## Scope and evidence

Tests ran against the public GitHub Pages URLs, with live JavaScript and assets. All five HTML pages returned HTTP 200. Navigation was exercised from every page at both viewport sizes, including the home logos actually present on the deployed Projects and Contact pages. Screenshots of all ten page/viewport combinations were captured and visually reviewed. Form tests used synthetic visitor details; no emails were sent.

**The deployed site differs from the local repository.** Live Projects displays three placeholder project concepts. Mastercam screenshot links and the 3D viewer are local features that are not deployed, so their tests remain Not run. Physical phone testing and opening a draft in an external email app remain manual checks. Browser mailto requests, including decoded subject/body, were verified.

The remote main branch was observed at cc581076d1da74be451bf14750a3dd18d38e5b68. GitHub Pages did not expose a deployment SHA in these checks, so this is a reference branch commit rather than a verified deployment ID. Initial sandbox requests failed; live testing succeeded after network access was approved.

Evidence: [browser results](test-results/live-results.json), [keyboard and mailto checks](test-results/additional-results.json), [Lighthouse summary](test-results/lighthouse-summary.json), and [deployment notes](test-results/deployment-notes.txt). Individual Lighthouse JSON reports and full-page screenshots are saved in test-results/. The reusable test scripts are saved alongside them.

A first automation attempt had same-URL navigation timing errors. These were test-runner errors, not website failures. Its output is retained in [harness-first-attempt.json](test-results/harness-first-attempt.json); after the runner was corrected, all **43 browser checks** and **5 supplementary checks** passed. Tests with multiple viewport runs share a test ID below. The two accessibility defects are recorded separately as T47 and T48.

## Test cases

Main navigation means Home, About, Projects, Skills, and Contact. For each navigation test, return to the source page before activating the next link, include the current-page link, and repeat at both viewport sizes. Pass describes the stated live observation; it does not imply an undeployed feature was tested.

| ID | What is being tested | Steps to run the test on the live site | Expected result | Actual result |
| :-- | :-- | :-- | :-- | :-- |
| T1 | Home navigation | Open `index.html`. Click Home, About, Projects, Skills, and Contact individually at both viewport sizes. | Every link opens the matching page without a 404; Home is marked as current on Home. | Pass — observed on the live site; evidence in test-results/live-results.json. |
| T2 | About navigation | Open `about.html`. Click all five main-navigation links individually at both sizes. | All destinations load correctly; About is marked as current on About. | Pass — observed on the live site; evidence in test-results/live-results.json. |
| T3 | Projects navigation | Open `projects.html`. Click all five main-navigation links individually at both sizes. | All destinations load correctly; Projects is marked as current on Projects. | Pass — observed on the live site; evidence in test-results/live-results.json. |
| T4 | Skills navigation | Open `skills.html`. Click all five main-navigation links individually at both sizes. | All destinations load correctly; Skills is marked as current on Skills. | Pass — observed on the live site; evidence in test-results/live-results.json. |
| T5 | Contact navigation | Open `contact.html`. Click all five main-navigation links and the `a.` home logo individually at both sizes. | All destinations load correctly; the logo opens Home; Contact is marked as current on Contact. | Pass — observed on the live site; evidence in test-results/live-results.json. |
| T6 | Home action links | On Home, click Explore my projects and Get to know me separately at both sizes. | The links open Projects and About respectively. | Pass — observed on the live site; evidence in test-results/live-results.json. |
| T7 | Skills section links | On Skills, click Technical skills and Professional skills at both sizes. | Each link scrolls to its matching section and updates the URL fragment appropriately. | Pass — observed on the live site; evidence in test-results/live-results.json. |
| T8 | Project screenshot links | On Projects, open View Mastercam screenshot for 4X Lesson 4, Titan 9M, and Titan 8M individually. | Each opens the correct, readable image in a new tab without a missing-file error. | Not run — Mastercam screenshot links are not deployed; live Projects has placeholder cards. |
| T9 | Direct email link | On live Contact, activate the direct email link and inspect the browser navigation request. | Browser requests mailto:aec9692@njit.edu. External mail app integration is a separate manual check. | Pass — correct mailto navigation request observed; external email app not tested. |
| T10 | Home on phone | Set 390 × 844, reload Home, and inspect the full page and scenery controls. | Text, navigation, images, and controls fit without overlap, clipping, or horizontal page scrolling. | Pass — observed on the live site; evidence in test-results/live-results.json. |
| T11 | About on phone | At 390 × 844, reload About and scroll through all sections. | All biography and education content is readable, with no overlap or horizontal scrolling. | Pass — observed on the live site; evidence in test-results/live-results.json. |
| T12 | Projects on phone | At 390 × 844, reload live Projects and inspect all deployed cards. | Cards fit, images load, and content remains readable without horizontal page scrolling. | Pass — deployed placeholder cards fit; 3D dialog is not deployed. |
| T13 | Skills on phone | At 390 × 844, reload Skills and scroll through both skill sections. | Cards and section links remain readable and usable without horizontal scrolling. | Pass — observed on the live site; evidence in test-results/live-results.json. |
| T14 | Contact on phone | At 390 × 844, reload Contact, focus each field, and scroll to submit. | Labels, inputs, validation feedback, and submit button fit and remain usable. | Pass — observed on the live site; evidence in test-results/live-results.json. |
| T15 | Home on laptop | Set 1366 × 768, reload Home, and inspect all content and controls. | Navigation, scenery, text, and action links display without clipping or overlap. | Pass — observed on the live site; evidence in test-results/live-results.json. |
| T16 | About on laptop | At 1366 × 768, reload About and scroll through the page. | All sections display clearly with readable text and consistent spacing. | Pass — observed on the live site; evidence in test-results/live-results.json. |
| T17 | Projects on laptop | At 1366 × 768, reload live Projects and inspect all deployed cards. | Cards and headings fit and remain readable without horizontal page scrolling. | Pass — deployed placeholder cards fit; 3D dialog is not deployed. |
| T18 | Skills on laptop | At 1366 × 768, reload Skills and inspect both sections. | Skill cards and headings align clearly and remain readable. | Pass — observed on the live site; evidence in test-results/live-results.json. |
| T19 | Contact on laptop | At 1366 × 768, reload Contact and inspect and focus every field. | The layout, labels, fields, and submit button are readable and usable. | Pass — observed on the live site; evidence in test-results/live-results.json. |
| T20 | Home keyboard navigation | Reload Home. Use Tab through every navigation link, action link, scenery button, and pause button. Use Enter to activate each. | Focus is visible, follows a logical order, and reaches and activates every control without a keyboard trap. | Pass — observed on the live site; evidence in test-results/live-results.json. |
| T21 | About keyboard navigation | Reload About. Use Tab through every link and Enter to activate each. | Focus is visible and logical; every link works without a keyboard trap. | Pass — observed on the live site; evidence in test-results/live-results.json. |
| T22 | Projects keyboard navigation | On live Projects, use Tab and Enter on every deployed link at both sizes. After viewer deployment, also test selector, controls, Escape, and focus restoration. | Deployed links have visible focus and work without a trap. Dialog behavior remains pending until deployment. | Pass — all deployed links work with Tab/Enter at both sizes; dialog checks await deployment. |
| T23 | Skills keyboard navigation | Use Tab through the main navigation and both section links. Activate each with Enter. | Focus is visible and logical; navigation and section links work without a keyboard trap. | Pass — observed on the live site; evidence in test-results/live-results.json. |
| T24 | Contact keyboard navigation | Use Tab through navigation, the email link, every form field, and submit. Fill fields using the keyboard and activate submit with Enter. | Focus is visible and logical; all fields and links are reachable and form feedback is accessible. | Pass — observed on the live site; evidence in test-results/live-results.json. |
| T25 | Scenery selection | On Home, select Forest, Peaks, then Lakeside. Repeat on phone and laptop. | Each choice loads the matching image; exactly one choice has `aria-pressed="true"`. No script or image-loading errors occur. | Pass — observed on the live site; evidence in test-results/live-results.json. |
| T26 | Scenery pause and pointer movement | On laptop, move the pointer over the scenery; pause, move again, then play and move again. Move the pointer outside the scene. | Motion responds while playing, stops while paused, and resets on pointer exit; button text and pressed state match the setting. | Pass — observed on the live site; evidence in test-results/live-results.json. |
| T27 | Reduced-motion preference | Enable reduced motion in browser rendering settings before loading Home and Projects. Change the preference while Home is open. | Home starts paused and follows preference changes; project preview rotation stops with reduced motion enabled. Controls remain usable. | Pass — Home starts paused and responds to preference changes; no live project animation exists. |
| T28 | JavaScript page content and titles | Directly load and refresh all five page URLs. Inspect the tab title and main content; check console errors. | Each page displays its own content and appropriate title; the four secondary pages populate correctly without uncaught script errors. | Pass — observed on the live site; evidence in test-results/live-results.json. |
| T29 | Empty form | On Contact, leave all fields empty and submit. | Required-field feedback prevents an email draft from opening. | Pass — observed on the live site; evidence in test-results/live-results.json. |
| T30 | Invalid email | Enter `Test Visitor`, email `not-an-email`, and message `Hello, I have a project question.`; submit. | Email validation blocks submission and identifies the email field. | Pass — observed on the live site; evidence in test-results/live-results.json. |
| T31 | Short and whitespace-only input | Submit a message of `Hi`, then ten spaces; separately try a name containing only spaces with otherwise valid fields. | Each invalid attempt is blocked; the message needs at least ten trimmed characters and the name cannot be blank after trimming. | Pass — observed on the live site; evidence in test-results/live-results.json. |
| T32 | Invalid optional phone | With other fields valid, submit phone `abc123`, then `123`. | Both attempts are blocked with phone validation feedback. | Pass — observed on the live site; evidence in test-results/live-results.json. |
| T33 | Valid form with no phone | Enter Test Visitor, visitor@example.com, message Hello, I have a project question., and no phone; submit and capture the browser mailto navigation intent. | Browser requests the correct recipient, name-based subject, message, reply address, and Not provided phone, and shows draft status. | Pass — valid input accepted and recipient, subject, and decoded body verified in browser mailto request. |
| T34 | Valid phone and corrected validation | First trigger T32. Correct the phone to `+1 (201) 555-0123` and resubmit with all other fields valid. | The earlier custom error clears; the valid phone is accepted and draft status appears. | Pass — editing clears the custom error and a valid phone is accepted. |
| T35 | Message boundary and encoded characters | With valid name/email, submit `1234567890` as the message. Repeat using name `Alex & Sam` and message `Question about A&B? Please reply.`. | Ten-character message is accepted; special characters are preserved in the browser mailto request. | Pass — 10-character message accepted; special characters preserved in mailto subject/body. |
| T36 | Project previews and lazy loading | Reload Projects and click a preview immediately. Close it, then open the other two previews. | The viewer loads even on the first early click; every card opens the corresponding model without duplicate dialogs or uncaught errors. | Not run — 3D viewer is not present on the live site. |
| T37 | Model selection and loading states | In the viewer, choose 4X Lesson 4, Titan 8M, and Titan 9M individually. Wait for each load. | Available models render correctly. A missing export produces a clear status message and safe disabled controls rather than a crash; record any unavailable model explicitly. | Not run — 3D viewer is not present on the live site. |
| T38 | Model toolbar controls | With a loaded model, activate Rotate left, Rotate right, Zoom in, Zoom out, Reset view, and Wireframe twice. | Each control performs its named action; reset restores the starting view; wireframe toggles and its pressed state updates. | Not run — 3D viewer is not present on the live site. |
| T39 | Model pointer and touch controls | On laptop, drag to rotate, scroll to zoom, and right-drag to pan. On a touch device, drag and pinch inside the viewer. | The model responds to the documented gestures while controls remain usable. | Not run — 3D viewer is not present on the live site. |
| T40 | Viewer dismissal | Open each preview; close using Close viewer, Escape, and the backdrop in separate attempts. Reopen after each dismissal. | Each dismissal works; page scrolling is restored and the viewer can reopen normally. | Not run — 3D viewer is not present on the live site. |
| T41 | Viewer error handling | In DevTools, block an STL request and reload/open the model. Separately simulate WebGL context loss if supported. Remove blocking and reload afterward. | A readable failure or interruption status appears; failed loading does not leave unsafe active controls; normal viewing recovers after reloading. | Not run — 3D viewer is not present on the live site. |
| T42 | Home Lighthouse Accessibility | Open live Home. In DevTools Lighthouse, select Accessibility and Mobile; run and save the report. Repeat in Desktop mode. | Both scores are recorded, meet the project target of at least 90/100, and any reported accessibility defects are reviewed. | Pass — Mobile 100/100; desktop 100/100. Both meet the 90 target. |
| T43 | About Lighthouse Accessibility | Run and save mobile and desktop Lighthouse Accessibility reports for live `about.html`. | Both scores are recorded and meet the 90/100 project target; findings are reviewed. | Pass — Mobile 100/100; desktop 100/100. Both meet the 90 target. |
| T44 | Projects Lighthouse Accessibility | Run and save mobile and desktop Lighthouse Accessibility reports for live `projects.html`; manually inspect the open dialog using T22 as well. | Both scores are recorded and meet the 90/100 project target; findings are reviewed. | Pass — Mobile 98/100; desktop 98/100. Both meet the 90 target. |
| T45 | Skills Lighthouse Accessibility | Run and save mobile and desktop Lighthouse Accessibility reports for live `skills.html`. | Both scores are recorded and meet the 90/100 project target; findings are reviewed. | Pass — Mobile 100/100; desktop 100/100. Both meet the 90 target. |
| T46 | Contact Lighthouse Accessibility | Run and save mobile and desktop Lighthouse Accessibility reports for live `contact.html`; manually check validation using T29–T35 as well. | Both scores are recorded and meet the 90/100 project target; findings are reviewed. | Pass — Mobile 95/100; desktop 95/100. Both meet the 90 target. |
| T47 | Projects heading hierarchy | Run live Projects Lighthouse Accessibility in mobile and desktop modes; inspect heading-order findings. | Heading levels follow a logical sequence without skipping h2. | Fail — live cards jump from h1 to h3; flagged in both reports. |
| T48 | Contact optional-label contrast | Run live Contact Lighthouse Accessibility in mobile and desktop modes; inspect color-contrast findings. | Small text contrast is at least 4.5:1. | Fail — optional label is 4.39:1; flagged in both reports. |

## Lighthouse Accessibility scores

The acceptance target is at least 90/100. Meeting this score does not mean that every accessibility audit passes. Projects and Contact meet the target but have the defects recorded above.

| Page | Mobile | Desktop | Findings |
| :-- | --: | --: | :-- |
| index.html | 100 | 100 | No failed weighted Accessibility audits |
| about.html | 100 | 100 | No failed weighted Accessibility audits |
| projects.html | 98 | 98 | Skipped heading level (T47) |
| skills.html | 100 | 100 | No failed weighted Accessibility audits |
| contact.html | 95 | 95 | Optional-label contrast (T48) |

## Failures, fixes, and live retests

Initial failures are retained. The following fixes are made in local source, **have not been published**, and therefore have no passing live retest yet. No new Lighthouse score is claimed for the fixes.

| Test ID | Initial live result | Local fix | Verification | Live retest |
| :-- | :-- | :-- | :-- | :-- |
| T47 | Fail — h1 followed by h3 in placeholder project cards; mobile/desktop score 98. | Changed shared placeholder card headings to h2 in script.js and retained their font size using .project h2 in styles.css. The newer local Mastercam cards already use h2. | Node syntax check passed. | Not run — fix awaits deployment. |
| T48 | Fail — optional label contrast 4.39:1; mobile/desktop score 95. | Darkened .contact-card .optional from #6d7965 to #596550 in styles.css. | Source change inspected; live audit remains unchanged until publication. | Not run — fix awaits deployment. |

## Remaining checks

- Publish the intended local version, then rerun the live suite and Lighthouse; keep the original failures and add dated retest results.
- Execute T8 and T36–T41 after the Mastercam content and viewer are deployed; repeat Projects layout and keyboard dialog checks.
- Verify the external email app opens the draft correctly on a configured device. The browser's mailto request has passed.
- Check actual touch gestures on a physical phone when the viewer is deployed.

The assignment's complete failure-fix-live-retest cycle remains pending publication. Current results describe the live version tested on November 2, 2026.
