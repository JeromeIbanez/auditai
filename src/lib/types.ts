export const DEPARTMENTS = [
  'Sales',
  'Marketing',
  'Customer Support',
  'Product',
  'Engineering',
  'Operations',
  'HR',
  'Finance',
  'Legal',
] as const

export type Department = (typeof DEPARTMENTS)[number]

export type AuditContextInput = {
  company: string
  department: string
  teamSize: number
  tools: string[]
}

export type TaskInput = {
  id: string
  name: string
  // 6 scoring dimensions (1–3)
  taskVolume: number
  repeatability: number
  dataSensitivity: number
  timeCost: number
  errorRisk: number
  currentTooling: number
}

export type WizardState = {
  step: 0 | 1 | 2 | 3
  context: AuditContextInput
  tasks: TaskInput[]
}
