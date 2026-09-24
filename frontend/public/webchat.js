/**
 * Bolinha de conversa do site.
 *
 * O cliente cola uma linha na página dele e ganha um botão no canto que abre
 * uma conversa com a equipe. Quem visita não faz login: o navegador guarda um
 * número de sessão e é por ele que a conversa é reconhecida na volta.
 *
 * Uso:
 *   <script src="https://app.seu-dominio/webchat.js"
 *           data-token="TOKEN-DA-CAIXA" data-api="https://api.seu-dominio"
 *           defer></script>
 *
 * Tudo aqui é feito na mão, sem biblioteca: o script entra em sites de
 * terceiros, não pode pesar nem brigar com o CSS de quem hospeda — por isso o
 * conteúdo vive dentro de um shadow root.
 *
 * As respostas chegam por socket. Quando o socket não sobe (rede bloqueada,
 * script fora do ar), a janela aberta pergunta ao servidor de poucos em
 * poucos segundos — em nenhum caso a pessoa precisa recarregar a página.
 */
(function () {
  var script =
    document.currentScript ||
    document.querySelector("script[data-token][src*='webchat.js']");
  if (!script) return;

  var token = script.getAttribute("data-token");
  if (!token) return;

  var base = (script.getAttribute("data-api") || "").replace(/\/+$/, "");
  if (!base) return;

  var chaveMemoria = "vuup:webchat:" + token;
  var sessionId = null;
  var apresentado = false;
  var config = {
    name: "Atendimento",
    color: "#5C59E8",
    welcomeTitle: "Ol\u00e1! \ud83d\udc4b",
    welcomeMessage: "",
    bubblePosition: "right",
    bubbleType: "standard",
    launcherTitle: "",
    replyTime: "minutes",
    showEmoji: true,
    showFiles: true,
    allowEndConversation: true,
    collectEmail: false,
    preChatFields: [],
    giphyKey: ""
  };
  var aberto = false;
  var socket = null;
  var relogio = null;
  var vistos = {};

  try {
    sessionId = localStorage.getItem(chaveMemoria);
    apresentado = !!localStorage.getItem(chaveMemoria + ":ok");
  } catch (e) {
    sessionId = null;
  }

  // escritos por código: assim o arquivo é ASCII puro e não embaralha em
  // página que não declara UTF-8
  var EMOJIS = [
    0x1f600, 0x1f603, 0x1f604, 0x1f601, 0x1f606, 0x1f60a, 0x1f642, 0x1f609,
    0x1f60d, 0x1f970, 0x1f618, 0x1f917, 0x1f914, 0x1f928, 0x1f610, 0x1f634,
    0x1f62e, 0x1f92f, 0x1f622, 0x1f62d, 0x1f624, 0x1f621, 0x1f973, 0x1f60e,
    0x1f929, 0x1f64f, 0x1f44d, 0x1f44e, 0x1f44f, 0x1f64c, 0x1f4aa, 0x1f44b,
    0x1f91d, 0x1f525, 0x2728, 0x1f389, 0x23f0, 0x1f4ce, 0x1f4f7, 0x1f4f1,
    0x1f4ac, 0x1f6d2, 0x1f4b3, 0x1f69a, 0x1f4e6, 0x1f4b0, 0x1f4cd, 0x2b50
  ].map(function (codigo) {
    return String.fromCodePoint(codigo);
  });

  var TEMPOS = {
    minutes: "Normalmente responde em alguns minutos",
    hours: "Normalmente responde em algumas horas",
    day: "Normalmente responde em um dia"
  };

  // ── casca ──────────────────────────────────────────────────────────────
  var host = document.createElement("div");
  host.style.cssText = "position:fixed;z-index:2147483000;right:0;bottom:0;";
  document.body.appendChild(host);
  var raiz = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;

  var estilo = document.createElement("style");
  estilo.textContent = [
    ":host,*{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}",
    "@keyframes vuupSobe{from{opacity:0;transform:translateY(16px) scale(.96)}to{opacity:1;transform:none}}",
    "@keyframes vuupMsg{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}",
    "@keyframes vuupPulso{0%{box-shadow:0 0 0 0 rgba(0,0,0,.28)}70%{box-shadow:0 0 0 14px rgba(0,0,0,0)}100%{box-shadow:0 0 0 0 rgba(0,0,0,0)}}",
    "@keyframes vuupPonto{0%,80%,100%{transform:scale(.6);opacity:.5}40%{transform:scale(1);opacity:1}}",

    ".bolha{position:fixed;bottom:20px;width:60px;height:60px;border-radius:50%;border:none;cursor:pointer;",
    "box-shadow:0 12px 30px -8px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;",
    "transition:transform .18s cubic-bezier(.2,.9,.3,1);animation:vuupPulso 3.2s ease-out 1s 3}",
    ".bolha:hover{transform:scale(1.08)}",
    ".bolha:active{transform:scale(.94)}",
    ".bolha svg{width:27px;height:27px;fill:#fff;transition:transform .2s ease}",
    ".bolha.aberta svg{transform:rotate(90deg) scale(.9)}",

    ".chamada{position:fixed;bottom:34px;padding:10px 15px;border-radius:999px;background:#fff;color:#16161C;",
    "font-size:13px;font-weight:600;box-shadow:0 10px 26px -8px rgba(0,0,0,.35);cursor:pointer;max-width:220px;",
    "animation:vuupSobe .3s ease both}",

    ".janela{position:fixed;bottom:94px;width:370px;max-width:calc(100vw - 28px);height:560px;",
    "max-height:calc(100vh - 130px);background:#fff;border-radius:20px;overflow:hidden;display:none;flex-direction:column;",
    "box-shadow:0 28px 70px -20px rgba(0,0,0,.5)}",
    ".janela.on{display:flex;animation:vuupSobe .26s cubic-bezier(.2,.9,.3,1) both}",

    ".topo{padding:18px 18px 16px;color:#fff;display:flex;align-items:center;gap:12px}",
    ".avatar{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.22);display:flex;",
    "align-items:center;justify-content:center;font-weight:700;font-size:16px;flex:none}",
    ".topoTexto{flex:1;min-width:0}",
    ".topo h3{margin:0;font-size:16px;font-weight:700;display:flex;align-items:center;gap:7px}",
    ".vivo{width:8px;height:8px;border-radius:50%;background:#4ADE80;flex:none}",
    ".topo p{margin:3px 0 0;font-size:12.5px;opacity:.92}",
    ".fechar{border:none;background:rgba(255,255,255,.18);color:#fff;width:28px;height:28px;border-radius:50%;",
    "cursor:pointer;font-size:15px;line-height:1;flex:none}",

    ".lista{flex:1;overflow-y:auto;padding:16px;background:#F5F5F8;display:flex;flex-direction:column;gap:8px}",
    ".msg{max-width:78%;padding:10px 13px;border-radius:16px;font-size:14px;line-height:1.45;white-space:pre-wrap;",
    "word-break:break-word;animation:vuupMsg .22s ease both;",
    // dá para marcar e copiar o que a equipe escreveu
    "user-select:text;-webkit-user-select:text;cursor:text}",
    ".deles{align-self:flex-start;background:#fff;color:#17171C;border-bottom-left-radius:6px;box-shadow:0 1px 2px rgba(0,0,0,.08)}",
    ".minha{align-self:flex-end;color:#fff;border-bottom-right-radius:6px}",
    ".msg img{max-width:100%;border-radius:12px;display:block}",
    ".hora{display:block;margin-top:4px;font-size:10.5px;opacity:.6;text-align:right}",
    ".digitando{align-self:flex-start;display:none;gap:4px;padding:11px 14px;background:#fff;border-radius:16px;",
    "border-bottom-left-radius:6px;box-shadow:0 1px 2px rgba(0,0,0,.08)}",
    ".digitando.on{display:flex}",
    ".digitando span{width:6px;height:6px;border-radius:50%;background:#9A9AA5;animation:vuupPonto 1.2s infinite}",
    ".digitando span:nth-child(2){animation-delay:.15s}",
    ".digitando span:nth-child(3){animation-delay:.3s}",

    ".acoes{display:flex;gap:8px;padding:0 12px 8px;background:#fff}",
    ".acoes button{border:none;background:#F1F1F5;color:#54545F;border-radius:999px;padding:6px 11px;font-size:12px;",
    "cursor:pointer;transition:background .15s ease}",
    ".acoes button:hover{background:#E6E6EC}",

    ".painel{display:none;padding:10px 12px;background:#fff;border-top:1px solid #EFEFF3;max-height:190px;overflow-y:auto}",
    ".painel.on{display:block;animation:vuupMsg .18s ease both}",
    ".emojis{display:grid;grid-template-columns:repeat(8,1fr);gap:4px}",
    ".emojis button{border:none;background:transparent;font-size:19px;cursor:pointer;border-radius:8px;padding:4px}",
    ".emojis button:hover{background:#F1F1F5}",
    ".gifs{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}",
    ".gifs img{width:100%;height:84px;object-fit:cover;border-radius:10px;cursor:pointer}",
    ".buscaGif{width:100%;border:1px solid #E6E6EC;border-radius:10px;padding:8px 10px;font-size:13px;",
    "margin-bottom:8px;outline:none}",

    ".barra{display:flex;gap:6px;align-items:center;padding:10px;background:#fff;border-top:1px solid #EFEFF3}",
    ".barra input[type=text]{flex:1;border:none;outline:none;font-size:14px;padding:11px 14px;background:#F2F2F6;",
    "border-radius:999px;color:#17171C;min-width:0}",
    ".icone{border:none;background:transparent;cursor:pointer;font-size:17px;padding:4px 6px;border-radius:8px;",
    "color:#70707B;transition:background .15s ease,transform .12s ease}",
    ".icone:hover{background:#F1F1F5;transform:translateY(-1px)}",
    ".gif{font-size:11px;font-weight:800;letter-spacing:.03em}",
    ".enviar{border:none;cursor:pointer;width:40px;height:40px;border-radius:50%;color:#fff;font-size:15px;flex:none;",
    "transition:transform .12s ease}",
    ".enviar:hover{transform:scale(1.06)}",

    ".formulario{padding:18px;display:none;flex-direction:column;gap:12px;background:#F5F5F8;flex:1;overflow-y:auto}",
    ".formulario.on{display:flex;animation:vuupMsg .22s ease both}",
    ".formulario label{font-size:12.5px;font-weight:600;color:#54545F;display:block;margin-bottom:5px}",
    ".formulario input{width:100%;border:1px solid #E4E4EA;border-radius:12px;padding:11px 13px;font-size:14px;",
    "outline:none;background:#fff;transition:border-color .15s ease}",
    ".formulario input:focus{border-color:#B9B9C6}",
    ".enviarForm{border:none;color:#fff;border-radius:12px;padding:12px;font-size:14px;font-weight:700;cursor:pointer}",
    ".pular{background:none;border:none;color:#70707B;font-size:12.5px;cursor:pointer;text-decoration:underline}",

    ".inicio{display:none;flex-direction:column;gap:10px;padding:22px 20px;background:#F5F5F8;flex:1;overflow-y:auto}",
    ".inicio.on{display:flex;animation:vuupMsg .22s ease both}",
    ".inicioTitulo{font-size:21px;font-weight:700;color:#17171C;line-height:1.3}",
    ".inicioTexto{font-size:14px;color:#54545F;line-height:1.5}",
    ".cartao{margin-top:auto;background:#fff;border-radius:14px;padding:16px;box-shadow:0 6px 20px -10px rgba(0,0,0,.3)}",
    ".cartaoTitulo{font-size:14px;font-weight:700;color:#17171C}",
    ".cartaoSub{font-size:12.5px;color:#70707B;margin:3px 0 10px}",
    ".comecar{border:none;background:none;padding:0;font-size:14px;font-weight:700;cursor:pointer}",
    ".voltar{border:none;background:rgba(255,255,255,.18);color:#fff;width:28px;height:28px;border-radius:50%;",
    "cursor:pointer;font-size:14px;line-height:1;flex:none;display:none}",
    ".voltar.on{display:block}",
    ".rodape{padding:7px;text-align:center;font-size:11px;color:#8A8A95;background:#fff}"
  ].join("");
  raiz.appendChild(estilo);

  var bolha = document.createElement("button");
  bolha.className = "bolha";
  bolha.setAttribute("aria-label", "Abrir conversa");
  bolha.innerHTML =
    '<svg viewBox="0 0 24 24"><path d="M12 3C7 3 3 6.6 3 11c0 2.2 1 4.2 2.7 5.6L5 21l4.6-1.8c.8.2 1.6.3 2.4.3 5 0 9-3.6 9-8s-4-8-9-8z"/></svg>';
  raiz.appendChild(bolha);

  var chamada = document.createElement("div");
  chamada.className = "chamada";
  chamada.style.display = "none";
  raiz.appendChild(chamada);

  var janela = document.createElement("div");
  janela.className = "janela";
  janela.innerHTML =
    '<div class="topo">' +
    '<button class="voltar" aria-label="Voltar">&#10094;</button>' +
    '<div class="avatar"></div>' +
    '<div class="topoTexto"><h3><span class="nome"></span><span class="vivo"></span></h3><p></p></div>' +
    '<button class="fechar" aria-label="Fechar">&#10005;</button>' +
    "</div>" +
    '<div class="inicio">' +
    '<div class="inicioTitulo"></div>' +
    '<div class="inicioTexto"></div>' +
    '<div class="cartao">' +
    '<div class="cartaoTitulo">Estamos conectados</div>' +
    '<div class="cartaoSub"></div>' +
    '<button type="button" class="comecar">Iniciar conversa &#8250;</button>' +
    "</div></div>" +
    '<form class="formulario"></form>' +
    '<div class="lista"><div class="digitando"><span></span><span></span><span></span></div></div>' +
    '<div class="acoes"></div>' +
    '<div class="painel painelEmoji"><div class="emojis"></div></div>' +
    '<div class="painel painelGif">' +
    '<input class="buscaGif" placeholder="Procurar GIF" />' +
    '<div class="gifs"></div></div>' +
    '<form class="barra">' +
    '<input type="file" style="display:none" />' +
    '<button type="button" class="icone anexo" title="Enviar arquivo">&#128206;</button>' +
    '<button type="button" class="icone emoji" title="Emoji">&#9786;</button>' +
    '<button type="button" class="icone gif" title="GIF">GIF</button>' +
    '<input type="text" placeholder="Escreva sua mensagem" />' +
    '<button type="submit" class="enviar">&#10148;</button></form>' +
    '<div class="rodape">Conversa por vuup.me</div>';
  raiz.appendChild(janela);

  var topo = janela.querySelector(".topo");
  var avatar = janela.querySelector(".avatar");
  var nomeTopo = janela.querySelector(".nome");
  var subtitulo = janela.querySelector(".topo p");
  var fechar = janela.querySelector(".fechar");
  var lista = janela.querySelector(".lista");
  var digitando = janela.querySelector(".digitando");
  var acoes = janela.querySelector(".acoes");
  var formulario = janela.querySelector(".formulario");
  var painelEmoji = janela.querySelector(".painelEmoji");
  var painelGif = janela.querySelector(".painelGif");
  var gradeEmoji = janela.querySelector(".emojis");
  var gradeGif = janela.querySelector(".gifs");
  var buscaGif = janela.querySelector(".buscaGif");
  var barra = janela.querySelector(".barra");
  var campo = janela.querySelector('.barra input[type="text"]');
  var enviar = janela.querySelector(".enviar");
  var botaoAnexo = janela.querySelector(".anexo");
  var botaoEmoji = janela.querySelector(".emoji");
  var botaoGif = janela.querySelector(".gif");
  var arquivo = janela.querySelector('.barra input[type="file"]');
  var inicio = janela.querySelector(".inicio");
  var inicioTitulo = janela.querySelector(".inicioTitulo");
  var inicioTexto = janela.querySelector(".inicioTexto");
  var cartaoSub = janela.querySelector(".cartaoSub");
  var comecar = janela.querySelector(".comecar");
  var voltar = janela.querySelector(".voltar");

  function escurecer(cor) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cor || "");
    if (!m) return cor;
    var partes = [1, 2, 3].map(function (i) {
      return Math.max(0, Math.round(parseInt(m[i], 16) * 0.72));
    });
    return "rgb(" + partes.join(",") + ")";
  }

  function pintar() {
    var lado = config.bubblePosition === "left" ? "left" : "right";
    var oposto = lado === "left" ? "right" : "left";
    [bolha, janela, chamada].forEach(function (el) {
      el.style[lado] = "20px";
      el.style[oposto] = "auto";
    });
    chamada.style[lado] = "92px";

    bolha.style.background = config.color;
    topo.style.background =
      "linear-gradient(135deg, " +
      config.color +
      ", " +
      escurecer(config.color) +
      ")";
    enviar.style.background = config.color;
    avatar.textContent = (config.name || "A").trim().charAt(0).toUpperCase();
    nomeTopo.textContent = config.welcomeTitle || config.name;
    subtitulo.textContent = TEMPOS[config.replyTime] || TEMPOS.minutes;

    chamada.textContent = config.launcherTitle || "";
    chamada.style.display =
      config.bubbleType === "expanded" && !aberto && chamada.textContent
        ? "block"
        : "none";

    botaoAnexo.style.display = config.showFiles === false ? "none" : "";
    botaoEmoji.style.display = config.showEmoji === false ? "none" : "";
    botaoGif.style.display = config.giphyKey ? "" : "none";
    montarAcoes();
  }

  function montarAcoes() {
    acoes.innerHTML = "";
    if (config.allowEndConversation === false) {
      acoes.style.display = "none";
      return;
    }
    acoes.style.display = "flex";
    var botao = document.createElement("button");
    botao.type = "button";
    botao.textContent = "Encerrar conversa";
    botao.addEventListener("click", function () {
      pedir("/webchat/" + token + "/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId })
      })
        .then(function () {
          bolhaDeMensagem({ body: "Conversa encerrada. Obrigado!" }, false);
        })
        .catch(function () {});
    });
    acoes.appendChild(botao);
  }

  function horaDe(quando) {
    try {
      return new Date(quando || Date.now()).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return "";
    }
  }

  function urlDaMidia(caminho) {
    if (/^https?:\/\//i.test(caminho)) return caminho;
    return base + "/public/" + caminho;
  }

  function bolhaDeMensagem(m, minha) {
    if (m.id) {
      if (vistos[m.id]) return;
      vistos[m.id] = true;
    }
    var div = document.createElement("div");
    div.className = "msg " + (minha ? "minha" : "deles");
    if (minha) div.style.background = config.color;

    var url = m.mediaUrl ? urlDaMidia(m.mediaUrl) : null;
    var ehImagem = url
      ? /\.(png|jpe?g|gif|webp)(\?|$)/i.test(url)
      : /^https?:\/\/\S+\.gif(\?|$)/i.test(m.body || "");

    if (ehImagem) {
      var img = document.createElement("img");
      img.src = url || m.body;
      img.alt = "";
      div.appendChild(img);
    } else if (url) {
      var link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "\ud83d\udcce " + (m.body || "arquivo");
      link.style.color = minha ? "#fff" : config.color;
      div.appendChild(link);
    } else {
      div.appendChild(document.createTextNode(m.body || ""));
    }

    var hora = document.createElement("span");
    hora.className = "hora";
    hora.textContent = horaDe(m.createdAt);
    div.appendChild(hora);

    lista.insertBefore(div, digitando);
    lista.scrollTop = lista.scrollHeight;
  }

  function pedir(caminho, opcoes) {
    return fetch(base + caminho, opcoes).then(function (r) {
      if (!r.ok) {
        var erro = new Error("falha");
        erro.status = r.status;
        throw erro;
      }
      return r.json();
    });
  }

  /** Erro que diz o que houve: "tente de novo" não ajuda ninguém. */
  function avisar(erro) {
    var texto = "N\u00e3o consegui enviar. Tente de novo.";
    if (erro && erro.status === 404) {
      texto =
        "Esta caixa de entrada n\u00e3o existe mais. Confira o token do script.";
    } else if (!erro || !erro.status) {
      texto =
        "N\u00e3o consegui falar com o servidor. Confira o endere\u00e7o em data-api.";
    }
    bolhaDeMensagem({ body: texto }, false);
  }

  // ── conversa ───────────────────────────────────────────────────────────
  function abrirSessao(respostas) {
    var corpo = { sessionId: sessionId };
    if (respostas) {
      corpo.name = respostas.name || "";
      corpo.email = respostas.email || "";
      corpo.extra = respostas.extra || {};
    }
    return pedir("/webchat/" + token + "/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo)
    }).then(function (dados) {
      sessionId = dados.sessionId;
      try {
        localStorage.setItem(chaveMemoria, sessionId);
      } catch (e) {
        /* navegador sem armazenamento: a conversa vale só nesta visita */
      }
      config = dados.config || config;
      pintar();
      vistos = {};
      Array.prototype.slice
        .call(lista.querySelectorAll(".msg"))
        .forEach(function (el) {
          el.remove();
        });
      (dados.messages || []).forEach(function (m) {
        bolhaDeMensagem(m, !m.fromMe);
      });
      ligarTempoReal();
    });
  }

  /**
   * Tempo real com duas pernas: o socket (instantâneo) e, se ele não subir,
   * uma checagem de poucos em poucos segundos enquanto a janela está aberta.
   * Uma das duas sempre funciona — ninguém precisa recarregar a página.
   */
  function ligarTempoReal() {
    if (!sessionId) return;
    conectarSocket();
    if (!relogio) relogio = setInterval(buscarNovas, 5000);
  }

  var carregando = false;
  function carregarSocketIo(pronto) {
    if (window.io) return pronto();
    if (carregando) return;
    carregando = true;
    var s = document.createElement("script");
    s.src = base + "/socket.io/socket.io.js";
    s.onload = function () {
      carregando = false;
      pronto();
    };
    s.onerror = function () {
      carregando = false;
    };
    document.head.appendChild(s);
  }

  function conectarSocket() {
    if (socket || !sessionId) return;
    if (!window.io) {
      carregarSocketIo(conectarSocket);
      return;
    }
    socket = window.io(base, {
      query: { webchat: sessionId },
      transports: ["websocket", "polling"]
    });
    socket.on("webchat-message", function (m) {
      if (m && m.fromMe) {
        digitando.classList.remove("on");
        bolhaDeMensagem(m, false);
      }
    });
  }

  function buscarNovas() {
    if (!sessionId || !aberto) return;
    pedir(
      "/webchat/" +
        token +
        "/messages?sessionId=" +
        encodeURIComponent(sessionId),
      {}
    )
      .then(function (mensagens) {
        (mensagens || []).forEach(function (m) {
          if (!vistos[m.id]) bolhaDeMensagem(m, !m.fromMe);
        });
      })
      .catch(function () {});
  }

  // ── primeiras perguntas ────────────────────────────────────────────────
  function montarFormulario() {
    var campos = config.preChatFields || [];
    formulario.innerHTML = "";
    campos.forEach(function (item) {
      var bloco = document.createElement("div");
      var rotulo = document.createElement("label");
      rotulo.textContent = item.label + (item.required ? " *" : "");
      var entrada = document.createElement("input");
      entrada.type = item.type || "text";
      entrada.name = item.key;
      entrada.required = !!item.required;
      bloco.appendChild(rotulo);
      bloco.appendChild(entrada);
      formulario.appendChild(bloco);
    });

    var botao = document.createElement("button");
    botao.type = "submit";
    botao.className = "enviarForm";
    botao.style.background = config.color;
    botao.textContent = "Começar a conversa";
    formulario.appendChild(botao);

    var obrigatorio = campos.some(function (item) {
      return item.required;
    });
    if (!obrigatorio) {
      var pular = document.createElement("button");
      pular.type = "button";
      pular.className = "pular";
      pular.textContent = "Prefiro não informar";
      pular.addEventListener("click", function () {
        concluirFormulario({});
      });
      formulario.appendChild(pular);
    }
  }

  function concluirFormulario(respostas) {
    apresentado = true;
    try {
      localStorage.setItem(chaveMemoria + ":ok", "1");
    } catch (e) {
      /* sem armazenamento: as perguntas voltam na próxima visita */
    }
    formulario.classList.remove("on");
    mostrar("conversa");
    abrirSessao(respostas).then(function () {
      campo.focus();
    });
  }

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();
    var respostas = { extra: {} };
    Array.prototype.slice
      .call(formulario.querySelectorAll("input"))
      .forEach(function (entrada) {
        var valor = entrada.value.trim();
        if (!valor) return;
        if (entrada.name === "name") respostas.name = valor;
        else if (entrada.name === "email") respostas.email = valor;
        else {
          // guarda pelo rótulo da pergunta: é assim que aparece na ficha
          var campoConfig = (config.preChatFields || []).filter(function (c) {
            return c.key === entrada.name;
          })[0];
          respostas.extra[
            (campoConfig && campoConfig.label) || entrada.name
          ] = valor;
        }
      });
    concluirFormulario(respostas);
  });

  // ── interação ──────────────────────────────────────────────────────────
  /**
   * Três telas, como no Chatwoot: a de entrada (boas-vindas e o convite), a
   * das perguntas e a conversa. A seta do topo volta para a entrada.
   */
  function mostrar(tela) {
    inicio.classList.toggle("on", tela === "inicio");
    formulario.classList.toggle("on", tela === "form");
    var conversa = tela === "conversa";
    lista.style.display = conversa ? "flex" : "none";
    barra.style.display = conversa ? "flex" : "none";
    acoes.style.display =
      conversa && config.allowEndConversation !== false ? "flex" : "none";
    voltar.classList.toggle("on", tela !== "inicio");

    if (tela === "inicio") {
      inicioTitulo.textContent = config.welcomeTitle || config.name;
      inicioTexto.textContent = config.welcomeMessage || "";
      cartaoSub.textContent = TEMPOS[config.replyTime] || TEMPOS.minutes;
      comecar.style.color = config.color;
    }
    if (tela === "form") montarFormulario();
    if (tela === "conversa") {
      campo.focus();
      if (!sessionId || !lista.querySelector(".msg")) abrirSessao();
      else ligarTempoReal();
    }
  }

  function entrar() {
    if (config.collectEmail && !apresentado) mostrar("form");
    else mostrar("conversa");
  }

  function alternar(estado) {
    aberto = estado === undefined ? !aberto : estado;
    janela.classList.toggle("on", aberto);
    bolha.classList.toggle("aberta", aberto);
    chamada.style.display =
      config.bubbleType === "expanded" && !aberto && chamada.textContent
        ? "block"
        : "none";
    if (!aberto) return;
    // já conversou antes: abre direto na conversa
    if (sessionId && apresentado) mostrar("conversa");
    else mostrar("inicio");
  }

  comecar.addEventListener("click", entrar);
  voltar.addEventListener("click", function () {
    mostrar("inicio");
  });

  bolha.addEventListener("click", function () {
    alternar();
  });
  chamada.addEventListener("click", function () {
    alternar(true);
  });
  fechar.addEventListener("click", function () {
    alternar(false);
  });

  botaoAnexo.addEventListener("click", function () {
    arquivo.click();
  });

  arquivo.addEventListener("change", function () {
    var file = arquivo.files && arquivo.files[0];
    if (!file) return;
    var dados = new FormData();
    dados.append("sessionId", sessionId);
    dados.append("medias", file, file.name);
    bolhaDeMensagem({ body: "\ud83d\udcce " + file.name }, true);
    fetch(base + "/webchat/" + token + "/upload", {
      method: "POST",
      body: dados
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (resposta) {
        if (resposta && resposta.id) vistos[resposta.id] = true;
      })
      .catch(function () {
        bolhaDeMensagem({ body: "N\u00e3o consegui enviar o arquivo." }, false);
      });
    arquivo.value = "";
  });

  EMOJIS.forEach(function (emoji) {
    var botao = document.createElement("button");
    botao.type = "button";
    botao.textContent = emoji;
    botao.addEventListener("click", function () {
      campo.value += emoji;
      campo.focus();
    });
    gradeEmoji.appendChild(botao);
  });

  botaoEmoji.addEventListener("click", function () {
    painelGif.classList.remove("on");
    painelEmoji.classList.toggle("on");
  });

  // GIFs: só aparecem quando há chave do Giphy nos ajustes da caixa
  var buscaTimer = null;
  function procurarGifs(termo) {
    if (!config.giphyKey) return;
    var url =
      "https://api.giphy.com/v1/gifs/" +
      (termo ? "search?q=" + encodeURIComponent(termo) + "&" : "trending?") +
      "api_key=" +
      encodeURIComponent(config.giphyKey) +
      "&limit=12&rating=g";
    fetch(url)
      .then(function (r) {
        return r.json();
      })
      .then(function (dados) {
        gradeGif.innerHTML = "";
        (dados.data || []).forEach(function (item) {
          var prev = item.images && item.images.fixed_height_small;
          var cheio = item.images && item.images.downsized_medium;
          if (!prev || !cheio) return;
          var img = document.createElement("img");
          img.src = prev.url;
          img.alt = item.title || "gif";
          img.addEventListener("click", function () {
            enviarTexto(cheio.url);
            painelGif.classList.remove("on");
          });
          gradeGif.appendChild(img);
        });
      })
      .catch(function () {});
  }

  botaoGif.addEventListener("click", function () {
    painelEmoji.classList.remove("on");
    painelGif.classList.toggle("on");
    if (painelGif.classList.contains("on") && !gradeGif.childNodes.length) {
      procurarGifs("");
    }
  });

  buscaGif.addEventListener("input", function () {
    clearTimeout(buscaTimer);
    var termo = buscaGif.value.trim();
    buscaTimer = setTimeout(function () {
      procurarGifs(termo);
    }, 400);
  });

  function enviarTexto(texto) {
    if (!texto) return;
    bolhaDeMensagem({ body: texto }, true);
    // sem sessão não há para onde mandar: abre uma e só então envia
    if (!sessionId) {
      abrirSessao()
        .then(function () {
          mandar(texto);
        })
        .catch(avisar);
      return;
    }
    mandar(texto);
  }

  function mandar(texto) {
    pedir("/webchat/" + token + "/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionId, body: texto })
    })
      .then(function (dados) {
        // já está na tela: marca como vista para a checagem não repetir
        if (dados && dados.id) vistos[dados.id] = true;
      })
      .catch(avisar);
  }

  barra.addEventListener("submit", function (evento) {
    evento.preventDefault();
    var texto = campo.value.trim();
    if (!texto) return;
    campo.value = "";
    painelEmoji.classList.remove("on");
    painelGif.classList.remove("on");
    enviarTexto(texto);
  });

  // cor e textos já na primeira pintura, antes mesmo de abrir
  pedir("/webchat/" + token + "/config", {})
    .then(function (dados) {
      config = dados;
      pintar();
    })
    .catch(pintar);

  if (sessionId) ligarTempoReal();
})();
