export interface Tema {
  id: number;
  number: number;
  title: string;
  full_title: string;
}

export interface Section {
  id: number;
  tema_id: number;
  parent_id: number | null;
  number: string;
  title: string;
  level: number;
  order_idx: number;
  content: string;
}

export interface SectionNode extends Section {
  children: SectionNode[];
}

export interface Card {
  id: number;
  type: string;
  front: string;
  back: string;
  hint: string | null;
  tema_id: number | null;
  section_id: number | null;
  metadata: string | null;
}

export interface Essay {
  id: number;
  tema_id: number;
  prompt: string;
  body: string;
  submitted_at: number;
  status: 'pending_review' | 'reviewed';
  feedback: string | null;
  feedback_at: number | null;
}

export type CardType =
  | 'definition'     // front: término, back: definición
  | 'author_method'  // front: autor, back: método/principios
  | 'method_author'  // front: método, back: autor
  | 'quote_author'  // front: cita, back: autor
  | 'cloze'          // front with ____, back: palabra oculta
  | 'law'            // front: artículo, back: contenido
  | 'section_recall' // front: sección número, back: subsecciones
  | 'audio_interval' // metadata.notes: [midi1, midi2], back: name
  | 'audio_mode'
  | 'audio_texture';
