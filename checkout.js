const btnRetirada = document.querySelector("#btn-retirada");
const btnEntrega = document.querySelector("#btn-entrega");

const endereco = document.querySelector("#endereco");

const linhaTaxa = document.querySelector("#linha-taxa");
const taxaEntrega = document.querySelector("#taxa-entrega");

const subtotalElement = document.querySelector("#subtotal");
const totalElement = document.querySelector("#total");

const formCheckout = document.querySelector("#form-checkout");

const clienteInput = document.querySelector("#cliente");
const whatsappInput = document.querySelector("#whatsapp");
const enderecoInput = document.querySelector("#endereco");
const observacaoInput = document.querySelector("#observacao");

const btnEnviar = document.querySelector("#btn-enviar");

const listaItens = document.querySelector("#lista-itens");

let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
let tipoEntrega = "retirada";

console.log("Carrinho:", carrinho);

function selecionarRetirada() {

    tipoEntrega = "retirada";

    btnRetirada.classList.add("ativo");
    btnEntrega.classList.remove("ativo");

    endereco.style.display = "none";
    endereco.value = "";

    linhaTaxa.style.display = "none";

    atualizarValores();
}

function selecionarEntrega() {

    tipoEntrega = "entrega";

    btnEntrega.classList.add("ativo");
    btnRetirada.classList.remove("ativo");

    endereco.style.display = "block";

    linhaTaxa.style.display = "flex";

    atualizarValores();
}

btnRetirada.addEventListener("click", selecionarRetirada);
btnEntrega.addEventListener("click", selecionarEntrega);

function mostrarItens() {

    listaItens.innerHTML = "";

    if (carrinho.length === 0) {

        listaItens.innerHTML = `
            <p>Seu carrinho está vazio.</p>
        `;

        return;
    }

    carrinho.forEach(item => {

        const preco = Number(item.preco);
        const quantidade = Number(item.quantidade);

        const subtotalItem = preco * quantidade;

        listaItens.innerHTML += `
            <div class="item-checkout">

                <div class="informacoes-item">

                    <strong>${item.nome}</strong>

                    <span>
                        R$ ${preco.toFixed(2).replace(".", ",")} un
                    </span>

                </div>


                <div class="controles-item">

                    <button
                        type="button"
                        class="btn-diminuir"
                        data-id="${item.id}">
                        <img src="/public/icons/menos.png" />
                    </button>

                    <span class="quantidade-item">
                        ${quantidade}
                    </span>

                    <button
                        type="button"
                        class="btn-aumentar"
                        data-id="${item.id}">
                        <img src="/public/icons/plus.png" />
                    </button>

                    <strong class="subtotal-item">
                        R$ ${subtotalItem.toFixed(2).replace(".", ",")}
                    </strong>

                </div>

            </div>
        `;
    });

    document.querySelectorAll(".btn-aumentar").forEach(botao => {
        botao.addEventListener("click", () =>{
            const id = Number(botao.dataset.id);
            adicionarCarrinho(id);
        })
    })

    
    document.querySelectorAll(".btn-diminuir").forEach(botao => {
        botao.addEventListener("click", () => {
            const id = Number(botao.dataset.id);
            diminuirQuantidade(id);
        });
    });
}

function adicionarCarrinho(id) {
 

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

    mostrarItens()
    atualizarValores();
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

    mostrarItens()
}

function calcularSubtotal() {

    return carrinho.reduce((total, item) => {

        return total + (
            Number(item.preco) * Number(item.quantidade)
        );

    }, 0);
}

function atualizarValores() {

    const subtotal = calcularSubtotal();

    const taxa = tipoEntrega === "entrega"
        ? 3
        : 0;

    const total = subtotal + taxa;

    subtotalElement.textContent =
        `R$ ${subtotal.toFixed(2).replace(".", ",")}`;

    taxaEntrega.textContent =
        `R$ ${taxa.toFixed(2).replace(".", ",")}`;

    totalElement.textContent =
        `R$ ${total.toFixed(2).replace(".", ",")}`;
}

function validarFormulario() {

    const cliente = clienteInput.value.trim();
    const whatsapp = whatsappInput.value.trim();

    if (!cliente) {
        alert("Digite seu nome.");
        clienteInput.focus();
        return false;
    }

    if (!whatsapp) {
        alert("Digite seu WhatsApp.");
        whatsappInput.focus();
        return false;
    }

    if (tipoEntrega === "entrega" && !enderecoInput.value.trim()) {
        alert("Digite seu endereço completo.");
        enderecoInput.focus();
        return false;
    }

    if (carrinho.length === 0) {
        alert("Seu carrinho está vazio.");
        return false;
    }

    return true;
}

function obterDadosPedido() {

    return {
        cliente: clienteInput.value.trim(),

        whatsapp: whatsappInput.value.trim(),

        tipo_entrega: tipoEntrega,

        endereco: tipoEntrega === "entrega"
            ? enderecoInput.value.trim()
            : null,

        observacao: observacaoInput.value.trim(),

        itens: carrinho.map(item => ({
            produto_id: item.id,
            quantidade: Number(item.quantidade)
        }))
    };
}

async function enviarPedido() {

    if (!validarFormulario()) {
        return;
    }

    const dadosPedido = obterDadosPedido();

    console.log("Dados enviados:", dadosPedido);

    try {

        const resposta = await fetch("http://localhost:8080/pedidos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dadosPedido)
        });

        const resultado = await resposta.json();

        console.log("Resposta do servidor:", resultado);

        if (!resposta.ok) {
            alert(resultado.mensagem || "Erro ao criar pedido.");
            return;
        }

        // Pedido foi salvo com sucesso no banco
        const pedidoId = resultado.pedido_id;

        // Monta a mensagem do WhatsApp
      let mensagem = `*NOVO PEDIDO #${pedidoId}*\n\n`;

        mensagem += `*Cliente:* ${dadosPedido.cliente}\n`;
        mensagem += `*WhatsApp:* ${dadosPedido.whatsapp}\n\n`;

        mensagem += `*Itens:*\n`;

        carrinho.forEach(item => {

            const subtotal =
                Number(item.preco) * Number(item.quantidade);

            mensagem +=
                `${item.quantidade}x ${item.nome} - R$ ${subtotal.toFixed(2).replace(".", ",")}\n`;
        });

        mensagem += `\n*Subtotal:* R$ ${resultado.subtotal.toFixed(2).replace(".", ",")}\n`;

        if (dadosPedido.tipo_entrega === "entrega") {

            mensagem +=
                `*Entrega:* R$ ${resultado.taxa_entrega.toFixed(2).replace(".", ",")}\n`;

            mensagem +=
                `*Endereço:* ${dadosPedido.endereco}\n`;

        } else {

            mensagem += `*Entrega:* Retirada\n`;
        }

        mensagem +=
            `\n*TOTAL: R$ ${resultado.total.toFixed(2).replace(".", ",")}*`;

        if (dadosPedido.observacao) {

            mensagem +=
                `\n\n*Observação:* ${dadosPedido.observacao}`;
        }

        const numeroWhatsApp = "5517996716891";

        const mensagemCodificada = encodeURIComponent(mensagem);

        const urlWhatsApp =
            `https://wa.me/${numeroWhatsApp}?text=${mensagemCodificada}`;

        console.log("Mensagem:", mensagem);
        console.log("URL WhatsApp:", urlWhatsApp);

        // Abre o WhatsApp somente depois do pedido ser salvo
        window.open(urlWhatsApp, "_blank");


        // Limpa o carrinho
        localStorage.removeItem("carrinho");
        carrinho = [];

    } catch (erro) {

        console.error(erro);

        alert("Não foi possível conectar ao servidor.");
    }
}

btnEnviar.addEventListener("click", enviarPedido);

mostrarItens();
atualizarValores();