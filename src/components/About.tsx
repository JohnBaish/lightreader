// "About these figures" (SPEC §2): the light labels with their technical names, where the
// figures come from, and how accurate they are. Draft wording, for John.

import { BANDS, BAND_LABEL, BAND_TECHNICAL } from '../lib/bands.ts'

const WHAT: Record<(typeof BANDS)[number], string> = {
  'daylight': 'The sun is up: from sunrise to sunset, when the top of the sun meets a flat horizon.',
  'half-light': 'The sun is just below the horizon, up to 6° down. Enough light to be out and about.',
  'dark': 'The sun is 6° to 12° below the horizon. Too dark for most things outdoors without a light.',
  'very-dark': 'The sun is 12° to 18° below the horizon. A faint glow may remain low in the sky.',
  'true-night': 'The sun is more than 18° below the horizon, and the sky is as dark as it gets.',
}

export function About() {
  return (
    <section className="card about">
      <h3>About these figures</h3>
      <dl>
        {BANDS.map((b) => (
          <div key={b} className="about-row">
            <dt><i className={`swatch band-${b}`} />{BAND_LABEL[b]}{BAND_TECHNICAL[b] && <span className="muted"> ({BAND_TECHNICAL[b]})</span>}</dt>
            <dd>{WHAT[b]}</dd>
          </div>
        ))}
      </dl>
      <p>
        The times are worked out in your browser for the middle of your postcode district, with Astronomy Engine, a
        free astronomy library. They're in UK clock time (GMT or BST), rounded to the nearest minute. Sunrise and sunset
        allow for the way the air bends the light near the horizon.
      </p>
      <p>
        They're accurate to within a minute or so of the published times. They assume a flat, open horizon: real hills,
        buildings and the weather aren't taken into account, and moving about 10 miles east or west changes the times by
        about a minute.
      </p>
    </section>
  )
}
