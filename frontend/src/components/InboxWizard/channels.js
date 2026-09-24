import React from "react";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import LanguageRoundedIcon from "@material-ui/icons/LanguageRounded";
import InstagramIcon from "@material-ui/icons/Instagram";
import FacebookIcon from "@material-ui/icons/Facebook";
import TelegramIcon from "@material-ui/icons/Telegram";
import MusicNoteRoundedIcon from "@material-ui/icons/MusicNoteRounded";
import SmsRoundedIcon from "@material-ui/icons/SmsRounded";
import MailOutlineRoundedIcon from "@material-ui/icons/MailOutlineRounded";
import CodeRoundedIcon from "@material-ui/icons/CodeRounded";

/**
 * Os canais que uma caixa de entrada pode ter.
 *
 * `pronto: false` é canal que ainda não recebe mensagem de verdade — ele
 * aparece na escolha, apagado e escrito "em breve", para a pessoa ver o que
 * vem por aí sem criar uma caixa que não funciona.
 *
 * Quem lê isto para mostrar um atendimento (filtro da lista, cartão da caixa
 * de entrada) usa só `label`, `color` e `icon`.
 */
const CHANNELS = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    color: "#25D366",
    icon: <WhatsAppIcon />,
    hint: "Atenda seus clientes no WhatsApp",
    pronto: true
  },
  {
    id: "webchat",
    label: "Site",
    color: "#6C4BD8",
    icon: <LanguageRoundedIcon />,
    hint: "A bolinha de conversa no seu site",
    pronto: true
  },
  {
    id: "instagram",
    label: "Instagram",
    color: "#E1306C",
    icon: <InstagramIcon />,
    hint: "Direct da sua conta do Instagram",
    pronto: false
  },
  {
    id: "facebook",
    label: "Facebook",
    color: "#1877F2",
    icon: <FacebookIcon />,
    hint: "Messenger da sua página",
    pronto: false
  },
  {
    id: "telegram",
    label: "Telegram",
    color: "#229ED9",
    icon: <TelegramIcon />,
    hint: "Pelo token do seu bot",
    pronto: false
  },
  {
    id: "tiktok",
    label: "TikTok",
    color: "#69C9D0",
    icon: <MusicNoteRoundedIcon />,
    hint: "Mensagens da sua conta do TikTok",
    pronto: false
  },
  {
    id: "sms",
    label: "SMS",
    color: "#F4B400",
    icon: <SmsRoundedIcon />,
    hint: "Torpedo por uma operadora",
    pronto: false
  },
  {
    id: "email",
    label: "E-mail",
    color: "#EA4335",
    icon: <MailOutlineRoundedIcon />,
    hint: "Uma caixa de e-mail vira atendimento",
    pronto: false
  },
  {
    id: "api",
    label: "API",
    color: "#5A5A66",
    icon: <CodeRoundedIcon />,
    hint: "Seu próprio canal, pela nossa API",
    pronto: false
  }
];

export const channelById = id =>
  CHANNELS.find(channel => channel.id === id) || CHANNELS[0];

export default CHANNELS;
