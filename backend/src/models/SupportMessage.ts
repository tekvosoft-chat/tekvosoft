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
  DataType,
  Default
} from "sequelize-typescript";
import User from "./User";
import SupportTicket from "./SupportTicket";

export interface SupportAttachment {
  id: string;
  name: string;
  mimetype: string;
  size: number;
  // caminho dentro da pasta privada: nunca vai para o navegador
  path?: string;
}

@Table({ tableName: "SupportMessages" })
class SupportMessage extends Model<SupportMessage> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => SupportTicket)
  @Column
  ticketId: number;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @Default(false)
  @Column
  fromSupport: boolean;

  @Default("message")
  @Column
  kind: string;

  @Default("")
  @Column(DataType.TEXT)
  body: string;

  @Default([])
  @Column(DataType.JSONB)
  attachments: SupportAttachment[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => SupportTicket)
  ticket: SupportTicket;

  @BelongsTo(() => User)
  user: User;
}

export default SupportMessage;
