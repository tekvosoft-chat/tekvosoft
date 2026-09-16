import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Unique,
  Default
} from "sequelize-typescript";

@Table
class Plan extends Model<Plan> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @Unique
  @Column
  name: string;

  @Column
  users: number;

  @Column
  connections: number;

  @Column
  queues: number;

  @Column
  value: number;

  @Column
  currency: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @Default(true)
  @Column
  isPublic: boolean;

  // recursos incluídos no plano
  @Default(true)
  @Column
  useKanban: boolean;

  @Default(true)
  @Column
  useInternalChat: boolean;

  @Default(true)
  @Column
  useSchedules: boolean;

  @Default(true)
  @Column
  useCampaigns: boolean;

  @Default(true)
  @Column
  useExternalApi: boolean;
}

export default Plan;
