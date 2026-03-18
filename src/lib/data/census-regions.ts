export type RegionMeta = {
  id: string     // e.g. 'northeast'
  name: string   // e.g. 'Northeast'
  fips: string[] // member state FIPS codes (zero-padded)
}

export const CENSUS_REGIONS: RegionMeta[] = [
  {
    id: 'northeast',
    name: 'Northeast',
    fips: ['09', '23', '25', '33', '34', '36', '42', '44', '50'],
    // CT, ME, MA, NH, NJ, NY, PA, RI, VT
  },
  {
    id: 'midwest',
    name: 'Midwest',
    fips: ['17', '18', '19', '20', '26', '27', '29', '31', '38', '39', '46', '55'],
    // IL, IN, IA, KS, MI, MN, MO, NE, ND, OH, SD, WI
  },
  {
    id: 'south',
    name: 'South',
    fips: ['01', '05', '10', '11', '12', '13', '21', '22', '24', '28', '37', '40', '45', '47', '48', '51', '54'],
    // AL, AR, DE, DC, FL, GA, KY, LA, MD, MS, NC, OK, SC, TN, TX, VA, WV
  },
  {
    id: 'west',
    name: 'West',
    fips: ['02', '04', '06', '08', '15', '16', '30', '32', '35', '41', '49', '53', '56'],
    // AK, AZ, CA, CO, HI, ID, MT, NV, NM, OR, UT, WA, WY
  },
]

/** Returns a Map<fips, regionId> for O(1) state→region lookup. */
export function getFipsToRegion(): Map<string, string> {
  const map = new Map<string, string>()
  for (const region of CENSUS_REGIONS) {
    for (const fips of region.fips) {
      map.set(fips, region.id)
    }
  }
  return map
}
