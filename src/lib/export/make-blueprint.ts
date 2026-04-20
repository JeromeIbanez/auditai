import { StepType } from '@/lib/types'

type Step = {
  order: number
  type: StepType
  tool: string | null
  title: string
  description: string
  prompt: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MakeModule = Record<string, any>

function buildModule(step: Step, index: number): MakeModule {
  const id = index + 1
  const x = index * 300
  const designer = { x, y: 0 }
  const tool = step.tool ? ` [${step.tool}]` : ''
  const prevData = index > 0 ? `{{${index}.data}}` : '[INPUT_DATA]'

  switch (step.type) {
    case 'TRIGGER':
      // Webhook trigger — swap for the real app trigger in Make (e.g. Zendesk, HubSpot)
      return {
        id,
        module: 'gateway:CustomWebHook',
        version: 1,
        parameters: { hook: null, maxResults: 1 },
        mapper: {},
        metadata: {
          designer,
          restore: { parameters: { hook: { label: `⚡ TRIGGER: ${step.title}${tool} — swap for native ${step.tool ?? 'app'} trigger module` } } },
        },
      }

    case 'AI':
      // HTTP request to Anthropic — swap for OpenAI module or keep as HTTP
      return {
        id,
        module: 'http:ActionSendData',
        version: 3,
        parameters: {},
        mapper: {
          url: 'https://api.anthropic.com/v1/messages',
          method: 'POST',
          headers: [
            { name: 'x-api-key', value: '[YOUR_ANTHROPIC_API_KEY]' },
            { name: 'anthropic-version', value: '2023-06-01' },
            { name: 'content-type', value: 'application/json' },
          ],
          bodyType: 'raw',
          contentType: 'application/json',
          body: JSON.stringify({
            model: 'claude-opus-4-5',
            max_tokens: 1024,
            system: step.prompt ?? step.description,
            messages: [{ role: 'user', content: prevData }],
          }, null, 2),
        },
        metadata: {
          designer,
          restore: { parameters: { label: `🤖 AI: ${step.title} — HTTP → Anthropic API (swap for OpenAI module if preferred)` } },
        },
      }

    case 'HUMAN':
      // Email notification to prompt the human reviewer
      return {
        id,
        module: 'gateway:CustomWebHook',
        version: 1,
        parameters: { hook: null, maxResults: 1 },
        mapper: {},
        metadata: {
          designer,
          restore: {
            parameters: {
              hook: {
                label: `🙋 HUMAN: ${step.title}${tool} — send notification (email/Slack), then wait for approval webhook`,
              },
            },
          },
        },
      }

    case 'INTEGRATION':
      // HTTP stub — swap for the real app module (e.g. Zendesk, HubSpot, Notion)
      return {
        id,
        module: 'http:ActionSendData',
        version: 3,
        parameters: {},
        mapper: {
          url: `[${step.tool?.toUpperCase().replace(/\s+/g, '_') ?? 'TOOL'}_API_ENDPOINT]`,
          method: 'POST',
          headers: [
            { name: 'Content-Type', value: 'application/json' },
            { name: 'Authorization', value: `[${step.tool?.toUpperCase().replace(/\s+/g, '_') ?? 'TOOL'}_API_KEY]` },
          ],
          bodyType: 'raw',
          contentType: 'application/json',
          body: JSON.stringify({ data: prevData }, null, 2),
        },
        metadata: {
          designer,
          restore: { parameters: { label: `🔌 INTEGRATION: ${step.title}${tool} — swap HTTP stub for native ${step.tool ?? 'tool'} module` } },
        },
      }

    case 'OUTPUT':
      // HTTP stub — swap for Slack, email, Notion, or wherever the output goes
      return {
        id,
        module: 'http:ActionSendData',
        version: 3,
        parameters: {},
        mapper: {
          url: `[OUTPUT_DESTINATION_URL]`,
          method: 'POST',
          headers: [{ name: 'Content-Type', value: 'application/json' }],
          bodyType: 'raw',
          contentType: 'application/json',
          body: JSON.stringify({ result: prevData }, null, 2),
        },
        metadata: {
          designer,
          restore: { parameters: { label: `📤 OUTPUT: ${step.title}${tool} — swap HTTP stub for Slack / email / storage module` } },
        },
      }
  }
}

export function generateMakeBlueprint(workflow: {
  taskName: string
  summary: string | null
  steps: Step[]
}): object {
  const sorted = [...workflow.steps].sort((a, b) => a.order - b.order)
  const flow = sorted.map((step, i) => buildModule(step, i))

  return {
    name: `AuditAI: ${workflow.taskName}`,
    flow,
    metadata: {
      instant: false,
      version: 1,
      scenario: {
        roundtrips: 1,
        maxErrors: 3,
        autoCommit: true,
        autoCommitTriggerLast: true,
        sequential: false,
        confidential: false,
        dataloss: false,
        dlq: false,
        freshVariables: false,
      },
      designer: { orphans: [] },
      zone: 'eu1.make.com',
    },
  }
}
