import type { MDXComponents } from "mdx/types";
import { Callout } from "@/components/mdx/Callout";
import { CompoundMeds } from "@/components/mdx/CompoundMeds";
import {
  MeAdmissionDischargeChart,
  MeImplementationChart,
  MePercentChangeChart,
} from "@/components/mdx/OpioidResultsCharts";
import { MorphineEquivalents } from "@/components/mdx/MorphineEquivalents";
import { OpioidDeathsChart } from "@/components/mdx/OpioidDeathsChart";
import { PatchDose } from "@/components/mdx/PatchDose";
import { PatientMeTracker } from "@/components/mdx/PatientMeTracker";
import { Tokenizer } from "@/components/mdx/Tokenizer";

const components: MDXComponents = {
  Callout,
  CompoundMeds,
  MeAdmissionDischargeChart,
  MeImplementationChart,
  MePercentChangeChart,
  MorphineEquivalents,
  OpioidDeathsChart,
  PatchDose,
  PatientMeTracker,
  Tokenizer,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
