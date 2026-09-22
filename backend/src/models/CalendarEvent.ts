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
import Company from "./Company";
import User from "./User";
import Chat from "./Chat";
import Contact from "./Contact";

/** Evento da agenda: evento, ligação do chat interno ou lembrete. */
@Table({ tableName: "CalendarEvents" })
class CalendarEvent extends Model<CalendarEvent> {
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

  @BelongsTo(() => User)
  user: User;

  @Default("event")
  @Column(DataType.STRING(20))
  type: string;

  @Column(DataType.STRING(200))
  title: string;

  @Column(DataType.TEXT)
  description: string;

  @Column(DataType.DATE)
  startAt: Date;

  @Column(DataType.DATE)
  endAt: Date;

  @Default(false)
  @Column
  allDay: boolean;

  @Column(DataType.STRING(9))
  color: string;

  @ForeignKey(() => Chat)
  @Column
  chatId: number;

  @BelongsTo(() => Chat)
  chat: Chat;

  @ForeignKey(() => Contact)
  @Column
  contactId: number;

  @BelongsTo(() => Contact)
  contact: Contact;

  @Default([])
  @Column(DataType.JSONB)
  participantIds: number[];

  @Column
  remindMinutes: number;

  @Column(DataType.DATE)
  remindedAt: Date;

  @Column(DataType.STRING(255))
  externalId: string;

  @Column(DataType.STRING(20))
  externalSource: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default CalendarEvent;
