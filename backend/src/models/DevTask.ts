import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  BelongsTo,
  ForeignKey,
  HasMany,
  DataType,
  Default
} from "sequelize-typescript";
import Company from "./Company";
import User from "./User";
import SupportTicket from "./SupportTicket";
import DevTaskEvent from "./DevTaskEvent";

/** Arquivo alterado pela IA: o conteúdo final, por cima do commit base. */
export interface DevChange {
  path: string;
  op: "create" | "edit" | "delete";
  content: string;
}

/** Pedido de ajuste que o próximo agente precisa atender. */
export interface DevFeedback {
  from: "reviewer" | "human";
  text: string;
  path?: string;
  severity?: string;
}

/** Imagem anexada à demanda (print, rascunho de tela): a IA enxerga. */
export interface DevAttachment {
  id: string;
  name: string;
  mimetype: string;
  size: number;
  // caminho dentro da pasta privada do pipeline: nunca vai para o navegador
  path?: string;
  eventId?: number;
}

/** Problema achado pela verificação automática (sintaxe), sem IA. */
export interface DevCheck {
  path: string;
  message: string;
}

@Table({ tableName: "DevTasks" })
class DevTask extends Model<DevTask> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  title: string;

  @Default("")
  @Column(DataType.TEXT)
  description: string;

  // "admin" (o super abriu) ou "help" (cliente, pela Ajuda)
  @Column
  source: string;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @ForeignKey(() => User)
  @Column
  requesterId: number;

  @ForeignKey(() => SupportTicket)
  @Column
  supportTicketId: number;

  // intake | prioritization | development | review | pr | done | cancelled
  @Default("intake")
  @Column
  stage: string;

  // queued | running | waiting | error | idle
  @Default("waiting")
  @Column
  status: string;

  // urgent | high | normal | low
  @Default("normal")
  @Column
  priority: string;

  @Column(DataType.TEXT)
  priorityReason: string;

  @Column
  kind: string;

  @Column
  effort: string;

  @Column
  risk: string;

  @Column(DataType.TEXT)
  spec: string;

  @Default([])
  @Column(DataType.JSONB)
  acceptance: string[];

  @Default([])
  @Column(DataType.JSONB)
  files: string[];

  @Default([])
  @Column(DataType.JSONB)
  questions: string[];

  @Default([])
  @Column(DataType.JSONB)
  feedback: DevFeedback[];

  @Column
  baseSha: string;

  @Default([])
  @Column(DataType.JSONB)
  changes: DevChange[];

  @Column(DataType.TEXT)
  diff: string;

  @Default([])
  @Column(DataType.JSONB)
  checks: DevCheck[];

  @Default(0)
  @Column
  reviewRound: number;

  @Column
  verdict: string;

  @Column
  branch: string;

  @Column
  prUrl: string;

  @Column
  prNumber: number;

  @Column(DataType.TEXT)
  error: string;

  @Default(0)
  @Column
  tokensIn: number;

  @Default(0)
  @Column
  tokensOut: number;

  @Default(0)
  @Column
  tokensCached: number;

  // custo estimado em dólar (a tela mostra em reais)
  @Default(0)
  @Column(DataType.DOUBLE)
  costUsd: number;

  // mexe em interface: os agentes seguem as regras de design
  @Default(false)
  @Column
  design: boolean;

  // skills que a triagem escolheu para esta demanda
  @Default([])
  @Column(DataType.JSONB)
  skills: string[];

  @Default([])
  @Column(DataType.JSONB)
  attachments: DevAttachment[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => Company)
  company: Company;

  @BelongsTo(() => User, "requesterId")
  requester: User;

  @BelongsTo(() => SupportTicket)
  supportTicket: SupportTicket;

  @HasMany(() => DevTaskEvent)
  events: DevTaskEvent[];
}

export default DevTask;
