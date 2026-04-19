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

export const INDUSTRIES = [
  'SaaS / Software',
  'E-commerce',
  'Healthcare',
  'Financial Services',
  'Agency / Consulting',
  'Education',
  'Real Estate',
  'Media / Content',
  'Manufacturing',
  'Other',
] as const

export type Department = (typeof DEPARTMENTS)[number]
export type Industry = (typeof INDUSTRIES)[number]

export type StepType = 'TRIGGER' | 'AI' | 'HUMAN' | 'INTEGRATION' | 'OUTPUT'

export type AuditContextInput = {
  department: string
  teamSize: number
  tools: string[]
}

export type TaskInput = {
  id: string
  name: string
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

export type UserProfile = {
  companyName: string
  industry: string
  tools: string[]
  onboarded: boolean
}
