// Konfigurasi Chrome Extension SITB Assistant
// PENTING: Gunakan ANON KEY (bukan Service Role Key)
// Anon Key aman untuk client-side karena dilindungi Row Level Security (RLS)
const CONFIG = {
  SUPABASE_URL: 'https://lubgcwhrsyqvnbiutxkf.supabase.co',
  // Anon Key — aman untuk browser, dilindungi RLS
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1Ymdjd2hyc3lxdm5iaXV0eGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5OTMzNzAsImV4cCI6MjEwNTU2OTM3MH0.evsHBRtFp_xX_sZTjItdib6gzVOAij--HhPaDvUyAGg',
  // URL aplikasi web (backend proxy untuk mark-submitted)
  APP_URL: 'https://sitb-screening.vercel.app',
  // Secret key untuk autentikasi ke endpoint /api/extension/mark-submitted
  // Harus sama dengan EXTENSION_SECRET_KEY di environment variables Vercel
  EXTENSION_SECRET_KEY: '634d2b1267865d8843c952e126294361d0a656a2195d0b97f89bbb5adbe9432a',
};
