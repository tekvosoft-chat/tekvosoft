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
import DevTask from "./DevTask";

/**
 * Uma fala na conversa da demanda. agent: triage | priority | developer |
 * reviewer | system | human. kind diz o que é (spec, edits, review,
 * comment, error...) e meta leva o resto (modelo, tokens, veredito).
 */
@Table({ tableName: "DevTaskEvents" })
class DevTaskEvent extends Model<DevTaskEvent> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => DevTask)
  @Column
  taskId: number;

  @Column
  agent: string;

  @Column
  kind: string;

  @Default("")
  @Column(DataType.TEXT)
  content: string;

  @Default({})
  @Column(DataType.JSONB)
  meta: Record<string, unknown>;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => DevTask)
  task: DevTask;

  @BelongsTo(() => User)
  user: User;
}

export default DevTaskEvent;
