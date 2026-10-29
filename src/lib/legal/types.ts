export type LegalBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'table'; headers: string[]; rows: string[][] };

export interface LegalSection {
  id: string;
  title: string;
  blocks: LegalBlock[];
}
