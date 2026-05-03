import * as React from "react"
import { ChevronDown } from "lucide-react"

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

const Select: React.FC<SelectProps> = ({ children, value, onValueChange, className }) => {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      className={
        "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 className={className}"
      }
    >
      {children}
    </select>
  )
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
}

const SelectItem: React.FC<SelectItemProps> = ({ value, children }) => {
  return <option value={value}>{children}</option>
}

const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
  return placeholder ? <option value="">{placeholder}</option> : <></>
}

const SelectTrigger = Select
const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>

export {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
}
