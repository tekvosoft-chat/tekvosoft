import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  AutoIncrement,
  DataType,
  Default
} from "sequelize-typescript";

import Company from "./Company";
import User from "./User";

@Table
class PushSubscription extends Model<PushSubscription> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @Column(DataType.TEXT)
  endpoint: string;

  @Column
  p256dh: string;

  @Column
  auth: string;

  @Default(false)
  @Column
  silent: boolean;

  @Column
  userAgent: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default PushSubscription;
