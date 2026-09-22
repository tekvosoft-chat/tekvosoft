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
  DataType
} from "sequelize-typescript";
import User from "./User";

/**
 * Navegador que a pessoa já liberou com o código enviado por e-mail.
 * Guarda só o hash do identificador do navegador, nunca o valor.
 */
@Table({ tableName: "UserDevices" })
class UserDevice extends Model<UserDevice> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @Column(DataType.STRING(64))
  deviceHash: string;

  @Column(DataType.STRING(120))
  label: string;

  @Column(DataType.STRING(64))
  ip: string;

  @Column(DataType.DATE)
  lastSeenAt: Date;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default UserDevice;
