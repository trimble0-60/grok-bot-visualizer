import type { Workflow } from './types';

function unwrap(mod: unknown): unknown {
  if (mod && typeof mod === 'object' && 'default' in mod) {
    return (mod as { default: unknown }).default;
  }
  return mod;
}

function isWorkflow(value: unknown): value is Workflow {
  if (!value || typeof value !== 'object') return false;
  const workflow = value as Workflow;
  return (
    typeof workflow.id === 'string' &&
    typeof workflow.title === 'string' &&
    typeof workflow.description === 'string' &&
    Array.isArray(workflow.bots) &&
    Array.isArray(workflow.nodes) &&
    Array.isArray(workflow.edges)
  );
}

/** Every JSON file in /workflows, in filename order. */
export function loadWorkflows(): Workflow[] {
  const modules = import.meta.glob('../workflows/*.json', { eager: true });
  return Object.entries(modules)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, mod]) => {
      const data = unwrap(mod);
      if (!isWorkflow(data)) {
        console.error(`Skipping invalid workflow file: ${path}`);
        return null;
      }
      return data;
    })
    .filter((workflow): workflow is Workflow => workflow !== null);
}
