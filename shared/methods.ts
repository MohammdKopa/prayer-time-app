import {
  CalculationMethod,
  CalculationParameters,
  Madhab,
} from "adhan";

export type MethodId =
  | "MWL"
  | "ISNA"
  | "Egyptian"
  | "UmmAlQura"
  | "Turkey"
  | "MoonsightingCommittee"
  | "Hanafi";

export interface MethodDef {
  id: MethodId;
  label: string;
  shortLabel: string;
  params: () => CalculationParameters;
}

const withMadhab = (
  factory: () => CalculationParameters,
  madhab: (typeof Madhab)[keyof typeof Madhab],
) => {
  return () => {
    const p = factory();
    p.madhab = madhab;
    return p;
  };
};

export const METHODS: Record<MethodId, MethodDef> = {
  MWL: {
    id: "MWL",
    label: "رابطة العالم الإسلامي",
    shortLabel: "رابطة العالم",
    params: withMadhab(CalculationMethod.MuslimWorldLeague, Madhab.Shafi),
  },
  ISNA: {
    id: "ISNA",
    label: "الجمعية الإسلامية لأمريكا الشمالية",
    shortLabel: "إيسنا",
    params: withMadhab(CalculationMethod.NorthAmerica, Madhab.Shafi),
  },
  Egyptian: {
    id: "Egyptian",
    label: "الهيئة المصرية العامة للمساحة",
    shortLabel: "المصرية",
    params: withMadhab(CalculationMethod.Egyptian, Madhab.Shafi),
  },
  UmmAlQura: {
    id: "UmmAlQura",
    label: "أم القرى، مكة المكرمة",
    shortLabel: "أم القرى",
    params: withMadhab(CalculationMethod.UmmAlQura, Madhab.Shafi),
  },
  Turkey: {
    id: "Turkey",
    label: "ديانت — رئاسة الشؤون الدينية",
    shortLabel: "ديانت",
    params: withMadhab(CalculationMethod.Turkey, Madhab.Shafi),
  },
  MoonsightingCommittee: {
    id: "MoonsightingCommittee",
    label: "لجنة رؤية الهلال",
    shortLabel: "لجنة الهلال",
    params: withMadhab(CalculationMethod.MoonsightingCommittee, Madhab.Shafi),
  },
  Hanafi: {
    id: "Hanafi",
    label: "الحنفي (عصر مضاعف الظل)",
    shortLabel: "الحنفي",
    params: withMadhab(CalculationMethod.MuslimWorldLeague, Madhab.Hanafi),
  },
};

export const PRIMARY_METHOD: MethodId = "MWL";

export const CONSENSUS_METHOD_IDS: MethodId[] = [
  "MWL",
  "ISNA",
  "Egyptian",
  "UmmAlQura",
  "Turkey",
  "MoonsightingCommittee",
  "Hanafi",
];
