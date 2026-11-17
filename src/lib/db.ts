// Thin typed data-access layer over Supabase for server use.
import { supabaseAdmin } from './supabase-server';
import type { Tema, Section, Card, Essay } from './types';

export async function listTemas(): Promise<Tema[]> {
  const { data, error } = await supabaseAdmin().from('temas').select('*').order('number');
  if (error) throw error;
  return (data ?? []) as Tema[];
}

export async function getTema(id: number): Promise<Tema | null> {
  const { data, error } = await supabaseAdmin().from('temas').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as Tema) ?? null;
}

export async function listSections(temaId: number): Promise<Section[]> {
  const { data, error } = await supabaseAdmin()
    .from('sections').select('*').eq('tema_id', temaId).order('order_idx');
  if (error) throw error;
  return (data ?? []) as Section[];
}

export async function getSection(id: number): Promise<Section | null> {
  const { data, error } = await supabaseAdmin().from('sections').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as Section) ?? null;
}

export async function listPendingEssays(): Promise<Essay[]> {
  const { data, error } = await supabaseAdmin()
    .from('essays').select('*').eq('status', 'pending_review').order('submitted_at');
  if (error) throw error;
  return (data ?? []) as Essay[];
}

export async function listAllEssays(): Promise<Essay[]> {
  const { data, error } = await supabaseAdmin()
    .from('essays').select('*').order('submitted_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Essay[];
}

export async function getEssay(id: number): Promise<Essay | null> {
  const { data, error } = await supabaseAdmin().from('essays').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as Essay) ?? null;
}
