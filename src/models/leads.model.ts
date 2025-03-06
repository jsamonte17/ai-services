import { Column, Model, Table, BeforeUpdate } from 'sequelize-typescript';

@Table({ tableName: 'leads', paranoid: true })
export class LeadsModel extends Model<LeadsModel> {
  @Column({ primaryKey: true, autoIncrement: true })
  id: number;

  @Column({ allowNull: true })
  contactId: string;

  @Column({ allowNull: true })
  userId: string;

  @Column({ allowNull: true })
  fullName: string;

  @Column({ allowNull: true })
  email: string;

  @Column({ allowNull: true })
  contactNo: string;

  @Column({ allowNull: true })
  senderPsid: string;

  @Column({ allowNull: true })
  age:
    | '18-24'
    | '25-34'
    | '35-44'
    | '45-54'
    | '55-64'
    | '65 and above'
    | 'Did not specify'
    | null;

  @Column({ allowNull: true })
  city: string;

  @Column({
    allowNull: true,
  })
  sex:
    | 'Male'
    | 'Female'
    | 'Intersex'
    | 'Prefer not to respond'
    | 'Did not specify'
    | null;

  @Column({ allowNull: true })
  employmentSector: 'Private' | 'Public' | 'Self-Employed';

  @Column({ allowNull: true })
  source: 'facebook' | 'web-app' | 'intercom';

  @Column({ field: 'created_at', allowNull: false })
  createdAt: Date;

  @Column({ field: 'updated_at', allowNull: true })
  updatedAt: Date;

  @Column({ field: 'deleted_at', allowNull: true })
  deletedAt: Date | null;

  @BeforeUpdate
  static updateTimestamp(instance: LeadsModel) {
    instance.updatedAt = new Date();
  }
}
