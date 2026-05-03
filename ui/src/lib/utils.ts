import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Be - shorthand for class merger (used in Stream component)
export function Be(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
