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
import SupportMessage from "./SupportMessage";

@Table({ tableName: "SupportTickets" })
class SupportTicket extends Model<SupportTicket> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @Column
  subject: string;

  @Default("question")
  @Column
  category: string;

  @Default("normal")
  @Column
  priority: string;

  @Default("open")
  @Column
  status: string;

  @Default(true)
  @Column
  unreadBySupport: boolean;

  @Default(false)
  @Column
  unreadByClient: boolean;

  @Column(DataType.DATE)
  lastMessageAt: Date;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => Company)
  company: Company;

  @BelongsTo(() => User)
  user: User;

  @HasMany(() => SupportMessage)
  messages: SupportMessage[];
}

export default SupportTicket;
