/*
 * 4B-2 — secondary pages and secondary surfaces, and their REAL user entry points.
 * Verified against runtime (local HEAD == deployed app.js). Activation is always a real,
 * visible user interaction: role + accessible name (getByRole). Never inline onclick,
 * never window.activateTab, never a V3-specific class name.
 *
 * The Clubhouse V3 icons are native <button aria-label="…"> (converted in app.js for 4B-2).
 * Side-icons carry aria-controls="tab-<root>"; modal-icons carry aria-haspopup="dialog".
 */

/** Secondary pages reached by clicking a visible V3 icon button on Clubhouse. */
export interface IconPage {
  name: string;        // accessible name on the button (aria-label)
  key: string;         // body[data-tab] value / #tab-<key>
  root: string;        // section root
  activation: 'enter' | 'space' | 'click';
}

export const ICON_PAGES: IconPage[] = [
  { name: 'Rounds',    key: 'rounds',    root: '#tab-rounds',    activation: 'enter' },  // keyboard: Enter
  { name: 'Rivals',    key: 'friends',   root: '#tab-friends',   activation: 'space' },  // keyboard: Space; technical key stays 'friends'
  { name: 'Trophies',  key: 'trophies',  root: '#tab-trophies',  activation: 'click' },
  { name: 'Approvals', key: 'approvals', root: '#tab-approvals', activation: 'click' },
];

/*
 * Profile/Settings pages are cloud-gated (finding R): logged-out, the profile chip opens the
 * auth flow, not the profile menu, and the native Edit profile/Settings buttons only render for
 * a logged-in user. Stats is orphaned (finding S). Neither is deterministically reachable in the
 * empty/logged-out state the suite runs in, so neither is contracted in 4B-2. They move to a
 * later step once an authenticated fixture / a real Stats entry exists.
 */

/** Secondary SURFACES: visible icon buttons that open the shared modal, NOT a page. */
export interface ModalButton {
  name: string;   // aria-label
}
export const MODAL_BUTTONS: ModalButton[] = [
  { name: 'Insights' },   // openAdvancedInsights()
  { name: 'Handicap' },   // openHcOverview()
];

/** Shared modal DOM (verified: exactly one #modal inside #modal-bg; .open toggles visibility). */
export const MODAL = { backdrop: '#modal-bg', content: '#modal' };

/** Orphaned/legacy — deliberately NOT given a page contract in 4B-2. */
export const ORPHANED = ['#tab-insights', '#tab-courses'];
