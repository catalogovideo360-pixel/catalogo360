// ═════════════════════════════════════════════════════════════
// CONFIGURAÇÃO SUPABASE - PiraFashion
// ═════════════════════════════════════════════════════════════

// Função para inicializar Supabase quando credenciais estiverem disponíveis
function initializeSupabase() {
  const SUPABASE_URL = window.SUPABASE_URL || "";
  const SUPABASE_KEY = window.SUPABASE_KEY || "";

  // Verificar se credenciais estão carregadas
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("⚠️ Credenciais Supabase não configuradas. Aguardando...");
    // Tentar novamente em 100ms
    setTimeout(initializeSupabase, 100);
    return;
  }

  // Inicializar cliente Supabase com tratamento de erro
  try {
    if (window.supabase && SUPABASE_URL && SUPABASE_KEY) {
      window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      console.log("✅ Supabase inicializado com sucesso");
    }
  } catch (err) {
    console.error("❌ Erro ao inicializar Supabase:", err);
  }
}

// Iniciar inicialização
initializeSupabase();

// ═════════════════════════════════════════════════════════════
// UPLOAD DE ARQUIVOS (Vídeo e Imagens)
// ═════════════════════════════════════════════════════════════

async function uploadArquivo(bucket, path, file) {
  if (!window.supabaseClient) {
    console.error("❌ Cliente Supabase não inicializado");
    return null;
  }

  try {
    const { data, error } = await window.supabaseClient.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    if (error) {
      console.error("❌ Erro no upload:", error.message);
      return null;
    }

    const { data: publicData } = window.supabaseClient.storage
      .from(bucket)
      .getPublicUrl(path);

    return publicData?.publicUrl || null;
  } catch (err) {
    console.error("❌ Erro ao fazer upload:", err);
    return null;
  }
}

// ═════════════════════════════════════════════════════════════
// SALVAR PRODUTO (Com vídeo, imagens e links)
// ═════════════════════════════════════════════════════════════

async function salvarProduto() {
  if (!window.supabaseClient) {
    alert("❌ Sistema não inicializado. Verifique as credenciais.");
    return;
  }

  const botao = document.getElementById("btnSalvar");
  botao.disabled = true;
  botao.textContent = "Salvando...";

  try {
    // ── Dados do produto ──
    const nome = document.getElementById("nome")?.value;
    const descricao = document.getElementById("descricao")?.value;
    const preco = document.getElementById("preco")?.value;
    const linkVideo = document.getElementById("linkVideo")?.value;
    const linkImagem = document.getElementById("linkImagem")?.value;

    // ── Verificar campos obrigatórios ──
    if (!nome || !preco) {
      alert("⚠️ Por favor, preencha o nome e o preço do produto!");
      botao.disabled = false;
      botao.textContent = "Salvar Produto";
      return;
    }

    // ── Upload de vídeo (MP4) ──
    let videoUrl = linkVideo || null;
    const videoFile = document.getElementById("video")?.files[0];
    if (videoFile) {
      console.log("📹 Uploading vídeo...");
      const path = `videos/${Date.now()}_${videoFile.name}`;
      const url = await uploadArquivo("produtos", path, videoFile);
      if (url) videoUrl = url;
    }

    // ── Upload de imagens (JPG/PNG) ──
    const fotos = [];
    const fotoIds = ["foto1", "foto2", "foto3", "foto4"];

    for (const fotoId of fotoIds) {
      const file = document.getElementById(fotoId)?.files[0];
      if (file) {
        console.log(`🖼️ Uploading imagem ${fotoIds.indexOf(fotoId) + 1}...`);
        const path = `fotos/${Date.now()}_${file.name}`;
        const url = await uploadArquivo("produtos", path, file);
        if (url) fotos.push(url);
      }
    }

    // ── Adicionar link de imagem externo ──
    if (linkImagem && !fotos.includes(linkImagem)) {
      fotos.push(linkImagem);
    }

    // ── Inserir no banco de dados Supabase ──
    const { error } = await window.supabaseClient
      .from("produtos")
      .insert([{
        nome: nome,
        descricao: descricao || "",
        preco: parseFloat(preco),
        video_url: videoUrl,
        fotos: fotos,
        tenant_id: "pirafashion",
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error("❌ Erro ao salvar:", error);
      alert("❌ Erro ao salvar produto: " + (error.message || "Desconhecido"));
    } else {
      alert("✅ Produto salvo com sucesso!");
      // Limpar formulário
      document.getElementById("nome").value = "";
      document.getElementById("descricao").value = "";
      document.getElementById("linkVideo").value = "";
      document.getElementById("linkImagem").value = "";
      fotoIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
    }
  } catch (err) {
    console.error("❌ Erro geral:", err);
    alert("❌ Erro ao processar: " + (err.message || "Desconhecido"));
  } finally {
    botao.disabled = false;
    botao.textContent = "Salvar Produto";
  }
}

// ═════════════════════════════════════════════════════════════
// CARREGAR PRODUTOS (Para exibir no catálogo)
// ═════════════════════════════════════════════════════════════

async function carregarProdutos() {
  if (!window.supabaseClient) {
    console.warn("⚠️ Cliente Supabase não disponível");
    return [];
  }

  try {
    const { data, error } = await window.supabaseClient
      .from("produtos")
      .select("*")
      .eq("tenant_id", "pirafashion")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Erro ao carregar:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("❌ Erro:", err);
    return [];
  }
}

// ═════════════════════════════════════════════════════════════
// OTIMIZAR VÍDEOS PARA MOBILE
// ═════════════════════════════════════════════════════════════

function otimizarVideos() {
  const isMobile = window.innerWidth <= 768;
  const videos = document.querySelectorAll('[data-src-mobile]');

  videos.forEach(video => {
    const src = isMobile ?
      video.getAttribute('data-src-mobile') :
      video.getAttribute('data-src-desktop');
    if (src && video.src !== src) {
      video.src = src;
      console.log(`🎥 Vídeo otimizado: ${isMobile ? 'mobile' : 'desktop'}`);
    }
  });
}

// Executar ao carregar página
document.addEventListener('DOMContentLoaded', otimizarVideos);
window.addEventListener('resize', otimizarVideos);

// ═════════════════════════════════════════════════════════════
// LAZY LOADING DE IMAGENS
// ═════════════════════════════════════════════════════════════

function inicializarLazyLoading() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => imageObserver.observe(img));
  }
}

document.addEventListener('DOMContentLoaded', inicializarLazyLoading);

// ═════════════════════════════════════════════════════════════
// EXPORTS GLOBAIS
// ═════════════════════════════════════════════════════════════

window.salvarProduto = salvarProduto;
window.carregarProdutos = carregarProdutos;
window.otimizarVideos = otimizarVideos;
window.inicializarLazyLoading = inicializarLazyLoading;

console.log("✅ banner.js carregado com sucesso");