let pedidos = [];

const listaPedidos = document.querySelector("#lista-pedidos");

const btnAtualizar = document.querySelector("#btn-atualizar");

const API = "http://192.168.3.12:8080";



// ==========================================
// BUSCAR PEDIDOS
// ==========================================

async function carregarPedidos() {

    listaPedidos.innerHTML = `
        <p class="carregando">
            Carregando pedidos...
        </p>
    `;

    try {

        const resposta = await fetch(`${API}/pedidos`);

        if (!resposta.ok) {
            throw new Error("Erro ao buscar pedidos.");
        }

        pedidos = await resposta.json();

        mostrarPedidos(pedidos);

    } catch (erro) {

        console.error(erro);

        listaPedidos.innerHTML = `
            <p class="sem-pedidos">
                Não foi possível carregar os pedidos.
            </p>
        `;
    }
}


// ==========================================
// MOSTRAR PEDIDOS
// ==========================================

function mostrarPedidos(pedidos) {

    listaPedidos.innerHTML = "";

    if (pedidos.length === 0) {

        listaPedidos.innerHTML = `
            <p class="sem-pedidos">
                Nenhum pedido encontrado.
            </p>
        `;

        return;
    }

    pedidos.forEach(pedido => {

        listaPedidos.innerHTML += criarCardPedido(pedido);

    });

    adicionarEventos();
}


// ==========================================
// CRIAR CARD
// ==========================================

function criarCardPedido(pedido) {

    const status = obterStatus(pedido.status);

    const proximaAcao = obterProximaAcao(pedido.status);

    const data = formatarData(pedido.data_hora);

    const tipoEntrega =
        pedido.tipo_entrega === "entrega"
            ? "⛟ Entrega"
            : "𖠿 Retirada";


    const itensHTML = pedido.itens.map(item => {

        return `
            <div class="item-pedido">

                <span>
                    ${item.quantidade}x ${item.nome}
                </span>

                <strong>
                    R$ ${formatarValor(item.subtotal)}
                </strong>

            </div>
        `;

    }).join("");


    return `
        <article class="pedido-card ${pedido.status === "cancelado" ? "pedido-cancelado" : ""}"
            data-id="${pedido.id}">

            <div class="pedido-topo">

                <div class="pedido-identificacao">

                    <strong>
                        #${pedido.id}
                    </strong>

                    <span class="status ${status.classe}">
                        ✓ ${status.nome}
                    </span>

                </div>

                <button
                    class="btn-imprimir"
                    data-id="${pedido.id}"
                    title="Imprimir pedido">

                    <img src="/public/icons/impressora.png" />

                </button>

            </div>


            <div class="pedido-cliente">

                <strong>
                    ${pedido.cliente}
                </strong>

                <span>•</span>

                <span>
                    ${pedido.whatsapp}
                </span>

            </div>


            <div class="pedido-info">

                <span>
                    ${tipoEntrega}
                </span>

                <span>
                    ${data}
                </span>

            </div>


            <div class="pedido-itens">

                ${itensHTML}

            </div>


            <div class="pedido-rodape">

                <strong class="pedido-total">
                    Total: R$ ${formatarValor(pedido.total)}
                </strong>


                <div class="pedido-acoes">

                    ${
                        pedido.status !== "entregue" &&
                        pedido.status !== "cancelado"

                        ? `
                            <button
                                class="btn-cancelar"
                                data-id="${pedido.id}">

                                Cancelar

                            </button>
                        `
                        : ""
                    }


                    ${
                        proximaAcao

                        ? `
                            <button
                                class="btn-status"
                                data-id="${pedido.id}"
                                data-proximo-status="${proximaAcao.status}">

                                ${proximaAcao.nome}

                            </button>
                        `
                        : ""
                    }

                </div>

            </div>

        </article>
    `;
}


// ==========================================
// STATUS
// ==========================================

function obterStatus(status) {

    const statusMap = {

        pendente: {
            nome: "Pendente",
            classe: "status-pendente"
        },

        preparo: {
            nome: "Preparo",
            classe: "status-preparo"
        },

        pronto: {
            nome: "Pronto",
            classe: "status-pronto"
        },

        entregue: {
            nome: "Entregue",
            classe: "status-entregue"
        },

        cancelado: {
            nome: "Cancelado",
            classe: "status-cancelado"
        }

    };

    return statusMap[status] || {
        nome: status,
        classe: ""
    };
}


// ==========================================
// PRÓXIMA AÇÃO
// ==========================================

function obterProximaAcao(status) {

    const acoes = {

        pendente: {
            status: "preparo",
            nome: "Preparo"
        },

        preparo: {
            status: "pronto",
            nome: "Pronto"
        },

        pronto: {
            status: "entregue",
            nome: "Entregue"
        }

    };

    return acoes[status] || null;
}


// ==========================================
// EVENTOS
// ==========================================

function adicionarEventos() {

    const botoesStatus =
        document.querySelectorAll(".btn-status");

    const botoesCancelar =
        document.querySelectorAll(".btn-cancelar");

    const botoesImprimir =
        document.querySelectorAll(".btn-imprimir");


    // AVANÇAR STATUS

    botoesStatus.forEach(botao => {

        botao.addEventListener("click", () => {

            const id = botao.dataset.id;

            const novoStatus =
                botao.dataset.proximoStatus;

            atualizarStatus(id, novoStatus);

        });

    });


    // CANCELAR

    botoesCancelar.forEach(botao => {

        botao.addEventListener("click", () => {

            const id = botao.dataset.id;

            cancelarPedido(id);

        });

    });


    // IMPRIMIR

    botoesImprimir.forEach(botao => {

        botao.addEventListener("click", () => {

            const id = botao.dataset.id;

            imprimirPedido(id);

        });

    });

}


// ==========================================
// ATUALIZAR STATUS
// ==========================================

async function atualizarStatus(id, novoStatus) {

    try {

        const resposta = await fetch(
            `${API}/pedidos/${id}/status`,
            {
                method: "PATCH",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    status: novoStatus
                })
            }
        );


        const resultado = await resposta.json();


        if (!resposta.ok) {

            alert(
                resultado.mensagem ||
                "Erro ao atualizar status."
            );

            return;
        }


        // Busca novamente os pedidos
        // para atualizar a tela

        carregarPedidos();

    } catch (erro) {

        console.error(erro);

        alert(
            "Não foi possível atualizar o status."
        );
    }
}


// ==========================================
// CANCELAR
// ==========================================

async function cancelarPedido(id) {

    const confirmar =
        confirm("Deseja realmente cancelar este pedido?");


    if (!confirmar) {
        return;
    }


    await atualizarStatus(id, "cancelado");
}


// ==========================================
// IMPRESSÃO
// ==========================================

function imprimirPedido(id) {

    const pedido = pedidos.find(
        pedido => pedido.id === Number(id)
    );

    if (!pedido) {
        alert("Pedido não encontrado.");
        return;
    }

    const janela = window.open("", "_blank");

    if (!janela) {
        alert("Não foi possível abrir a janela de impressão.");
        return;
    }

    const itensHTML = pedido.itens.map(item => {

        return `
            <div class="item">
                <span>
                    ${item.quantidade}x ${item.nome}
                </span>

                <strong>
                    R$ ${formatarValor(item.subtotal)}
                </strong>
            </div>
        `;

    }).join("");


    const tipoEntrega =
        pedido.tipo_entrega === "entrega"
            ? "ENTREGA"
            : "RETIRADA";


    const endereco =
        pedido.tipo_entrega === "entrega"
            ? `
                <div class="endereco">
                    ${pedido.endereco}
                </div>
            `
            : "";


    const observacao =
        pedido.observacao
            ? `
                <div class="observacao">
                    <strong>Observação:</strong><br>
                    ${pedido.observacao}
                </div>
            `
            : "";


    janela.document.write(`

        <!DOCTYPE html>

        <html lang="pt-BR">

        <head>

            <meta charset="UTF-8">

            <title>
                Pedido #${pedido.id}
            </title>

            <style>

                * {
                    box-sizing: border-box;
                }

                @page {
                    size: 80mm auto;
                    margin: 0;
                }

               body {
                    margin: 0 auto;
                    padding: 10px;
                    width: 80mm;
                    font-family: Arial, sans-serif;
                    font-size: 13px;
                    color: #000;
                }

                .titulo {
                    text-align: center;

                    font-size: 18px;

                    font-weight: bold;

                    margin-bottom: 5px;
                }

                .pedido {
                    text-align: center;

                    font-size: 15px;

                    font-weight: bold;

                    margin-bottom: 10px;
                }

                .linha {
                    border-top: 1px dashed #000;

                    margin: 8px 0;
                }

                .cliente {
                    margin-bottom: 5px;
                }

                .tipo {
                    text-align: center;

                    font-weight: bold;

                    margin: 8px 0;
                }

                .item {
                    display: flex;

                    justify-content: space-between;

                    gap: 10px;

                    margin: 5px 0;
                }

                .item strong {
                    white-space: nowrap;
                }

                .valor {
                    display: flex;

                    justify-content: space-between;

                    margin: 4px 0;
                }

                .total {
                    display: flex;

                    justify-content: space-between;

                    font-size: 16px;

                    font-weight: bold;

                    margin-top: 8px;
                }

                .endereco {
                    margin-top: 8px;
                }

                .observacao {
                    margin-top: 10px;

                    padding-top: 8px;

                    border-top: 1px dashed #000;
                }

                .rodape {
                    text-align: center;

                    margin-top: 15px;

                    font-size: 11px;
                }

            </style>

        </head>


        <body>

            <div class="titulo">
                PEDIDO
            </div>

            <div class="pedido">
                #${pedido.id}
            </div>

            <div class="linha"></div>


            <div class="cliente">

                <strong>Cliente:</strong>
                ${pedido.cliente}

            </div>


            <div>

                <strong>WhatsApp:</strong>
                ${pedido.whatsapp}

            </div>


            <div class="tipo">
                ${tipoEntrega}
            </div>


            ${endereco}


            <div class="linha"></div>


            ${itensHTML}


            <div class="linha"></div>


            <div class="valor">

                <span>Subtotal</span>

                <strong>
                    R$ ${formatarValor(
                        Number(pedido.total) -
                        Number(pedido.taxa_entrega)
                    )}
                </strong>

            </div>


            <div class="valor">

                <span>Entrega</span>

                <strong>
                    R$ ${formatarValor(
                        pedido.taxa_entrega
                    )}
                </strong>

            </div>


            <div class="total">

                <span>TOTAL</span>

                <span>
                    R$ ${formatarValor(pedido.total)}
                </span>

            </div>


            ${observacao}


            <div class="rodape">

                Obrigado pela preferência!

            </div>


            <script>

                window.onload = function() {

                    window.print();

                };

            <\/script>


        </body>

        </html>

    `);

    janela.document.close();
}


// ==========================================
// FORMATAR VALOR
// ==========================================

function formatarValor(valor) {

    return Number(valor)
        .toFixed(2)
        .replace(".", ",");
}


// ==========================================
// FORMATAR DATA
// ==========================================

function formatarData(data) {

    return new Date(data).toLocaleString(
        "pt-BR"
    );
}


// ==========================================
// BOTÃO ATUALIZAR
// ==========================================

btnAtualizar.addEventListener(
    "click",
    carregarPedidos
);


// ==========================================
// INICIAR
// ==========================================

carregarPedidos();