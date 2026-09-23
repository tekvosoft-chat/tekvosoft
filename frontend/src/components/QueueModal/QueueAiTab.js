import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import MenuItem from "@material-ui/core/MenuItem";
import Switch from "@material-ui/core/Switch";
import Button from "@material-ui/core/Button";
import AutoAwesomeIcon from "@material-ui/icons/EmojiObjectsOutlined";

import api from "../../services/api";

/**
 * Aba "Assistente de IA" da fila.
 *
 * A chave e o provedor ficam em Configurações > Opções (uma vez para a
 * empresa); aqui se define como a IA desta fila se apresenta e se comporta.
 */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    root: {
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(2),
      padding: theme.spacing(2.5, 3, 1)
    },
    hero: {
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(2),
      padding: theme.spacing(2),
      borderRadius: 16,
      background: `linear-gradient(135deg, ${t.brand.soft}, transparent)`,
      border: `1px solid ${t.border}`
    },
    heroIcon: {
      flex: "none",
      width: 48,
      height: 48,
      borderRadius: 14,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: t.brand.contrastText,
      backgroundColor: t.brand.main,
      "& svg": { fontSize: 28 }
    },
    heroText: { flex: 1, minWidth: 0 },
    heroTitle: { fontSize: 16, fontWeight: 700 },
    muted: { fontSize: 13, color: theme.palette.text.secondary },
    section: {
      padding: theme.spacing(2),
      borderRadius: 16,
      border: `1px solid ${t.border}`,
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(1.5)
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: theme.palette.text.secondary
    },
    row: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: theme.spacing(1.5),
      [theme.breakpoints.down("xs")]: { gridTemplateColumns: "1fr" }
    },
    receives: {
      margin: 0,
      paddingLeft: 18,
      fontSize: 13,
      color: theme.palette.text.secondary,
      "& li": { marginBottom: 4 }
    },
    disabled: { opacity: 0.55, pointerEvents: "none" }
  };
});

export const AI_TEMPLATE = `OBJETIVO
- Tirar dúvidas dos clientes e ajudar no primeiro atendimento.

O QUE VOCÊ PODE FAZER
- Explicar nossos produtos/serviços, horários e formas de pagamento.
- Coletar nome, cidade e o que o cliente precisa antes de passar para a equipe.

O QUE VOCÊ NÃO PODE FAZER
- Dar descontos, confirmar pedidos ou prometer prazos.

COMO RESPONDER
- Cumprimente pelo nome quando souber.
- Faça uma pergunta por vez.
- Ao final, pergunte se pode ajudar em algo mais.`;

const QueueAiTab = ({ enabled, config, onChange, onToggle }) => {
  const classes = useStyles();
  const set = (key, value) => onChange({ ...config, [key]: value });

  // para quem passar o atendimento e em que coluna deixar o card
  const [users, setUsers] = useState([]);
  const [columns, setColumns] = useState([]);
  useEffect(() => {
    api
      .get("/users/list")
      .then(({ data }) => setUsers(data || []))
      .catch(() => setUsers([]));
    api
      .get("/tags/list")
      // a lista traz etiquetas e colunas juntas; aqui só interessa a coluna
      .then(({ data }) => setColumns((data || []).filter(tag => tag.kanban)))
      .catch(() => setColumns([]));
  }, []);

  return (
    <div className={classes.root}>
      <div className={classes.hero}>
        <span className={classes.heroIcon}>
          <AutoAwesomeIcon />
        </span>
        <div className={classes.heroText}>
          <div className={classes.heroTitle}>Assistente de IA desta fila</div>
          <div className={classes.muted}>
            Responde o cliente sozinho enquanto ninguém da equipe aceita o
            atendimento. A chave de IA é configurada em Configurações › Opções.
          </div>
        </div>
        <Switch
          color="primary"
          checked={!!enabled}
          onChange={e => onToggle(e.target.checked)}
        />
      </div>

      <div className={enabled ? undefined : classes.disabled}>
        <div className={classes.section}>
          <div className={classes.sectionTitle}>Identidade</div>
          <div className={classes.row}>
            <TextField
              label="Nome da IA"
              placeholder="Ex.: Luna"
              variant="outlined"
              size="small"
              value={config.name || ""}
              onChange={e => set("name", e.target.value)}
              helperText="Como ela se apresenta para o cliente"
            />
            <TextField
              select
              label="Tom de voz"
              variant="outlined"
              size="small"
              value={config.tone || "friendly"}
              onChange={e => set("tone", e.target.value)}
            >
              <MenuItem value="friendly">Simpático e acolhedor</MenuItem>
              <MenuItem value="formal">Formal e objetivo</MenuItem>
              <MenuItem value="casual">Descontraído</MenuItem>
              <MenuItem value="sales">Consultivo (vendas)</MenuItem>
            </TextField>
          </div>
        </div>

        <div className={classes.section} style={{ marginTop: 16 }}>
          <div className={classes.sectionTitle}>Conhecimento</div>
          <TextField
            label="Sobre a empresa"
            placeholder="O que vocês fazem, produtos e preços, horário, endereço, formas de pagamento, políticas de troca…"
            variant="outlined"
            multiline
            minRows={4}
            value={config.about || ""}
            onChange={e => set("about", e.target.value)}
            helperText="A IA só responde com base nisso — o que não estiver aqui ela diz que vai verificar."
          />
          <TextField
            label="Instruções (prompt)"
            variant="outlined"
            multiline
            minRows={6}
            value={config.instructions || ""}
            onChange={e => set("instructions", e.target.value)}
            helperText="Objetivo, o que pode e o que não pode fazer, e como conduzir a conversa."
          />
          {!config.instructions && (
            <Button
              size="small"
              color="primary"
              style={{ alignSelf: "flex-start" }}
              onClick={() => set("instructions", AI_TEMPLATE)}
            >
              Usar modelo de instruções
            </Button>
          )}
        </div>

        <div className={classes.section} style={{ marginTop: 16 }}>
          <div className={classes.sectionTitle}>Passar para um humano</div>
          <TextField
            label="Quando transferir"
            placeholder="Ex.: reclamação, cancelamento, pedido de orçamento personalizado"
            variant="outlined"
            size="small"
            value={config.handoff || ""}
            onChange={e => set("handoff", e.target.value)}
            helperText="Além de quando o cliente pedir para falar com uma pessoa"
          />
          <TextField
            label="Mensagem ao transferir"
            placeholder="Certo! Vou chamar alguém da nossa equipe para continuar o seu atendimento. 😊"
            variant="outlined"
            size="small"
            value={config.handoffMessage || ""}
            onChange={e => set("handoffMessage", e.target.value)}
          />
          <TextField
            select
            label="Atribuir para"
            variant="outlined"
            size="small"
            value={config.handoffUserId || ""}
            onChange={e => set("handoffUserId", e.target.value)}
            helperText="Ao transferir, o atendimento sai de Aguardando e entra em Atendendo. Sem ninguém escolhido, fica aberto para a equipe pegar."
          >
            <MenuItem value="">Ninguém (aberto para a equipe)</MenuItem>
            {users.map(user => (
              <MenuItem key={user.id} value={user.id}>
                {user.name}
              </MenuItem>
            ))}
          </TextField>
        </div>

        <div className={classes.section} style={{ marginTop: 16 }}>
          <div className={classes.sectionTitle}>Enquanto a IA conversa</div>
          <TextField
            select
            label="Coluna do Kanban"
            variant="outlined"
            size="small"
            value={config.kanbanTagId || ""}
            onChange={e => set("kanbanTagId", e.target.value)}
            helperText='O card vai para esta coluna assim que a IA responde. Vazio usa a coluna "Em atendimento", se existir.'
          >
            <MenuItem value="">Em atendimento (padrão)</MenuItem>
            {columns.map(column => (
              <MenuItem key={column.id} value={column.id}>
                {column.name}
              </MenuItem>
            ))}
          </TextField>
        </div>

        <div className={classes.section} style={{ marginTop: 16 }}>
          <div className={classes.sectionTitle}>O que a IA recebe</div>
          <ul className={classes.receives}>
            <li>
              As instruções acima, o tom de voz e as informações da empresa;
            </li>
            <li>
              Nome do cliente, nome da empresa, da fila, data e hora atuais;
            </li>
            <li>
              As últimas 20 mensagens da conversa (áudios transcritos entram
              como texto);
            </li>
            <li>
              Regras fixas: respostas curtas em português, não inventar preços
              ou prazos e não pedir dados sensíveis.
            </li>
          </ul>
          <div className={classes.muted}>
            Ela para de responder quando alguém da equipe aceita o atendimento
            ou quando transfere para um humano.
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueAiTab;
