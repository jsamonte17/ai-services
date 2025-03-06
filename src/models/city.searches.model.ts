import {
  Column,
  Model,
  Table,
  DataType,
  BeforeUpdate,
  ForeignKey,
} from 'sequelize-typescript';
import { CitiesModel } from './cities.model';

@Table({ tableName: 'city_searches', paranoid: true })
export class CitySearchesModel extends Model<CitySearchesModel> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  @ForeignKey(() => CitiesModel)
  cityId: number;

  @Column({ allowNull: false })
  search: string;

  @BeforeUpdate
  static updateTimestamp(instance: CitySearchesModel) {
    instance.updatedAt = new Date();
  }
}
