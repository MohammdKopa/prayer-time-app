// NRW cities served by the MVP — major population centres + the Ruhr towns
// Mohamed knows by name. All share Europe/Berlin tz, so no per-city tz field.
// Coordinates from OpenStreetMap city centroids.

export interface City {
  id: string;
  name: string;
  population: number;
  latitude: number;
  longitude: number;
}

export const NRW_TZ = "Europe/Berlin";

export const NRW_CITIES: City[] = [
  // Top 10 by population
  { id: "koeln",         name: "Köln",            population: 1085000, latitude: 50.9375, longitude: 6.9603 },
  { id: "duesseldorf",   name: "Düsseldorf",      population: 620000,  latitude: 51.2277, longitude: 6.7735 },
  { id: "dortmund",      name: "Dortmund",        population: 593000,  latitude: 51.5136, longitude: 7.4653 },
  { id: "essen",         name: "Essen",           population: 583000,  latitude: 51.4556, longitude: 7.0116 },
  { id: "duisburg",      name: "Duisburg",        population: 498000,  latitude: 51.4344, longitude: 6.7623 },
  { id: "bochum",        name: "Bochum",          population: 365000,  latitude: 51.4818, longitude: 7.2197 },
  { id: "wuppertal",     name: "Wuppertal",       population: 355000,  latitude: 51.2562, longitude: 7.1508 },
  { id: "bielefeld",     name: "Bielefeld",       population: 334000,  latitude: 52.0302, longitude: 8.5325 },
  { id: "bonn",          name: "Bonn",            population: 330000,  latitude: 50.7374, longitude: 7.0982 },
  { id: "muenster",      name: "Münster",         population: 316000,  latitude: 51.9607, longitude: 7.6261 },

  // 11–20
  { id: "moenchengladbach", name: "Mönchengladbach", population: 261000, latitude: 51.1805, longitude: 6.4428 },
  { id: "gelsenkirchen", name: "Gelsenkirchen",   population: 260000,  latitude: 51.5177, longitude: 7.0857 },
  { id: "aachen",        name: "Aachen",          population: 249000,  latitude: 50.7753, longitude: 6.0839 },
  { id: "krefeld",       name: "Krefeld",         population: 227000,  latitude: 51.3388, longitude: 6.5853 },
  { id: "oberhausen",    name: "Oberhausen",      population: 210000,  latitude: 51.4963, longitude: 6.8629 },
  { id: "hagen",         name: "Hagen",           population: 189000,  latitude: 51.3671, longitude: 7.4633 },
  { id: "hamm",          name: "Hamm",            population: 180000,  latitude: 51.6806, longitude: 7.8142 },
  { id: "muelheim",      name: "Mülheim a. d. Ruhr", population: 170000, latitude: 51.4275, longitude: 6.8825 },
  { id: "leverkusen",    name: "Leverkusen",      population: 165000,  latitude: 51.0459, longitude: 6.9881 },
  { id: "solingen",      name: "Solingen",        population: 160000,  latitude: 51.1730, longitude: 7.0844 },

  // 21–30 + Ruhr-area towns Mohamed knows
  { id: "herne",         name: "Herne",           population: 156000,  latitude: 51.5388, longitude: 7.2257 },
  { id: "neuss",         name: "Neuss",           population: 153000,  latitude: 51.1981, longitude: 6.6841 },
  { id: "paderborn",     name: "Paderborn",       population: 152000,  latitude: 51.7189, longitude: 8.7575 },
  { id: "bottrop",       name: "Bottrop",         population: 117000,  latitude: 51.5236, longitude: 6.9286 },
  { id: "remscheid",     name: "Remscheid",       population: 115000,  latitude: 51.1797, longitude: 7.1925 },
  { id: "recklinghausen", name: "Recklinghausen", population: 110000,  latitude: 51.6147, longitude: 7.1969 },
  { id: "siegen",        name: "Siegen",          population: 102000,  latitude: 50.8748, longitude: 8.0243 },
  { id: "guetersloh",    name: "Gütersloh",       population: 102000,  latitude: 51.9067, longitude: 8.3786 },
  { id: "witten",        name: "Witten",          population: 95000,   latitude: 51.4419, longitude: 7.3520 },
  { id: "iserlohn",      name: "Iserlohn",        population: 92000,   latitude: 51.3771, longitude: 7.6914 },

  // Marl + neighbours
  { id: "luenen",        name: "Lünen",           population: 86000,   latitude: 51.6157, longitude: 7.5266 },
  { id: "marl",          name: "Marl",            population: 84000,   latitude: 51.6564, longitude: 7.0907 },
  { id: "minden",        name: "Minden",          population: 81000,   latitude: 52.2885, longitude: 8.9166 },
  { id: "velbert",       name: "Velbert",         population: 81000,   latitude: 51.3340, longitude: 7.0411 },
  { id: "dorsten",       name: "Dorsten",         population: 75000,   latitude: 51.6606, longitude: 6.9647 },
  { id: "gladbeck",      name: "Gladbeck",        population: 75000,   latitude: 51.5739, longitude: 6.9852 },
  { id: "detmold",       name: "Detmold",         population: 74000,   latitude: 51.9374, longitude: 8.8775 },
  { id: "castrop",       name: "Castrop-Rauxel",  population: 73000,   latitude: 51.5503, longitude: 7.3119 },
  { id: "wesel",         name: "Wesel",           population: 60000,   latitude: 51.6586, longitude: 6.6147 },
];

export const DEFAULT_CITY_ID = "marl";

export function findCity(id: string): City | undefined {
  return NRW_CITIES.find((c) => c.id === id);
}

export const DEFAULT_CITY: City = findCity(DEFAULT_CITY_ID)!;
