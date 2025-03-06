import {
  Column,
  Model,
  Table,
  BeforeUpdate,
  DataType,
} from 'sequelize-typescript';

@Table({ tableName: 'files', paranoid: true })
export class FilesModel extends Model<FilesModel> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id: number;

  @Column({
    type: DataType.ENUM('INTERNAL', 'OPENAI'),
    allowNull: false,
    defaultValue: 'OPENAI',
  })
  category: 'INTERNAL' | 'OPENAI';

  @Column({ allowNull: false })
  type: string;

  @Column({ allowNull: false })
  name: string;

  @Column({ type: DataType.FLOAT, allowNull: false })
  size: number;

  @Column({ allowNull: true })
  path: string;

  @Column({ type: DataType.JSON, allowNull: true })
  document: any;

  @Column({ field: 'created_at', allowNull: false })
  createdAt: Date;

  @Column({ field: 'updated_at', allowNull: true })
  updatedAt: Date;

  @Column({ field: 'deleted_at', allowNull: true })
  deletedAt: Date | null;

  @BeforeUpdate
  static updateTimestamp(instance: FilesModel) {
    instance.updatedAt = new Date();
  }
}
