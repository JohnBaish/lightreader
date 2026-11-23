// A short explanation on the opening page, for people searching (SEO-HANDOVER step 9), modelled on
// standalone Backtimer's folded sections. Only shown before a postcode is chosen: Google always arrives
// with nothing saved, and "About these figures" covers the same ground once a postcode is chosen.
// Draft wording, for John (November 23rd 2026).

import { BAND_LABEL } from '../lib/bands.ts'

export function OpeningAbout() {
  return (
    <section className="opening-about" data-noprint>
      <h3>Free sunrise, sunset and twilight times for England</h3>
      <details>
        <summary>What does Lightreader show?</summary>
        <p>
          Type a postcode and Lightreader shows today’s sunrise and sunset, how much daylight there is, and when each
          stage of twilight starts and ends. It also shows the next 24 hours as a strip of light and dark, whether it’s
          light at times you choose, how the length of the day changes through the year, and how your times compare with
          other dates and places.
        </p>
        <p>
          The times are worked out in your browser for the middle of your postcode district, in UK clock time (GMT or
          BST).
        </p>
      </details>
      <details>
        <summary>Civil, nautical and astronomical twilight</summary>
        <p>
          The sky doesn’t go dark the moment the sun sets. Twilight is split into three stages by how far the sun is
          below the horizon, and Lightreader gives each one a plain name:
        </p>
        <ul>
          <li><i className="swatch band-half-light" /><b>{BAND_LABEL['half-light']}</b> (civil twilight): the sun is up to 6° below the horizon.</li>
          <li><i className="swatch band-dark" /><b>{BAND_LABEL['dark']}</b> (nautical twilight): 6° to 12° below.</li>
          <li><i className="swatch band-very-dark" /><b>{BAND_LABEL['very-dark']}</b> (astronomical twilight): 12° to 18° below.</li>
          <li><i className="swatch band-true-night" /><b>{BAND_LABEL['true-night']}</b>: more than 18° below, when the sky is as dark as it gets.</li>
        </ul>
        <p>
          For a few weeks around midsummer the sun never gets 18° below the horizon anywhere in England, so there’s no
          true night. The further north you are, the longer that lasts.
        </p>
      </details>
      <details>
        <summary>How do I use Lightreader?</summary>
        <ol>
          <li>Type your postcode, or just its first half (like RG1), and press Show.</li>
          <li>Scroll down for the next 24 hours, the weeks ahead and the whole year, and add times of day you want to check.</li>
          <li>Use Compare to set your times against another date, like Christmas, or another place.</li>
        </ol>
        <p>Your postcode is remembered on this device only. Nothing you type is sent anywhere.</p>
      </details>
    </section>
  )
}
