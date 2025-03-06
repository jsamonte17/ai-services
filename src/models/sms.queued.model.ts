import { Column, Model, Table, BeforeUpdate } from 'sequelize-typescript';

@Table({ tableName: 'sms_queues', paranoid: true })
export class SmsQueuedModel extends Model<SmsQueuedModel> {
  @Column({ primaryKey: true, autoIncrement: true })
  id: number;

  @Column({ allowNull: false })
  uuid: string;

  @Column({ allowNull: false })
  jobId: string;

  @Column({ allowNull: true })
  queueName: string;

  @Column({ allowNull: true })
  message: string;

  @Column({ type: 'json', allowNull: true })
  docs: any;

  @Column({ allowNull: false, defaultValue: 'Pending' })
  status: 'Pending' | 'Inprogress' | 'Completed';

  @Column({ field: 'created_at', allowNull: false })
  createdAt: Date;

  @Column({ field: 'updated_at', allowNull: true })
  updatedAt: Date;

  @Column({ field: 'deleted_at', allowNull: true })
  deletedAt: Date | null;

  @BeforeUpdate
  static updateTimestamp(instance: SmsQueuedModel) {
    instance.updatedAt = new Date();
  }
}
