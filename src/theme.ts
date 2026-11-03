import type { Bot, Person, Workflow, WorkflowNode } from './types';

export interface AvatarRef {
  id: string;
  name: string;
  role: string;
  color: string;
  avatar: string;
  person: boolean;
}

export function nodeSize(node: WorkflowNode, vertical = false): { width: number; height: number } {
  if (node.type === 'start') return { width: 210, height: 44 };
  if (node.type === 'hub') return { width: 240, height: 118 };
  if (node.type === 'page') return { width: 268, height: 74 };
  if (node.type === 'output' || node.type === 'early-exit') return { width: 220, height: 78 };
  const toolRows = node.tools && node.tools.length > 0 ? 48 : 0;
  if (vertical) return { width: 200, height: 188 + toolRows };
  return { width: 176, height: 148 + toolRows };
}

function personById(people: Person[] | undefined, id: string): Person | undefined {
  return people?.find((person) => person.id === id);
}

export function ownersOf(node: WorkflowNode, workflow: Workflow): AvatarRef[] {
  return node.owners.map((id) => {
    const person = personById(workflow.people, id);
    if (person) {
      return { id: person.id, name: person.name, role: person.role, color: person.color, avatar: '', person: true };
    }
    const bot = workflow.bots.find((item) => item.id === id);
    if (!bot) return { id, name: id, role: '', color: '#d5dbea', avatar: '', person: false };
    return { id: bot.id, name: bot.name, role: bot.role, color: bot.color, avatar: bot.avatar, person: false };
  });
}

export function senderColor(node: WorkflowNode | undefined, workflow: Workflow): string {
  const lead = node ? ownersOf(node, workflow)[0] : undefined;
  return lead?.color ?? '#9aa6bb';
}

export function workflowCount(workflow: Workflow): string {
  const bots = workflow.bots.length;
  const steps = workflow.nodes.length;
  const botWord = bots === 1 ? 'Bot' : 'Bots';
  const stepWord = steps === 1 ? 'step' : 'steps';
  return `${bots} ${botWord} · ${steps} ${stepWord}`;
}

export function toolNames(workflow: Workflow): string[] {
  const names: string[] = [];
  for (const node of workflow.nodes) {
    if (node.tools && node.tools.length > 0) names.push(...node.tools);
    else if (node.usesTool) names.push(node.title);
  }
  return names;
}

export type { Bot };
