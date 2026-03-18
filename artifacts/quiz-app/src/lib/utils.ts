import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper to split a question string by {{answer}} into segments
export function parseQuestionText(text: string) {
  const segments = text.split(/\{\{answer\}\}/g);
  return segments;
}
