export type NodeType = 'start' | 'task' | 'approval' | 'output' | 'early-exit' | 'page' | 'hub';

export type EdgeKind = 'always' | 'only-when' | 'asks-and-waits';

export interface Bot {
  id: string;
  name: string;
  color: string;
  /** Public path to the bot mark, for example /avatars/chief.png. */
  avatar: string;
  /** One-line role shown beside the name in the bot row. */
  role: string;
  icon: string;
}

/** A human in the workflow. Drawn as a person glyph, not a bot avatar. */
export interface Person {
  id: string;
  name: string;
  role: string;
  color: string;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  /** Lead owner first. Use a person id from `people` or a bot id from `bots`. */
  owners: string[];
  title: string;
  /** One-line caption under the avatar on the canvas. */
  summary: string;
  steps: string[];
  inputs: string[];
  outputs: string[];
  stopsForUser: boolean;
  /** Shows the small tool badge. */
  usesTool: boolean;
  /** Plain-language source categories shown on the node, such as Web or News. */
  tools?: string[];
  /** Workflow titles this person or bot appears in. Used by the org view. */
  appearsIn?: string[];
  /** Optional icon name for a page tile. */
  icon?: string;
  /** How often a page is updated. */
  cadence?: string;
}

export interface WorkflowEdge {
  from: string;
  to: string;
  label: string;
  kind: EdgeKind;
}

export interface Workflow {
  id: string;
  title: string;
  description: string;
  bots: Bot[];
  /** Humans who approve or direct work. They are not bots. */
  people?: Person[];
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  /** TB is a top-down tree. LR is the default left-to-right flow. */
  direction?: 'LR' | 'TB' | 'HUB';
  /** Replaces the generated bot-and-step count on the summary card. */
  summaryCount?: string;
}
