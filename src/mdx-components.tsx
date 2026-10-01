import type { MDXComponents } from "mdx/types";
import { Callout } from "@/components/mdx/Callout";
import { CompoundMeds } from "@/components/mdx/CompoundMeds";
import {
  CorrectRejectionChart,
  ElectrodeMap,
  ErpAveraging,
  ErpResults,
} from "@/components/mdx/EegInteractive";
import { EegCapPhoto, EegPipeline, FaceMemoryTask } from "@/components/mdx/EegStatic";
import {
  MeAdmissionDischargeChart,
  MeImplementationChart,
  MePercentChangeChart,
} from "@/components/mdx/OpioidResultsCharts";
import { MorphineEquivalents } from "@/components/mdx/MorphineEquivalents";
import { OpioidDeathsChart } from "@/components/mdx/OpioidDeathsChart";
import { PatchDose } from "@/components/mdx/PatchDose";
import { PatientMeTracker } from "@/components/mdx/PatientMeTracker";
import { ReadmissionRates, RiskCalculator } from "@/components/mdx/ReadmissionInteractive";
import { DataElements, RiskScorecard, RocCurve, ScoreCalculation } from "@/components/mdx/ReadmissionMethods";
import { RiskDashboard } from "@/components/mdx/RiskDashboard";
import { Tokenizer } from "@/components/mdx/Tokenizer";

const components: MDXComponents = {
  Callout,
  CompoundMeds,
  CorrectRejectionChart,
  DataElements,
  EegCapPhoto,
  EegPipeline,
  ElectrodeMap,
  ErpAveraging,
  ErpResults,
  FaceMemoryTask,
  MeAdmissionDischargeChart,
  MeImplementationChart,
  MePercentChangeChart,
  MorphineEquivalents,
  OpioidDeathsChart,
  PatchDose,
  PatientMeTracker,
  ReadmissionRates,
  RiskCalculator,
  RiskDashboard,
  RiskScorecard,
  RocCurve,
  ScoreCalculation,
  Tokenizer,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
