import {
  Table,
  Column,
  CreatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  BelongsTo,
  ForeignKey,
  DataType,
  Default
} from "sequelize-typescript";
import Ticket from "./Ticket";
import Company from "./Company";
import User from "./User";

/** Um passo do atendimento: fila, coluna do Kanban, responsável ou situação. */
@Table({ tableName: "TicketJourneys", updatedAt: false })
class TicketJourney extends Model<TicketJourney> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Ticket)
  @Column
  ticketId: number;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @Column(DataType.STRING(12))
  kind: string;

  @Column(DataType.STRING(120))
  fromValue: string;

  @Column(DataType.STRING(120))
  toValue: string;

  @Default(false)
  @Column
  byAi: boolean;

  @CreatedAt
  createdAt: Date;
}

export default TicketJourney;
