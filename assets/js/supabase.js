/**
 * Configuração da Conexão com o Supabase (Clean Code - Single Source of Truth)
 * Substitua as constantes abaixo pelas suas chaves encontradas em:
 * Supabase Dashboard -> Project Settings -> API
 */
const SUPABASE_URL = "https://tbuymkhnlrwdsqukwcsh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ZRx6FBjlW2a2CKgGMCafrQ_xjLEmsI9";

// Inicializa o cliente global do Supabase utilizando a biblioteca carregada via CDN
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);