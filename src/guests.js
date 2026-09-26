import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const LOCAL_KEY = 'tuparit_guests';

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

if (!supabase) {
  console.warn('Supabase env vars missing – guest list falls back to localStorage (this browser only).');
}

function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveLocal(guests) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(guests));
  } catch (e) {
    console.warn('Could not save to localStorage', e);
  }
}

// Only public columns are readable by anon (see supabase/schema.sql) – emails stay private.
export async function fetchGuests() {
  if (!supabase) return loadLocal();

  const { data, error } = await supabase
    .from('rsvps')
    .select('id, name, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function addGuest({ name, email, hype }) {
  if (!supabase) {
    const guests = loadLocal();
    guests.unshift({ id: Date.now().toString(), name, created_at: new Date().toISOString() });
    saveLocal(guests);
    return;
  }

  // No .select() here: anon may insert but not read back the email column.
  const { error } = await supabase
    .from('rsvps')
    .insert({ name, email: email || null, hype });

  if (error) throw error;
}
