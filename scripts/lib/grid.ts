// Latitude and longitude (WGS84, as GPS gives them) to and from British National
// Grid eastings and northings (as OS Open Names gives them). The standard Ordnance
// Survey method: a Helmert shift between WGS84 and OSGB36, and a Transverse Mercator
// projection. Accurate to about 5 metres; a postcode district's sun times move by a
// second for about 300 metres east or west. Copied from Hindcaster (2026-10-27),
// where `toBritishGrid` was checked against the Environment Agency's own coordinates
// for every rain gauge; `fromBritishGrid` added here, and `npm run check` tests that
// it undoes `toBritishGrid`.

const RAD = Math.PI / 180

// WGS84 and the Airy 1830 ellipsoid that OSGB36 uses
const WGS84 = { a: 6378137, b: 6356752.3142 }
const AIRY = { a: 6377563.396, b: 6356256.909 }

// Helmert transformation, WGS84 to OSGB36
const TX = -446.448
const TY = 125.157
const TZ = -542.06
const S = 20.4894e-6
const RX = (-0.1502 / 3600) * RAD
const RY = (-0.247 / 3600) * RAD
const RZ = (-0.8421 / 3600) * RAD

// The National Grid projection
const F0 = 0.9996012717
const PHI0 = 49 * RAD
const LAMBDA0 = -2 * RAD
const E0 = 400000
const N0 = -100000

export function toBritishGrid(latitude: number, longitude: number): { easting: number; northing: number } {
  const phi = latitude * RAD
  const lambda = longitude * RAD

  // To Cartesian on WGS84
  const e2w = 1 - (WGS84.b * WGS84.b) / (WGS84.a * WGS84.a)
  const nuw = WGS84.a / Math.sqrt(1 - e2w * Math.sin(phi) ** 2)
  const x1 = nuw * Math.cos(phi) * Math.cos(lambda)
  const y1 = nuw * Math.cos(phi) * Math.sin(lambda)
  const z1 = nuw * (1 - e2w) * Math.sin(phi)

  // Helmert shift
  const x2 = TX + (1 + S) * x1 - RZ * y1 + RY * z1
  const y2 = TY + RZ * x1 + (1 + S) * y1 - RX * z1
  const z2 = TZ - RY * x1 + RX * y1 + (1 + S) * z1

  // Back to latitude and longitude, on the Airy ellipsoid
  const e2 = 1 - (AIRY.b * AIRY.b) / (AIRY.a * AIRY.a)
  const p = Math.hypot(x2, y2)
  let lat = Math.atan2(z2, p * (1 - e2))
  for (let i = 0; i < 10; i++) {
    const nu = AIRY.a / Math.sqrt(1 - e2 * Math.sin(lat) ** 2)
    lat = Math.atan2(z2 + e2 * nu * Math.sin(lat), p)
  }
  const lon = Math.atan2(y2, x2)

  // Transverse Mercator
  const n = (AIRY.a - AIRY.b) / (AIRY.a + AIRY.b)
  const nu = AIRY.a * F0 / Math.sqrt(1 - e2 * Math.sin(lat) ** 2)
  const rho = (AIRY.a * F0 * (1 - e2)) / (1 - e2 * Math.sin(lat) ** 2) ** 1.5
  const eta2 = nu / rho - 1
  const dPhi = lat - PHI0
  const sPhi = lat + PHI0
  const M =
    AIRY.b * F0 *
    ((1 + n + (5 / 4) * n ** 2 + (5 / 4) * n ** 3) * dPhi -
      (3 * n + 3 * n ** 2 + (21 / 8) * n ** 3) * Math.sin(dPhi) * Math.cos(sPhi) +
      ((15 / 8) * n ** 2 + (15 / 8) * n ** 3) * Math.sin(2 * dPhi) * Math.cos(2 * sPhi) -
      (35 / 24) * n ** 3 * Math.sin(3 * dPhi) * Math.cos(3 * sPhi))
  const sin = Math.sin(lat)
  const cos = Math.cos(lat)
  const tan2 = Math.tan(lat) ** 2
  const I = M + N0
  const II = (nu / 2) * sin * cos
  const III = (nu / 24) * sin * cos ** 3 * (5 - tan2 + 9 * eta2)
  const IIIA = (nu / 720) * sin * cos ** 5 * (61 - 58 * tan2 + tan2 ** 2)
  const IV = nu * cos
  const V = (nu / 6) * cos ** 3 * (nu / rho - tan2)
  const VI = (nu / 120) * cos ** 5 * (5 - 18 * tan2 + tan2 ** 2 + 14 * eta2 - 58 * tan2 * eta2)
  const dl = lon - LAMBDA0

  return {
    northing: I + II * dl ** 2 + III * dl ** 4 + IIIA * dl ** 6,
    easting: E0 + IV * dl + V * dl ** 3 + VI * dl ** 5,
  }
}

/** British National Grid to latitude and longitude (WGS84): `toBritishGrid` in
 *  reverse (Ordnance Survey's inverse Transverse Mercator, then the Helmert shift
 *  back). */
export function fromBritishGrid(easting: number, northing: number): { latitude: number; longitude: number } {
  const e2 = 1 - (AIRY.b * AIRY.b) / (AIRY.a * AIRY.a)
  const n = (AIRY.a - AIRY.b) / (AIRY.a + AIRY.b)

  // Inverse Transverse Mercator, on the Airy ellipsoid
  let lat = PHI0
  let M = 0
  do {
    lat = (northing - N0 - M) / (AIRY.a * F0) + lat
    const dPhi = lat - PHI0
    const sPhi = lat + PHI0
    M =
      AIRY.b * F0 *
      ((1 + n + (5 / 4) * n ** 2 + (5 / 4) * n ** 3) * dPhi -
        (3 * n + 3 * n ** 2 + (21 / 8) * n ** 3) * Math.sin(dPhi) * Math.cos(sPhi) +
        ((15 / 8) * n ** 2 + (15 / 8) * n ** 3) * Math.sin(2 * dPhi) * Math.cos(2 * sPhi) -
        (35 / 24) * n ** 3 * Math.sin(3 * dPhi) * Math.cos(3 * sPhi))
  } while (Math.abs(northing - N0 - M) >= 0.00001)
  const sin = Math.sin(lat)
  const cos = Math.cos(lat)
  const tan = Math.tan(lat)
  const nu = AIRY.a * F0 / Math.sqrt(1 - e2 * sin ** 2)
  const rho = (AIRY.a * F0 * (1 - e2)) / (1 - e2 * sin ** 2) ** 1.5
  const eta2 = nu / rho - 1
  const VII = tan / (2 * rho * nu)
  const VIII = (tan / (24 * rho * nu ** 3)) * (5 + 3 * tan ** 2 + eta2 - 9 * tan ** 2 * eta2)
  const IX = (tan / (720 * rho * nu ** 5)) * (61 + 90 * tan ** 2 + 45 * tan ** 4)
  const X = 1 / (cos * nu)
  const XI = (1 / (cos * 6 * nu ** 3)) * (nu / rho + 2 * tan ** 2)
  const XII = (1 / (cos * 120 * nu ** 5)) * (5 + 28 * tan ** 2 + 24 * tan ** 4)
  const XIIA = (1 / (cos * 5040 * nu ** 7)) * (61 + 662 * tan ** 2 + 1320 * tan ** 4 + 720 * tan ** 6)
  const dE = easting - E0
  const phi = lat - VII * dE ** 2 + VIII * dE ** 4 - IX * dE ** 6
  const lambda = LAMBDA0 + X * dE - XI * dE ** 3 + XII * dE ** 5 - XIIA * dE ** 7

  // To Cartesian on Airy
  const nuA = AIRY.a / Math.sqrt(1 - e2 * Math.sin(phi) ** 2)
  const x1 = nuA * Math.cos(phi) * Math.cos(lambda)
  const y1 = nuA * Math.cos(phi) * Math.sin(lambda)
  const z1 = nuA * (1 - e2) * Math.sin(phi)

  // Helmert shift back, OSGB36 to WGS84 (the same parameters, signs reversed)
  const x2 = -TX + (1 - S) * x1 + RZ * y1 - RY * z1
  const y2 = -TY - RZ * x1 + (1 - S) * y1 + RX * z1
  const z2 = -TZ + RY * x1 - RX * y1 + (1 - S) * z1

  // Back to latitude and longitude, on WGS84
  const e2w = 1 - (WGS84.b * WGS84.b) / (WGS84.a * WGS84.a)
  const p = Math.hypot(x2, y2)
  let latW = Math.atan2(z2, p * (1 - e2w))
  for (let i = 0; i < 10; i++) {
    const nuw = WGS84.a / Math.sqrt(1 - e2w * Math.sin(latW) ** 2)
    latW = Math.atan2(z2 + e2w * nuw * Math.sin(latW), p)
  }
  return { latitude: latW / RAD, longitude: Math.atan2(y2, x2) / RAD }
}
