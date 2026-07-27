import type { Rule } from "../types";
import { designRules } from "./design";
import { requirementsRules } from "./requirements";
import { tasksRules } from "./tasks";

export const allRules: Rule[] = [...requirementsRules, ...designRules, ...tasksRules];

export { designRules, requirementsRules, tasksRules };
