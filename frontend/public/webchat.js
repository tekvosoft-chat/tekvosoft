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

  var storageKey = "vuup:webchat:" + token;
  var sessionId = null;
  var config = {
    name: "Atendimento",
    color: "#5C59E8",
    welcomeTitle: "Olá! 👋",
    welcomeMessage: ""
  };
  var aberto = false;
  var socket = null;

  try {
    sessionId = localStorage.getItem(storageKey);
  } catch (e) {
    sessionId = null;
  }

  // ── casca ──────────────────────────────────────────────────────────────
  var host = document.createElement("div");
  host.style.cssText = "position:fixed;z-index:2147483000;right:0;bottom:0;";
  document.body.appendChild(host);
  var raiz = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;

  var estilo = document.createElement("style");
  estilo.textContent = [
    ":host,*{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}",
    ".chamada{position:fixed;bottom:34px;padding:9px 14px;border-radius:999px;background:#fff;color:#1A1A1F;",
    "font-size:13px;font-weight:600;box-shadow:0 8px 24px -8px rgba(0,0,0,.35);cursor:pointer;max-width:210px}",
    ".acoes{display:flex;gap:8px;align-items:center;padding:0 10px 8px;background:#fff}",
    ".acoes button{border:none;background:#F2F2F5;color:#4A4A55;border-radius:999px;padding:6px 10px;font-size:12px;cursor:pointer}",
    ".formulario{padding:16px;display:flex;flex-direction:column;gap:10px;background:#F6F6F8;flex:1}",
    ".formulario input{border:1px solid #E2E2E8;border-radius:10px;padding:10px 12px;font-size:14px;outline:none}",
    ".formulario button{border:none;color:#fff;border-radius:10px;padding:11px;font-size:14px;font-weight:600;cursor:pointer}",
    ".icone{border:none;background:transparent;cursor:pointer;font-size:18px;padding:0 4px;color:#7A7A85}",
    ".bolha{position:fixed;bottom:20px;width:58px;height:58px;border-radius:50%;border:none;cursor:pointer;",
    "box-shadow:0 10px 30px -8px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;transition:transform .15s ease}",
    ".bolha:hover{transform:scale(1.06)}",
    ".bolha svg{width:26px;height:26px;fill:#fff}",
    ".janela{position:fixed;bottom:90px;width:360px;max-width:calc(100vw - 32px);height:520px;",
    "max-height:calc(100vh - 120px);background:#fff;border-radius:18px;box-shadow:0 24px 60px -18px rgba(0,0,0,.45);",
    "display:none;flex-direction:column;overflow:hidden}",
    ".janela.on{display:flex}",
    ".topo{padding:16px 18px;color:#fff}",
    ".topo h3{margin:0;font-size:16px;font-weight:700}",
    ".topo p{margin:4px 0 0;font-size:13px;opacity:.9}",
    ".lista{flex:1;overflow-y:auto;padding:16px;background:#F6F6F8;display:flex;flex-direction:column;gap:8px}",
    ".msg{max-width:78%;padding:9px 12px;border-radius:14px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-break:break-word}",
    ".deles{align-self:flex-start;background:#fff;color:#1A1A1F;box-shadow:0 1px 2px rgba(0,0,0,.08)}",
    ".minha{align-self:flex-end;color:#fff}",
    ".barra{display:flex;gap:8px;padding:10px;background:#fff;border-top:1px solid #ECECF0}",
    ".barra input{flex:1;border:none;outline:none;font-size:14px;padding:10px 12px;background:#F2F2F5;border-radius:999px;color:#1A1A1F}",
    ".barra button{border:none;cursor:pointer;width:40px;height:40px;border-radius:50%;color:#fff;font-size:16px}",
    ".rodape{padding:6px;text-align:center;font-size:11px;color:#8A8A95;background:#fff}"
  ].join("");
  raiz.appendChild(estilo);

  var bolha = document.createElement("button");
  bolha.className = "bolha";
  bolha.setAttribute("aria-label", "Abrir conversa");
  bolha.innerHTML =
    '<svg viewBox="0 0 24 24"><path d="M12 3C7 3 3 6.6 3 11c0 2.2 1 4.2 2.7 5.6L5 21l4.6-1.8c.8.2 1.6.3 2.4.3 5 0 9-3.6 9-8s-4-8-9-8z"/></svg>';
  raiz.appendChild(bolha);

  var janela = document.createElement("div");
  janela.className = "janela";
  janela.innerHTML =
    '<div class="topo"><h3></h3><p></p></div>' +
    '<form class="formulario" style="display:none">' +
    '<input type="text" name="nome" placeholder="Seu nome" />' +
    '<input type="email" name="email" placeholder="Seu e-mail" />' +
    '<button type="submit">Começar a conversa</button></form>' +
    '<div class="lista"></div>' +
    '<div class="acoes"></div>' +
    '<form class="barra">' +
    '<input type="file" style="display:none" />' +
    '<button type="button" class="icone anexo" title="Enviar arquivo">&#128206;</button>' +
    '<button type="button" class="icone emoji" title="Emoji">&#128512;</button>' +
    '<input type="text" placeholder="Escreva sua mensagem" />' +
    '<button type="submit">&#10148;</button></form>' +
    '<div class="rodape">Conversa por vuup.me</div>';
  raiz.appendChild(janela);

  var topo = janela.querySelector(".topo");
  var titulo = janela.querySelector(".topo h3");
  var subtitulo = janela.querySelector(".topo p");
  var lista = janela.querySelector(".lista");
  var form = janela.querySelector(".barra");
  // o primeiro input da barra passou a ser o de arquivo (escondido)
  var campo = janela.querySelector('.barra input[type="text"]');
  var enviar = janela.querySelector('.barra button[type="submit"]');
  var chamada = document.createElement("div");
  chamada.className = "chamada";
  chamada.style.display = "none";
  raiz.appendChild(chamada);
  var acoes = janela.querySelector(".acoes");
  var formulario = janela.querySelector(".formulario");
  var botaoAnexo = janela.querySelector(".anexo");
  var botaoEmoji = janela.querySelector(".emoji");
  var arquivo = janela.querySelector('.barra input[type="file"]');
  var EMOJIS = ["😀", "😅", "👍", "🙏", "❤️", "🎉", "😕", "🔥"];

  var TEMPOS = {
    minutes: "Normalmente responde em alguns minutos",
    hours: "Normalmente responde em algumas horas",
    day: "Normalmente responde em um dia"
  };

  function pintar() {
    var lado = config.bubblePosition === "left" ? "left" : "right";
    var oposto = lado === "left" ? "right" : "left";
    [bolha, janela, chamada].forEach(function (el) {
      el.style[lado] = "20px";
      el.style[oposto] = "auto";
    });
    if (lado === "left") chamada.style.left = "88px";
    else chamada.style.right = "88px";

    bolha.style.background = config.color;
    topo.style.background = config.color;
    enviar.style.background = config.color;
    formulario.querySelector("button").style.background = config.color;
    titulo.textContent = config.welcomeTitle || config.name;
    subtitulo.textContent = TEMPOS[config.replyTime] || TEMPOS.minutes;

    chamada.textContent = config.launcherTitle || "";
    chamada.style.display =
      config.bubbleType === "expanded" && !aberto && chamada.textContent
        ? "block"
        : "none";

    botaoAnexo.style.display = config.showFiles === false ? "none" : "";
    botaoEmoji.style.display = config.showEmoji === false ? "none" : "";
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
          bolhaDeMensagem("Conversa encerrada. Obrigado!", false);
        })
        .catch(function () {});
    });
    acoes.appendChild(botao);
  }

  function bolhaDeMensagem(texto, minha) {
    var div = document.createElement("div");
    div.className = "msg " + (minha ? "minha" : "deles");
    if (minha) div.style.background = config.color;
    div.textContent = texto;
    lista.appendChild(div);
    lista.scrollTop = lista.scrollHeight;
  }

  function pedir(caminho, opcoes) {
    return fetch(base + caminho, opcoes).then(function (r) {
      if (!r.ok) throw new Error("falha");
      return r.json();
    });
  }

  function abrirSessao() {
    return pedir("/webchat/" + token + "/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionId })
    }).then(function (dados) {
      sessionId = dados.sessionId;
      try {
        localStorage.setItem(storageKey, sessionId);
      } catch (e) {
        /* navegador sem armazenamento: a conversa vale só nesta visita */
      }
      config = dados.config || config;
      pintar();
      lista.innerHTML = "";
      (dados.messages || []).forEach(function (m) {
        bolhaDeMensagem(m.body, !m.fromMe);
      });
      ouvir();
    });
  }

  // as respostas da equipe chegam pelo mesmo socket do sistema
  function ouvir() {
    if (socket || !window.io || !sessionId) return;
    socket = window.io(base, {
      query: { webchat: sessionId },
      transports: ["websocket", "polling"]
    });
    socket.on("webchat-message", function (m) {
      if (m && m.fromMe) bolhaDeMensagem(m.body, false);
    });
  }

  function carregarSocketIo(pronto) {
    if (window.io) return pronto();
    var s = document.createElement("script");
    s.src = base + "/socket.io/socket.io.js";
    s.onload = pronto;
    s.onerror = pronto;
    document.head.appendChild(s);
  }

  botaoAnexo.addEventListener("click", function () {
    arquivo.click();
  });

  arquivo.addEventListener("change", function () {
    var file = arquivo.files && arquivo.files[0];
    if (!file) return;
    var dados = new FormData();
    dados.append("sessionId", sessionId);
    dados.append("medias", file, file.name);
    bolhaDeMensagem("📎 " + file.name, true);
    fetch(base + "/webchat/" + token + "/upload", {
      method: "POST",
      body: dados
    }).catch(function () {
      bolhaDeMensagem("Não consegui enviar o arquivo.", false);
    });
    arquivo.value = "";
  });

  botaoEmoji.addEventListener("click", function () {
    var atual = campo.value;
    var escolha = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    campo.value = atual + escolha;
    campo.focus();
  });

  // formulário de nome e e-mail antes da primeira mensagem
  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();
    var nome = formulario.querySelector('input[name="nome"]').value.trim();
    var email = formulario.querySelector('input[name="email"]').value.trim();
    pedir("/webchat/" + token + "/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionId, name: nome, email: email })
    }).then(function (dados) {
      sessionId = dados.sessionId;
      try {
        localStorage.setItem(storageKey, sessionId);
        localStorage.setItem(storageKey + ":ok", "1");
      } catch (e) {
        /* sem armazenamento: o formulário volta na próxima visita */
      }
      formulario.style.display = "none";
      lista.style.display = "flex";
      ouvir();
    });
  });

  bolha.addEventListener("click", function () {
    aberto = !aberto;
    janela.classList.toggle("on", aberto);
    chamada.style.display =
      config.bubbleType === "expanded" && !aberto && chamada.textContent
        ? "block"
        : "none";
    if (aberto) {
      var jaApresentou = false;
      try {
        jaApresentou = !!localStorage.getItem(storageKey + ":ok");
      } catch (e) {
        jaApresentou = false;
      }
      if (config.collectEmail && !jaApresentou) {
        formulario.style.display = "flex";
        lista.style.display = "none";
        return;
      }
      campo.focus();
      if (!sessionId || !lista.childNodes.length) abrirSessao();
    }
  });

  chamada.addEventListener("click", function () {
    bolha.click();
  });

  form.addEventListener("submit", function (evento) {
    evento.preventDefault();
    var texto = campo.value.trim();
    if (!texto) return;
    campo.value = "";
    bolhaDeMensagem(texto, true);
    pedir("/webchat/" + token + "/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionId, body: texto })
    }).catch(function () {
      bolhaDeMensagem("Não consegui enviar. Tente de novo.", false);
    });
  });

  // cor e textos já na primeira pintura, antes mesmo de abrir
  pedir("/webchat/" + token + "/config", {})
    .then(function (dados) {
      config = dados;
      pintar();
    })
    .catch(pintar);

  carregarSocketIo(function () {
    if (sessionId) ouvir();
  });
})();
