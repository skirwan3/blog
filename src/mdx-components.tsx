import type { MDXComponents } from "mdx/types";
import { Callout } from "@/components/mdx/Callout";
import { Tokenizer } from "@/components/mdx/Tokenizer";

const components: MDXComponents = {
  Callout,
  Tokenizer,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
