const form = document.getElementById("form-add");
const btnAdd = document.getElementById("btn-add");
const btnClose = document.getElementById("btn-close");
const overlay = document.getElementById("overlay");
const mensagem = document.getElementById("mensagem");
const tituloForm = document.getElementById("titulo-form");
const btnAddProd = document.getElementById("btn-add-prod");

//dados
const inputNome = document.getElementById("nome");
const inputDescricao = document.getElementById("descricao");
const inputPreco = document.getElementById("preco");
const inputCategoria = document.getElementById("categoria");
const inputImg = document.getElementById("imagem");
const imgPreview = document.getElementById("preview");
const listaProdutos = document.getElementById("lista-produtos")

let produtos = [];
let produtoEditando = null;

function abrirModal(){
    overlay.classList.add("open");
};

function fecharModal() {
    overlay.classList.remove("open");
};

btnAdd.addEventListener("click", (event)=>{
    event.stopPropagation();

    produtoEditando = null;

    form.reset();

    tituloForm.textContent = "NOVO PRODUTO";
    btnAddProd.textContent = "Adicionar Produto";

    imgPreview.src = "";
    imgPreview.style.display = "none";

    mensagem.textContent = "";
    mensagem.style.color = "";

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

    mensagem.textContent = produtoEditando
        ? "Atualizando produto..."
        : "Cadastrando produto...";

    try {

        const formData = new FormData(form);

        let url;
        let method;

        if (produtoEditando) {

            url = `http://localhost:8080/lista/${produtoEditando}`;
            method = "PUT";

        } else {

            url = "http://localhost:8080/produtos/cadastrar";
            method = "POST";

        }

        const res = await fetch(url, {
            method: method,
            body: formData
        });

        const data = await res.json();

        console.log(data);

        if (!res.ok) {

            mensagem.textContent =
                data.mensagem || "Não foi possível salvar o produto";

            mensagem.style.color = "red";

            return;
        }

        mensagem.textContent = produtoEditando
            ? "Produto atualizado com sucesso!"
            : "Produto cadastrado com sucesso!";

        mensagem.style.color = "green";

        if (produtoEditando) {

            await produtosListar();

        } else {

            form.reset();

            imgPreview.src = "";
            imgPreview.style.display = "none";

            await produtosListar();
        }

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
           

                    <div class="acoes-produto">
                        <button 
                            class="btn-editar"
                            data-id="${produto.id}"
                            type="button">
                            <img class="editar" src="public/icons/edit.svg" alt="icone de editar"/>
                        </button>

                         <button 
                            class="btn-excluir"
                            data-id="${produto.id}"
                            type="button"
                        >
                            <img class="excluir" src="public/icons/delete.png" alt="icone de lixeira"/>
                        </button>
                </div>
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

listaProdutos.addEventListener("click", async (event) => {

    const btnEditar = event.target.closest(".btn-editar");
    const btnExcluir = event.target.closest(".btn-excluir");

    // EDITAR
    if (btnEditar) {

        const id = Number(btnEditar.dataset.id);

        const produto = produtos.find(produto => produto.id === id);

        if (!produto) return;

        produtoEditando = produto.id;

        inputNome.value = produto.nome;
        inputDescricao.value = produto.descricao;
        inputPreco.value = produto.preco;
        inputCategoria.value = produto.categoria;

        tituloForm.textContent = "EDITAR PRODUTO";
        btnAddProd.textContent = "Salvar Alterações";

        mensagem.textContent = "";
        mensagem.style.color = "";

        if (produto.imagem) {

            imgPreview.src =
                `http://192.168.3.12:8080/uploads/${produto.imagem}`;

            imgPreview.style.display = "block";
        }

        abrirModal();

        return;
    }


    // EXCLUIR
    if (btnExcluir) {

        const id = Number(btnExcluir.dataset.id);

        const produto = produtos.find(produto => produto.id === id);

        if (!produto) return;

        const confirmar = confirm(
            `Tem certeza que deseja excluir o produto "${produto.nome}"?`
        );

        if (!confirmar) return;

        try {

            const response = await fetch(
                `http://localhost:8080/lista/${id}`,
                {
                    method: "DELETE"
                }
            );

            const data = await response.json();

            if (!response.ok) {

                alert(
                    data.mensagem || "Não foi possível excluir o produto."
                );

                return;
            }

            // Remove o produto do array
            produtos = produtos.filter(produto => produto.id !== id);

            // Atualiza a tela
            mostrarProdutos();

        } catch (error) {

            console.error(error);

            alert("Erro no servidor.");
        }
    }

});




mostrarProdutos()
produtosListar();