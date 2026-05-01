// ═════════════════════════════════════════════════════════════
// CONFIGURAÇÃO SUPABASE - PiraFashion
// ═════════════════════════════════════════════════════════════

const SUPABASE_URL = "https://vrikvgxlasduvqbpnkmb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyaWt2Z3hsYXNkdXZxYnBua21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTI4MDMsImV4cCI6MjA5MjkyODgwM30.zDcYWZ9G4IyCqwnGsn9OnWJYa9KSh8MlPM4HYBp3Dig";

// Inicializar cliente Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ═════════════════════════════════════════════════════════════
// UPLOAD DE ARQUIVOS (Vídeo e Imagens)
// ═════════════════════════════════════════════════════════════

async function uploadArquivo(bucket, path, file) {
  try {
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    if (error) {
      console.error("Erro no upload:", error.message);
      return null;
    }

    const { data: publicData } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(path);

    return publicData.publicUrl;
  } catch (err) {
    console.error("Erro ao fazer upload:", err);
    return null;
  }
}

// ═════════════════════════════════════════════════════════════
// SALVAR PRODUTO (Com vídeo, imagens e links)
// ═════════════════════════════════════════════════════════════

async function salvarProduto() {
  const botao = document.getElementById("btnSalvar");
  botao.disabled = true;
  botao.textContent = "Salvando...";

  try {
    // ── Dados do produto ──
    const nome = document.getElementById("nome").value;
    const descricao = document.getElementById("descricao").value;
    const preco = document.getElementById("preco").value;
    const linkVideo = document.getElementById("linkVideo").value;
    const linkImagem = document.getElementById("linkImagem").value;

    // ── Upload de vídeo (MP4) ──
    let videoUrl = linkVideo || null;
    const videoFile = document.getElementById("video").files[0];
    if (videoFile) {
      const path = `videos/${Date.now()}_${videoFile.name}`;
      const url = await uploadArquivo("produtos", path, videoFile);
      if (url) videoUrl = url;
    }

    // ── Upload de imagens (JPG/PNG) ──
    const fotos = [];
    const fotoIds = ["foto1", "foto2", "foto3", "foto4"];
    
    for (const fotoId of fotoIds) {
      const file = document.getElementById(fotoId).files[0];
      if (file) {
        const path = `fotos/${Date.now()}_${file.name}`;
        const url = await uploadArquivo("produtos", path, file);
        if (url) fotos.push(url);
      }
    }

    // ── Adicionar link de imagem externo ──
    if (linkImagem && !fotos.includes(linkImagem)) {
      fotos.push(linkImagem);
    }

    // ── Verificar campos obrigatórios ──
    if (!nome || !preco) {
      alert("Por favor, preencha o nome e o preço do produto!");
      botao.disabled = false;
      botao.textContent = "Salvar Produto";
      return;
    }

    // ── Inserir no banco de dados Supabase ──
    const { error } = await supabaseClient
      .from("produtos")
      .insert([{
        nome: nome,
        descricao: descricao || "",
        preco: parseFloat(preco),
        video_url: videoUrl,
        fotos: fotos,
        tenant_id: "pirafashion"
      }]);

    if (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar produto: " + error.message);
    } else {
      alert("✅ Produto salvo com sucesso!");
      // Limpar formulário
      document.getElementById("nome").value = "";
      document.getElementById("descricao").value = "";
      document.getElementById("preco").value = "";
      document.getElementById("linkVideo").value = "";
      document.getElementById("linkImagem").value = "";
      fotoIds.forEach(id => document.getElementById(id).value = "");
    }
  } catch (err) {
    console.error("Erro geral:", err);
    alert("Erro ao processar: " + err.message);
  } finally {
    botao.disabled = false;
    botao.textContent = "Salvar Produto";
  }
}

// ═════════════════════════════════════════════════════════════
// CARREGAR PRODUTOS (Para exibir no catálogo)
// ═════════════════════════════════════════════════════════════

async function carregarProdutos() {
  try {
    const { data, error } = await supabaseClient
      .from("produtos")
      .select("*")
      .eq("tenant_id", "pirafashion")
      .order("id", { ascending: false });

    if (error) {
      console.error("Erro ao carregar:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Erro:", err);
    return [];
  }
}

// Função global para uso no HTML
window.salvarProduto = salvarProduto;
window.carregarProdutos = carregarProdutos;