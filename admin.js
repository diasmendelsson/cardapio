const form = document.getElementById("form-add");
const btnAdd = document.getElementById("btn-add");
const btnClose = document.getElementById("btn-close");
const overlay = document.getElementById("overlay");
const mensagem = document.getElementById("mensagem");

//dados
const inputNome = document.getElementById("nome");
const inputDescricao = document.getElementById("descricao");
const inputPreco = document.getElementById("preco");
const inputCategoria = document.getElementById("categoria");
const inputImg = document.getElementById("imagem");
const imgPreview = document.getElementById("preview");
const listaProdutos = document.getElementById("lista-produtos")

let produtos = [];

function abrirModal(){
    overlay.classList.add("open");
};

function fecharModal() {
    overlay.classList.remove("open");
};

btnAdd.addEventListener("click", (event)=>{
    event.stopPropagation();
    abrirModal();
});

overlay.addEventListener("click", ()=>{
    fecharModal();
});

btnClose.addEventListener("click", ()=>{
    fecharModal();
});


form.addEventListener("click", (event) => {
    event.stopPropagation();
});


inputImg.addEventListener("change", ()=> {
    
    const file = inputImg.files[0]
    if(!file) return

    const imageURL = URL.createObjectURL(file)
    imgPreview.src = imageURL
    imgPreview.style.display = "block";
})

form.addEventListener("submit", async function(event) {
    event.preventDefault();

    mensagem.textContent = "Cadastrando produto..."

    try {
        const formData = new FormData(form);

        const res = await fetch("http://localhost:8080/produtos/cadastrar", {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        console.log(data);

        if(!res.ok){
            mensagem.textContent = data.mensagem || "Produto não cadastrado";
            mensagem.style.color = "red";
            return;
        }

        mensagem.textContent = "Produto cadastrado com sucesso";
        mensagem.style.color = "green"

        form.reset(); // limpa apenas no sucesso

    } catch (error) {
        console.error(error);
        mensagem.textContent = "Erro no servidor";
        mensagem.style.color = "red";
  
    }
});

async function produtosListar() {

    try {
        const response = await fetch("http://192.168.3.12:8080/lista/produtos")

        produtos = await response.json();

        mostrarProdutos(produtos);
        console.log(produtos)
        
    } catch (error) {

        console.error("Erro ao carregar produtos:", error);

    }
}

function mostrarProdutos() {
    
    const categorias = {};

    // Agrupa os produtos pela categoria
    produtos.forEach(produto => {

        if (!categorias[produto.categoria]) {
            categorias[produto.categoria] = [];
        }

        categorias[produto.categoria].push(produto);
    });

    let html = "";

    // Percorre cada categoria
    for (const categoria in categorias) {

        html += `
            <section class="categoria">

                <h2>${categoria}</h2>

                <div class="produtos-categoria">
        `;

        // Produtos pertencentes àquela categoria
        categorias[categoria].forEach(produto => {

            const valor = Number(produto.preco);

            html += `
                <div class="box">

                   <div class="box-image">
                      <img 
                        class="img-box"
                        src="http://192.168.3.12:8080/uploads/${produto.imagem}"
                        alt="${produto.nome}"
                    />
                   </div>

                    <span class="span">
                        <h3 class="tit-card">${produto.nome}</h3>
                        <p class="desc-card"> R$ ${valor.toFixed(2).replace(".", ",")}</p>
                    </span>

                </div>
            `;
        });

        html += `
                </div>
            </section>
        `;
    }

    listaProdutos.innerHTML = html;
}





mostrarProdutos()
produtosListar();