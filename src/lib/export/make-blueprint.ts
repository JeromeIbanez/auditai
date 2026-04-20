import { StepType } from '@/lib/types'

type Step = {
  order: number
  type: StepType
  tool: string | null
  title: string
  description: string
  prompt: string | null
}

// Tool name → Make.com trigger module
const TRIGGER_MODULES: Record<string, { module: string; version: number }> = {
  Zendesk:    { module: 'zendesk:watchNewTickets',         version: 4 },
  HubSpot:    { module: 'hubspot:watchNewContacts',        version: 2 },
  Slack:      { module: 'slack:watchMessages',             version: 4 },
  Gmail:      { module: 'gmail:watchEmails',               version: 2 },
  Notion:     { module: 'notion:watchDatabaseItems',       version: 1 },
  Airtable:   { module: 'airtable:watchRecords',           version: 3 },
  Salesforce: { module: 'salesforce:watchRecords',         version: 2 },
  Jira:       { module: 'jira:watchIssues',                version: 1 },
  Typeform:   { module: 'typeform:watchNewResponses',      version: 2 },
  Intercom:   { module: 'intercom:watchConversations',     version: 1 },
}

// Tool name → Make.com action module
const ACTION_MODULES: Record<string, { module: string; version: number }> = {
  Zendesk:        { module: 'zendesk:updateTicket',            version: 4 },
  HubSpot:        { module: 'hubspot:updateContact',           version: 2 },
  Slack:          { module: 'slack:createMessage',             version: 4 },
  Gmail:          { module: 'gmail:sendEmail',                 version: 2 },
  Notion:         { module: 'notion:createDatabaseItem',       version: 1 },
  Airtable:       { module: 'airtable:createRecord',           version: 3 },
  Salesforce:     { module: 'salesforce:createRecord',         version: 2 },
  Jira:           { module: 'jira:createIssue',                version: 1 },
  Intercom:       { module: 'intercom:createNote',             version: 1 },
  'Google Docs':  { module: 'googledocs:createDocument',       version: 1 },
  'Google Sheets':{ module: 'googlesheets:addRow',             version: 2 },
  'Google Drive': { module: 'googledrive:uploadFile',          version: 3 },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MakeModule = Record<string, any>

function buildModule(step: Step, index: number): MakeModule {
  const id = index + 1
  const x = index * 300
  const designer = { x, y: 0 }
  const tool = step.tool ?? ''

  switch (step.type) {
    case 'TRIGGER': {
      const mod = TRIGGER_MODULES[tool]
      if (mod) {
        return { id, module: mod.module, version: mod.version, parameters: { __IMTCONN__: null, maxResults: 1 }, mapper: {}, metadata: { designer } }
      }
      return { id, module: 'gateway:CustomWebHook', version: 1, parameters: { hook: null, maxResults: 1 }, mapper: {}, metadata: { designer } }
    }

    case 'AI': {
      const prevOutput = index > 0 ? `{{${index}.choices[].message.content}}` : '[INPUT]'
      return {
        id,
        module: 'openai:createChatCompletion',
        version: 1,
        parameters: { __IMTCONN__: null },
        mapper: {
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: step.prompt ?? step.description },
            { role: 'user',   content: prevOutput },
          ],
          max_tokens: 1500,
        },
        metadata: {
          designer,
          // Note for the user in Make's interface
          expect: [{ name: 'content', type: 'text', label: 'AI Output' }],
        },
      }
    }

    case 'HUMAN': {
      // Represent as an email notification — human acts, then continues manually
      return {
        id,
        module: 'email:sendEmail',
        version: 2,
        parameters: { __IMTCONN__: null },
        mapper: {
          to: '[REVIEWER_EMAIL]',
          subject: `Action required: ${step.title}`,
          content: `<p>${step.description}</p><p>Please complete this step and continue the workflow.</p>`,
          contentType: 'html',
        },
        metadata: { designer },
      }
    }

    case 'INTEGRATION': {
      const mod = ACTION_MODULES[tool]
      if (mod) {
        return { id, module: mod.module, version: mod.version, parameters: { __IMTCONN__: null }, mapper: {}, metadata: { designer } }
      }
      return {
        id,
        module: 'http:makeRequest',
        version: 1,
        parameters: {},
        mapper: {
          url: `[${tool || 'TOOL'}_API_ENDPOINT]`,
          method: 'POST',
          headers: [{ name: 'Content-Type', value: 'application/json' }],
          bodyType: 'raw',
          contentType: 'application/json',
          body: '{}',
        },
        metadata: { designer },
      }
    }

    case 'OUTPUT': {
      const prevContent = index > 0 ? `{{${index}.choices[].message.content}}` : step.description
      // Use Slack if it's the tool, otherwise email
      if (tool === 'Slack') {
        return {
          id,
          module: 'slack:createMessage',
          version: 4,
          parameters: { __IMTCONN__: null },
          mapper: { channel: '[CHANNEL_NAME]', text: prevContent },
          metadata: { designer },
        }
      }
      return {
        id,
        module: 'email:sendEmail',
        version: 2,
        parameters: { __IMTCONN__: null },
        mapper: {
          to: '[RECIPIENT_EMAIL]',
          subject: step.title,
          content: prevContent,
        },
        metadata: { designer },
      }
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
  const isInstant = sorted[0]?.type === 'TRIGGER'

  return {
    name: `AuditAI: ${workflow.taskName}`,
    flow,
    metadata: {
      instant: isInstant,
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
