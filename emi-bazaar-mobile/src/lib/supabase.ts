import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pelhqmmruqlyxebduvpd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbGhxbW1ydXFseXhlYmR1dnBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNDU0NjUsImV4cCI6MjA4ODgyMTQ2NX0.f5varrIdfA1l7H55leeqg307OdR89YS9BWquZumYQRU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
