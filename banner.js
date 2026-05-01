const supabaseClient = supabase.createClient(
  "https://vrikvgxlasduvqbpnkmb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyaWt2Z3hsYXNkdXZxYnBua21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTI4MDMsImV4cCI6MjA5MjkyODgwM30.zDcYWZ9G4IyCqwnGsn9OnWJYa9KSh8MlPM4HYBp3Dig"
);

async function salvarProduto() {
  const nome = document.getElementById("nome").value;
  const descricao = document.getElementById("descricao").value;
  const preco = document.getElementById("preco").value;
  const imagem = document.getElementById("imagem").value;

  const { data, error } = await supabaseClient
    .from("produtos")
    .insert([
      {
        nome,
        descricao,
        preco,
        imagem_url: imagem,
        tenant_id: "cliente1"
      }
    ]);

  if (error) {
    alert("Erro: " + error.message);
  } else {
    alert("Salvo com sucesso!");
  }
}