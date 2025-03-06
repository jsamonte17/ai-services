import {
  Column,
  Model,
  Table,
  HasMany,
  DataType,
  BeforeUpdate,
} from 'sequelize-typescript';
import { CitySearchesModel } from './city.searches.model';

@Table({ tableName: 'cities', paranoid: true })
export class CitiesModel extends Model<CitiesModel> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id: number;

  @Column({ allowNull: false })
  cityName: string;

  @HasMany(() => CitySearchesModel)
  citySearches: CitySearchesModel[];

  @BeforeUpdate
  static updateTimestamp(instance: CitiesModel) {
    instance.updatedAt = new Date();
  }
}
