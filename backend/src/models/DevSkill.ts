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
import DevTask from "./DevTask";

/**
 * Um pedaço do que o time sabe, para os agentes do pipeline consumirem.
 *
 * source: seed (vem com o sistema), human (o super escreveu ou ensinou) ou
 * agent (o Sabichão aprendeu com as correções de uma demanda).
 * status: active (em uso), proposed (esperando o super) ou archived.
 * Proposta com replacesId é a nova versão de uma skill existente.
 */
@Table({ tableName: "DevSkills" })
class DevSkill extends Model<DevSkill> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  slug: string;

  @Column
  name: string;

  @Column
  description: string;

  @Column(DataType.TEXT)
  content: string;

  @Column
  source: string;

  @Default("active")
  @Column
  status: string;

  @ForeignKey(() => DevSkill)
  @Column
  replacesId: number;

  @ForeignKey(() => DevTask)
  @Column
  fromTaskId: number;

  @Column(DataType.TEXT)
  reason: string;

  @Default(0)
  @Column
  uses: number;

  @Column(DataType.DATE)
  lastUsedAt: Date;

  @Default(0)
  @Column(DataType.DOUBLE)
  costUsd: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => DevSkill, "replacesId")
  replaces: DevSkill;

  @BelongsTo(() => DevTask)
  fromTask: DevTask;
}

export default DevSkill;
