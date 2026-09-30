import * as Sentry from "@sentry/node";
import makeWASocketSingleProcess, {
  WASocket,
  DisconnectReason,
  isJidBroadcast,
  CacheStore,
  WAMessageKey,
  WAMessageContent,
  proto,
  jidNormalizedUser,
  BinaryNode
} from "libzapitu-rf";
import makeWASocketMultiThreaded from "libzapitu-rf/worker";

import { Boom } from "@hapi/boom";
// import MAIN_LOGGER from "@whiskeysockets/baileys/lib/Utils/logger";
import NodeCache from "node-cache";
import { format } from "date-fns";
import { Op } from "sequelize";
import { Agent } from "https";
import { Mutex } from "async-mutex";
import { Socket } from "socket.io-client";
import Whatsapp from "../models/Whatsapp";
import { logger, loggerBaileys } from "../utils/logger";
import authState from "../helpers/authState";
import AppError from "../errors/AppError";
import { getIO } from "./socket";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";
import { wbotMessageListener } from "../services/WbotServices/wbotMessageListener";
import wbotMonitor from "../services/WbotServices/wbotMonitor";
import DeleteBaileysService from "../services/BaileysServices/DeleteBaileysService";
import Contact from "../models/Contact";
import Ticket from "../models/Ticket";
import { GitInfo } from "../gitinfo";
import GetPublicSettingService from "../services/SettingServices/GetPublicSettingService";
import waVersion from "../waversion.json";
import Message from "../models/Message";
import OutOfTicketMessage from "../models/OutOfTicketMessages";
import BaileysKeys from "../models/BaileysKeys";
import { DecoupledDriverServices } from "../services/DecoupledDriverServices/DecoupledDriverServices";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import GetTicketWbot from "../helpers/GetTicketWbot";
import { getJidOf } from "../services/WbotServices/getJidOf";
import WhatsappLidMap from "../models/WhatsappLidMap";
import { reach } from "yup";
import crypto from "crypto";
import { GetCompanySetting } from "../helpers/CheckSettings";

// const loggerBaileys = MAIN_LOGGER.child({});
// loggerBaileys.level = process.env.BAILEYS_LOG_LEVEL || "error";

const passkeyTokens = new Map<number, string>();

export function setPasskeyToken(whatsappId: number, token: string): void {
  passkeyTokens.set(whatsappId, token);
}

export function getPasskeyToken(whatsappId: number): string | undefined {
  return passkeyTokens.get(whatsappId);
}

export function resolvePasskeyToken(token: string): number | undefined {
  for (const [id, t] of passkeyTokens.entries()) {
    if (t === token) return id;
  }
  return undefined;
}

export function createCaptureToken(whatsappId: number): string {
  const token = crypto.randomBytes(24).toString("hex");
  passkeyTokens.set(whatsappId, token);
  return token;
}

export type Session = WASocket & {
  id?: number;
  myJid?: string;
  myLid?: string;
  cacheMessage?: (msg: proto.IWebMessageInfo) => void;
  isRefreshing?: boolean;
};

const sessions: Session[] = [];
const initializingSessions = new Map<number, Promise<Session>>();
const reconnectTimers = new Map<number, ReturnType<typeof setTimeout>>();

const cancelReconnect = (id: number): void => {
  const timer = reconnectTimers.get(id);
  if (timer) clearTimeout(timer);
  reconnectTimers.delete(id);
};

const retriesQrCodeMap = new Map<number, number>();

/**
 * Quedas seguidas de cada conexão, para espaçar a volta.
 *
 * Reconectar sempre em 2 segundos parece rápido, mas quando o WhatsApp está
 * recusando (outro aparelho assumiu a sessão, limite de tentativas, instabi-
 * lidade) isso vira um ciclo que só piora — e é o que faz a conexão "viver
 * caindo". Aqui a espera cresce a cada queda seguida e zera quando conecta.
 */
const dropCountMap = new Map<number, number>();
const RECONNECT_STEPS_MS = [2000, 5000, 15000, 30000, 60000, 120000];

const reconnectDelay = (id: number, statusCode?: number): number => {
  const drops = (dropCountMap.get(id) || 0) + 1;
  dropCountMap.set(id, drops);

  // 515 é o "reinicie agora" que o próprio WhatsApp pede depois de parear:
  // não é queda, e esperar só atrasa a conexão
  if (statusCode === DisconnectReason.restartRequired) return 1000;

  // 440: outra sessão assumiu este número. Voltar correndo é brigar com ela
  // e derrubar as duas; espera bem mais antes de tentar de novo.
  if (statusCode === DisconnectReason.connectionReplaced) {
    return Math.max(60000, RECONNECT_STEPS_MS[RECONNECT_STEPS_MS.length - 1]);
  }

  return RECONNECT_STEPS_MS[Math.min(drops - 1, RECONNECT_STEPS_MS.length - 1)];
};

export const getWbot = (whatsappId: number): Session => {
  const sessionIndex = sessions.findIndex(s => s.id === whatsappId);

  if (sessionIndex === -1) {
    throw new AppError("ERR_WAPP_NOT_INITIALIZED");
  }
  return sessions[sessionIndex];
};

export const removeWbot = async (
  whatsappId: number,
  isLogout = true
): Promise<void> => {
  cancelReconnect(whatsappId);
  try {
    const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
    if (sessionIndex !== -1) {
      // Retira antes de encerrar: eventos tardios não podem reconectar este socket.
      const [session] = sessions.splice(sessionIndex, 1);
      session.ev.removeAllListeners("connection.update");
      if (isLogout) {
        await session.logout().catch(err => logger.error(err));
      }

      session.ev.removeAllListeners("creds.update");
      session.ev.removeAllListeners("presence.update");
      session.ev.removeAllListeners("groups.upsert");
      session.ev.removeAllListeners("groups.update");
      session.ev.removeAllListeners("group-participants.update");
      session.ev.removeAllListeners("contacts.upsert");
      session.ev.removeAllListeners("contacts.update");
      session.ev.removeAllListeners("messages.upsert");
      session.ev.removeAllListeners("messages.update");
      session.ev.removeAllListeners("message-receipt.update");
      session.ev.removeAllListeners("call");
      session.ev.removeAllListeners("pair.passkey.request");
      session.end(null);

      session.ws.removeAllListeners();
      await session.ws.close();
    }
  } catch (err) {
    logger.error(err);
  }
  if (isLogout) {
    await BaileysKeys.destroy({
      where: { whatsappId }
    });
  }
};

/**
 * Closes every active WhatsApp session without logging out, so credentials
 * are preserved and sessions can be resumed after a restart. Used during
 * graceful shutdown.
 */
export const closeAllSessions = async (): Promise<void> => {
  for (const id of reconnectTimers.keys()) cancelReconnect(id);
  const ids = sessions.map(s => s.id).filter((id): id is number => !!id);

  if (ids.length === 0) {
    logger.info("No active WhatsApp sessions to close.");
    return;
  }

  logger.info(`Closing ${ids.length} WhatsApp session(s)...`);
  await Promise.allSettled(ids.map(id => removeWbot(id, false)));
  logger.info("All WhatsApp sessions closed.");
};

function getGreaterVersion(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const numA = a[i] || 0;
    const numB = b[i] || 0;

    if (numA > numB) {
      return a;
    }
    if (numA < numB) {
      return b;
    }
  }

  return a;
}

const waVersionCache = new NodeCache({
  stdTTL: 60 * 60 * 24, // 24 hours
  checkperiod: 60 * 30, // 30 minutes
  useClones: false
});

const waVersionMutex = new Mutex();
const checkWbotDuplicity = new Mutex();

const getProjectWAVersion = async () => {
  try {
    const res = await fetch("https://waversion.ticke.tz");
    const version = await res.json();
    return version;
  } catch (error) {
    logger.warn("Failed to get current WA Version from project repository");
  }
  return waVersion;
};

export const initWASocket = (
  whatsapp: Whatsapp,
  proxy?: Agent,
  isRefresh = false
): Promise<Session> => {
  const pending = initializingSessions.get(whatsapp.id);
  if (pending) return pending;

  const initialization = (async () => {
    await removeWbot(whatsapp.id, false);
    return createWASocket(whatsapp, proxy, isRefresh);
  })();
  initializingSessions.set(whatsapp.id, initialization);
  initialization.then(
    () => initializingSessions.delete(whatsapp.id),
    () => initializingSessions.delete(whatsapp.id)
  );
  return initialization;
};

const createWASocket = async (
  whatsapp: Whatsapp,
  proxy?: Agent,
  isRefresh = false
): Promise<Session> => {
  return new Promise((resolve, reject) => {
    try {
      (async () => {
        const io = getIO();

        const whatsappUpdate = await Whatsapp.findOne({
          where: { id: whatsapp.id, companyId: whatsapp.companyId }
        });

        if (!whatsappUpdate) throw new AppError("ERR_NO_WAPP_FOUND");

        const { id, name, provider } = whatsappUpdate;

        function handleReachoutTimelock(
          timelock: {
            isActive?: boolean;
            timeEnforcementEnds?: Date;
            enforcementType?: string;
          },
          logData: Record<string, unknown>
        ): void {
          if (!timelock?.isActive) {
            return;
          }

          const message = `Session ${name} is temporarily restricted up to ${
            timelock.timeEnforcementEnds
              ? format(timelock.timeEnforcementEnds, "dd/MM/yyyy HH:mm:ss")
              : "unknown"
          } - ${timelock.enforcementType}.`;

          logger.warn(logData, message);
          io.to(`company-${whatsapp.companyId}-admin`)
            .to("role-connections")
            .to(`role-connections/${whatsapp.id}`)
            .emit(`error`, { message });
        }

        const autoVersion = await waVersionMutex.runExclusive(async () => {
          let wv = waVersionCache.get("waVersion");

          if (!wv) {
            wv = await getProjectWAVersion();

            if (!wv) {
              // anything will be greater
              return [2, 2300, 0];
            }

            waVersionCache.set("waVersion", wv);
          }

          return wv;
        });

        const isLegacy = provider === "stable";

        const version = getGreaterVersion(autoVersion, waVersion);

        logger.info(`using WA v${version.join(".")}`);
        logger.info(`isLegacy: ${isLegacy}`);
        logger.info(`Starting session ${name}`);
        let retriesQrCode = 0;

        let wsocket: Session = null;
        const store = new NodeCache({
          stdTTL: 120,
          checkperiod: 30,
          useClones: false
        });

        async function getMessage(
          key: WAMessageKey
        ): Promise<WAMessageContent> {
          if (!key.id) return null;

          const message = store.get(key.id);

          if (message) {
            logger.debug({ message }, "cacheMessage: recovered from cache");
            return message;
          }

          logger.debug(
            { key },
            "cacheMessage: not found in cache - fallback to database"
          );

          let msg: Message | OutOfTicketMessage;

          msg = await Message.findOne({
            where: { id: key.id, fromMe: true, companyId: whatsapp.companyId }
          });

          if (!msg) {
            msg = await OutOfTicketMessage.findOne({
              where: { id: key.id, companyId: whatsapp.companyId }
            });
          }

          if (!msg) {
            logger.debug({ key }, "cacheMessage: not found in database");
            return undefined;
          }

          try {
            const data = JSON.parse(msg.dataJson);
            logger.debug(
              { key, data },
              "cacheMessage: recovered from database"
            );
            store.set(key.id, data.message);
            return data.message || undefined;
          } catch (error) {
            logger.error(
              { key },
              `cacheMessage: error parsing message from database - ${error.message}`
            );
          }

          return undefined;
        }

        const { state, saveState } = await authState(whatsapp);

        const msgRetryCounterCache = new NodeCache();
        const internalGroupCache = new NodeCache({
          stdTTL: 5 * 60,
          useClones: false
        });
        const groupCache: CacheStore = {
          get: <T>(key: string): T => {
            logger.debug(`groupCache.get ${key}`);
            const value = internalGroupCache.get(key);
            if (!value) {
              logger.debug(`groupCache.get ${key} not found`);
              wsocket.groupMetadata(key).then(async metadata => {
                logger.debug({ key, metadata }, `groupCache.get ${key} set`);
                internalGroupCache.set(key, metadata);
              });
            }
            return value as T;
          },
          set: async (key: string, value: any) => {
            logger.debug({ key, value }, `groupCache.set ${key}`);
            return internalGroupCache.set(key, value);
          },
          del: async (key: string) => {
            logger.debug(`groupCache.del ${key}`);
            return internalGroupCache.del(key);
          },
          flushAll: async () => {
            logger.debug("groupCache.flushAll");
            return internalGroupCache.flushAll();
          }
        };

        const appName =
          (await GetPublicSettingService({ key: "appName" })) || "vuup.me";
        const hostName = process.env.BACKEND_URL?.split("/")[2];
        const appVersion = GitInfo.tagName || GitInfo.commitHash;
        const clientName = `${appName} ${appVersion}${
          hostName ? ` - ${hostName}` : ""
        }`;

        let makeWASocket: typeof makeWASocketSingleProcess;
        if (
          (await GetCompanySetting(1, "useMultiThreadedWbot", "disabled")) ===
          "enabled"
        ) {
          makeWASocket = makeWASocketMultiThreaded;
        } else {
          makeWASocket = makeWASocketSingleProcess;
        }

        wsocket = makeWASocket({
          logger: loggerBaileys,
          printQRInTerminal: false,
          // Cópias de conversas iniciadas no WhatsApp oficial também precisam
          // chegar ao messages.upsert, mesmo quando não há ticket aberto.
          emitOwnEvents: true,
          markOnlineOnConnect: false,
          browser: [clientName, "Desktop", appVersion],
          auth: {
            creds: state.creds,
            keys: state.keys
          },
          version,
          defaultQueryTimeoutMs: 60000,
          // retryRequestDelayMs: 250,
          // keepAliveIntervalMs: 1000 * 60 * 10 * 3,
          msgRetryCounterCache,
          // syncFullHistory: true,
          generateHighQualityLinkPreview: true,
          getMessage,
          agent: proxy,
          fetchAgent: proxy,
          cachedGroupMetadata: async jid => groupCache.get(jid),
          shouldIgnoreJid: jid =>
            isJidBroadcast(jid) || jid?.endsWith("@newsletter"),
          transactionOpts: { maxCommitRetries: 1, delayBetweenTriesMs: 10 }
        });

        // A sessão precisa existir antes do primeiro open/close e dos upserts.
        wsocket.id = id;
        sessions.push(wsocket);
        wbotMessageListener(wsocket, whatsapp.companyId);
        wbotMonitor(wsocket, whatsapp, whatsapp.companyId);
        let connectionClosed = false;

        wsocket.ev.on("call", async event => {
          logger.trace({ event }, "Received call event");
        });

        wsocket.ws.on("CB:call", async (node: BinaryNode) => {
          logger.trace({ node }, "Received raw call node");
        });

        wsocket.isRefreshing = isRefresh;

        wsocket.cacheMessage = (msg: proto.IWebMessageInfo): void => {
          if (!msg.key.fromMe) return;

          logger.debug({ message: msg.message }, "cacheMessage: saved");

          store.set(msg.key.id, msg.message);
        };

        wsocket.ev.on(
          "connection.update",
          async ({ connection, lastDisconnect, qr, reachoutTimeLock }) => {
            if (connectionClosed || !sessions.includes(wsocket)) return;
            if (reachoutTimeLock) {
              handleReachoutTimelock(reachoutTimeLock, { reachoutTimeLock });
            }

            logger.info(
              { lastDisconnect },
              `Socket  ${name} Connection Update ${connection || ""}`
            );

            if (connection === "close") {
              connectionClosed = true;
              const statusCode = (lastDisconnect?.error as Boom)?.output
                ?.statusCode;
              if (statusCode === 403 || statusCode === DisconnectReason.loggedOut) {
                // Credenciais revogadas exigem um novo pareamento, não reconexão.
                await removeWbot(id);
                await whatsapp.update({
                  status: "DISCONNECTED",
                  session: "",
                  qrcode: ""
                });
                await DeleteBaileysService(whatsapp.id);
                io.to(`company-${whatsapp.companyId}-admin`).emit(
                  `company-${whatsapp.companyId}-whatsappSession`,
                  {
                    action: "update",
                    session: whatsapp
                  }
                );
              } else {
                // Queda recuperável mantém as credenciais e agenda uma única volta.
                await whatsapp.update({ status: "PENDING" });
                io.to(`company-${whatsapp.companyId}-admin`).emit(
                  `company-${whatsapp.companyId}-whatsappSession`,
                  {
                    action: "update",
                    session: whatsapp
                  }
                );
                if (!sessions.includes(wsocket)) return;
                const delay = reconnectDelay(id, statusCode);
                await removeWbot(id, false).then(() => {
                  logger.info(
                    {
                      whatsappId: id,
                      statusCode,
                      quedasSeguidas: dropCountMap.get(id),
                      emSegundos: delay / 1000
                    },
                    `Reconnecting ${name}`
                  );
                  if (sessions.some(session => session.id === id)) return;
                  const schedule = (wait: number): void => {
                    const timer = setTimeout(async () => {
                    if (reconnectTimers.get(id) !== timer) return;
                    reconnectTimers.delete(id);
                    try {
                        await whatsapp.reload();
                        if (whatsapp.status === "DISCONNECTED") return;
                        await StartWhatsAppSession(whatsapp, whatsapp.companyId, true);
                      } catch (error) {
                        Sentry.captureException(error);
                        logger.error({ error, whatsappId: id }, "WhatsApp: reconnect failed");
                      }
                      // A inicialização registra a falha sem lançar; sem socket,
                      // mantém a tentativa automática com espera progressiva.
                      if (!sessions.some(session => session.id === id) &&
                          whatsapp.status !== "DISCONNECTED") {
                        schedule(reconnectDelay(id));
                      }
                    }, wait);
                    reconnectTimers.set(id, timer);
                  };
                  schedule(delay);
                });
              }
              return;
            }



            if (connection === "open") {
              wsocket.fetchAccountReachoutTimelock().then(timelock => {
                handleReachoutTimelock(timelock, { timelock });
              }).catch(error => logger.warn({ error }, "WhatsApp: reachout timelock failed"));

              wsocket.fetchNewChatMessageCap().then(cap => {
                logger.info({ cap }, "Fetched new chat message cap");
              }).catch(error => logger.warn({ error }, "WhatsApp: chat cap failed"));

              await whatsapp.reload({
                include: ["wavoip"]
              });
              if (connectionClosed || !sessions.includes(wsocket)) return;

              wsocket.myLid = jidNormalizedUser(wsocket.user?.lid);
              wsocket.myJid = jidNormalizedUser(wsocket.user.id);

              await whatsapp.update({
                status: "CONNECTED",
                qrcode: "",
                retries: 0
              });
              dropCountMap.delete(id);

              logger.debug(
                {
                  id: jidNormalizedUser(wsocket.user.id),
                  name: wsocket.user.name,
                  lid: jidNormalizedUser(wsocket.user?.lid),
                  notify: wsocket.user?.notify,
                  verifiedName: wsocket.user?.verifiedName,
                  imgUrl: wsocket.user?.imgUrl,
                  status: wsocket.user?.status
                },
                `Session ${name} details`
              );

              io.to(`company-${whatsapp.companyId}-admin`).emit(
                `company-${whatsapp.companyId}-whatsappSession`,
                {
                  action: "update",
                  session: whatsapp
                }
              );

              await checkWbotDuplicity.runExclusive(async () => {
                const sessionIndex = sessions.findIndex(
                  s => s.id === whatsapp.id
                );
                if (sessionIndex === -1) {
                  wsocket.id = whatsapp.id;
                  sessions.push(wsocket);
                }

                const anotherSameJid =
                  !!wsocket.myJid &&
                  sessions.find(
                    s => s.id !== whatsapp.id && s.myJid === wsocket.myJid
                  );

                if (anotherSameJid) {
                  logger.warn(
                    {
                      id: anotherSameJid.id,
                      jid: anotherSameJid.myJid
                    },
                    "Another session with the same jid/lid detected"
                  );
                  const duplicatedWbot = getWbot(anotherSameJid.id);
                  duplicatedWbot.logout();
                  duplicatedWbot.ws.close();
                }
              });

              if (wsocket.isRefreshing) {
                setTimeout(() => {
                  if (!sessions.includes(wsocket)) return;
                  wsocket
                    .resyncAppState(
                      [
                        "critical_block",
                        "critical_unblock_low",
                        "regular_high",
                        "regular_low",
                        "regular"
                      ],
                      true
                    )
                    .catch(error => {
                      logger.error(
                        { message: error.message },
                        `Error resyncing app state for session ${name}`
                      );
                    });
                }, 5000);
                wsocket.isRefreshing = false;
              }
            }

            if (qr !== undefined) {
              if (retriesQrCodeMap.get(id) && retriesQrCodeMap.get(id) >= 3) {
                await whatsappUpdate.update({
                  status: "DISCONNECTED",
                  qrcode: ""
                });
                await DeleteBaileysService(whatsappUpdate.id);
                io.emit("whatsappSession", {
                  action: "update",
                  session: whatsappUpdate
                });
                await removeWbot(id, false);
                retriesQrCodeMap.delete(id);
              } else {
                logger.info(`Session QRCode Generate ${name}`);
                retriesQrCodeMap.set(id, (retriesQrCode += 1));

                await whatsapp.update({
                  qrcode: qr,
                  status: "qrcode",
                  retries: 0
                });
                const sessionIndex = sessions.findIndex(
                  s => s.id === whatsapp.id
                );

                if (sessionIndex === -1) {
                  wsocket.id = whatsapp.id;
                  sessions.push(wsocket);
                }

                io.to(`company-${whatsapp.companyId}-admin`).emit(
                  `company-${whatsapp.companyId}-whatsappSession`,
                  {
                    action: "update",
                    session: whatsapp
                  }
                );
              }
            }
          }
        );
        wsocket.ev.on("creds.update", saveState);

        wsocket.ev.on("pair.passkey.request", async () => {
          logger.info(`Session ${name} requires passkey authentication`);
          const token = createCaptureToken(whatsapp.id);

          await whatsapp.update({
            status: "passkey_required",
            qrcode: token,
            retries: 0
          });

          io.to(`company-${whatsapp.companyId}-admin`).emit(
            `company-${whatsapp.companyId}-whatsappSession`,
            {
              action: "update",
              session: whatsapp
            }
          );

          // Close the socket so the ongoing QR-code loop does not overwrite the
          // capture token that is now stored in the qrcode field. The capture
          // endpoint will restart the session once the extension posts the dump.
          await removeWbot(id, false);
        });

        wsocket.ev.on(
          "presence.update",
          async ({ id: remoteJid, presences }) => {
            try {
              logger.debug(
                { remoteJid, presences },
                "Received contact presence"
              );
              if (!presences[remoteJid]?.lastKnownPresence) {
                // ignore presence from groups
                return;
              }

              let contact = await Contact.findOne({
                where: {
                  number: remoteJid.endsWith("@lid")
                    ? remoteJid
                    : remoteJid.replace(/\D/g, ""),
                  companyId: whatsapp.companyId
                }
              });

              if (!contact && remoteJid.endsWith("@lid")) {
                const lidMap = await WhatsappLidMap.findOne({
                  where: {
                    lid: remoteJid,
                    companyId: whatsapp.companyId
                  },
                  include: [Contact]
                });
                contact = lidMap?.contact;
              }

              if (!contact) {
                return;
              }
              const ticket = await Ticket.findOne({
                where: {
                  contactId: contact.id,
                  whatsappId: whatsapp.id,
                  companyId: whatsapp.companyId,
                  status: {
                    [Op.or]: ["open", "pending"]
                  }
                }
              });

              if (ticket) {
                io.to(ticket.id.toString())
                  .to(`company-${whatsapp.companyId}-${ticket.status}`)
                  .to(`queue-${ticket.queueId}-${ticket.status}`)
                  .emit(`company-${whatsapp.companyId}-presence`, {
                    ticketId: ticket.id,
                    presence: presences[remoteJid].lastKnownPresence
                  });
              }
            } catch (error) {
              logger.error(
                { remoteJid, presences },
                "presence.update: error processing"
              );
              if (error instanceof Error) {
                logger.error(`Error: ${error.name} ${error.message}`);
              } else {
                logger.error(`Error was object of type: ${typeof error}`);
              }
            }
          }
        );

        wsocket.ev.on("groups.upsert", groups => {
          logger.debug("Received new group");
          groups.forEach(group => {
            groupCache.set(group.id, group);
          });
        });

        wsocket.ev.on("groups.update", async ([event]) => {
          logger.debug("Received group update");
          const metadata = await wsocket.groupMetadata(event.id);
          groupCache.set(event.id, metadata);
        });

        wsocket.ev.on("group-participants.update", async event => {
          logger.debug("Received group participants update");
          try {
            const metadata = await wsocket.groupMetadata(event.id);
            groupCache.set(event.id, metadata);
          } catch (error) {
            groupCache.del(event.id);
          }
        });
        // Não espera o open: os listeners já estão prontos para o primeiro lote.
        resolve(wsocket);
      })().catch(error => {
        Sentry.captureException(error);
        logger.error(error);
        reject(error);
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error(error);
      reject(error);
    }
  });
};

const decoupledDriverServices = DecoupledDriverServices.getInstance();

decoupledDriverServices.registerFunction(
  "presenceUpdate",
  async (user, parameters) => {
    const { ticketId, presence } = parameters;
    const ticket = await ShowTicketService(ticketId);
    if (!ticket || ticket.companyId !== user.companyId) {
      return;
    }

    const wbot = await GetTicketWbot(ticket);
    if (!wbot) {
      return;
    }

    const jid = getJidOf(ticket);

    if (jid.endsWith("@lid")) {
      return;
    }

    wbot.sendPresenceUpdate(presence, jid).catch(err => {
      logger.error(
        {
          message: err.message,
          jid,
          presence,
          ticketId: ticket.id,
          companyId: ticket.companyId,
          connection: ticket.whatsapp?.name
        },
        "Error sending presence update"
      );
    });
  }
);
