import { Column, Model, Table, BeforeUpdate } from 'sequelize-typescript';

@Table({ tableName: 'conversations', paranoid: true })
export class ConversationsModel extends Model<ConversationsModel> {
  @Column({ primaryKey: true, autoIncrement: true })
  id: number;

  @Column({ allowNull: true })
  contactId: string;

  @Column({ allowNull: true })
  recipientPageId: string;

  @Column({ allowNull: true })
  senderPsid: string;

  @Column({ allowNull: true })
  threadId: string;

  @Column({ allowNull: true })
  conversationId: string;

  @Column({ allowNull: true })
  assignedTo: string;

  @Column({ allowNull: false, defaultValue: 'Open' })
  status: 'Open' | 'Closed' | 'Snoozed';

  @Column({ field: 'created_at', allowNull: false })
  createdAt: Date;

  @Column({ field: 'updated_at', allowNull: true })
  updatedAt: Date;

  @Column({ field: 'deleted_at', allowNull: true })
  deletedAt: Date | null;

  @BeforeUpdate
  static updateTimestamp(instance: ConversationsModel) {
    instance.updatedAt = new Date();
  }
}
