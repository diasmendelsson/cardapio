import { cardapio } from "./data.js";

console.log(cardapio);

const listaProdutos = document.querySelector("#produtos");
const botoesCategoria = document.querySelectorAll(".icone-barra");

let produtos = [];
let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
let categoriaAtual = "espetos";



async function carregarProdutos() {

    try {

        const response = await fetch("http://192.168.3.12:8080/lista/produtos");

        produtos = await response.json();

        mostrarProdutos(produtos, "espetos");
        console.log(produtos);

    } catch (error) {

        console.error("Erro ao carregar produtos:", error);

    }
}


function mostrarProdutos(produtos, categoria) {

    listaProdutos.innerHTML = "";

    botoesCategoria.forEach(botao => {

        if (botao.dataset.categoria === categoria) {
            botao.classList.add("ativo");
        } else {
            botao.classList.remove("ativo");
        }

    });

   

    const produtosFiltrados = produtos.filter(produto =>
        produto.categoria === categoria
    );

    produtosFiltrados.forEach(produto => {

        const itemCarrinho = carrinho.find(item => item.id === produto.id);
        const quantidade = itemCarrinho ? itemCarrinho.quantidade : 0;

        listaProdutos.innerHTML += `
            <div class="">
               <div class="card">

                    <img class="img-card" src="http://192.168.3.12:8080/uploads/${produto.imagem}" alt="${produto.nome}" />
                    
                     <div class="card-conteudo">
                        <h2 class="tit-card">${produto.nome}</h2>
                        <p class="desc-card">${produto.descricao}</p>
                     

                        <div class="card-footer">
                            <p class="preco-card">R$ ${produto.preco}</p>
                           
                              ${quantidade === 0
                                    ? `
                                        <button class="btn-adicionar" data-id="${produto.id}">
                                            <img src="/public/icons/plus.png" />
                                        </button>
                                    `
                                    : `
                                        <div class="controle-quantidade">
                                            <button class="btn-diminuir" data-id="${produto.id}"><img src="/public/icons/menos.png" /></button>
                                            <span>${quantidade}</span>
                                            <button class="btn-aumentar" data-id="${produto.id}"><img src="/public/icons/plus.png" /></button>
                                        </div>
                                    `
                                }
                        </div>
                    </div>
                     
               </div>
            </div>
        `;

    });

    // botão que aparece quando quantidade = 0
    document.querySelectorAll(".btn-adicionar").forEach(botao => {
        botao.addEventListener("click", () => {
            const id = Number(botao.dataset.id);
            adicionarCarrinho(id);
        });
    });


    // botão + que aparece quando quantidade > 0
    document.querySelectorAll(".btn-aumentar").forEach(botao => {
        botao.addEventListener("click", () => {
            const id = Number(botao.dataset.id);
            adicionarCarrinho(id);
        });
    });


    // botão - que aparece quando quantidade > 0
    document.querySelectorAll(".btn-diminuir").forEach(botao => {
        botao.addEventListener("click", () => {
            const id = Number(botao.dataset.id);
            diminuirQuantidade(id);
        });
    });
}



botoesCategoria.forEach(botao => {

    botao.addEventListener("click", (event) => {

        event.preventDefault();

        const categoria = botao.dataset.categoria;

        categoriaAtual = categoria;

        mostrarProdutos(produtos, categoriaAtual);

    });

});

function adicionarCarrinho(id) {

    const produto = produtos.find(produto => produto.id === id);

    if (!produto) {
        console.error("Produto não encontrado.");
        return;
    }

    const itemExistente = carrinho.find(item => item.id === id);

    if (itemExistente) {

        itemExistente.quantidade++;

    } else {

        carrinho.push({
            id: produto.id,
            nome: produto.nome,
            preco: Number(produto.preco),
            quantidade: 1
        });

    }

    localStorage.setItem("carrinho", JSON.stringify(carrinho));

    atualizarCarrinhoIcone(); // <-- aqui
    mostrarProdutos(produtos, categoriaAtual);

    console.log("Carrinho:", carrinho);
}

function mostrarCarrinho() {

    const listaCarrinho = document.querySelector("#itens-carrinho");

    listaCarrinho.innerHTML = "";

    carrinho.forEach(item => {

        listaCarrinho.innerHTML += `
            <div>
                <h3>${item.nome}</h3>
                <p>Preço: R$ ${item.preco.toFixed(2)}</p>
                <p>Quantidade: ${item.quantidade}</p>
            </div>
        `;

    });
}

function atualizarCarrinhoIcone() {

    const quantidade = document.getElementById("quantidade-carrinho");
    const valor = document.getElementById("valor-carrinho");

    const totalItens = carrinho.reduce(
        (total, item) => total + item.quantidade,
        0
    );

    const totalValor = carrinho.reduce(
        (total, item) => total + (item.preco * item.quantidade),
        0
    );

    quantidade.textContent = `${totalItens} ${totalItens === 1 ? "item" : "itens"}`;

    valor.textContent = `R$ ${totalValor.toFixed(2).replace(".", ",")}`;
}

function diminuirQuantidade(id) {

    const itemExistente = carrinho.find(item => item.id === id);

    if (!itemExistente) {
        return;
    }

    if (itemExistente.quantidade > 1) {

        itemExistente.quantidade--;

    } else {

        carrinho = carrinho.filter(item => item.id !== id);

    }

    localStorage.setItem("carrinho", JSON.stringify(carrinho));

    atualizarCarrinhoIcone();

    mostrarProdutos(produtos, categoriaAtual);
}


atualizarCarrinhoIcone();
carregarProdutos();

