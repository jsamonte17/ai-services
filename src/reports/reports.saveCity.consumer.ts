import { CitiesModel } from '@models/cities.model';
import { CitySearchesModel } from '@models/city.searches.model';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

const logger = new Logger('SaveCityConsumer');

@Processor('queueSaveCityConsumer')
export class SaveCityConsumer extends WorkerHost {
  constructor() {
    super();
  }

  process(job: Job<any, any, string>): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        logger.log(
          `SaveCityConsumer.process job: ${job.id}: ${JSON.stringify(job.data)}`,
        );
        const { cityName, searchCity } = job.data;

        this.saveCity(cityName, searchCity);

        resolve(job.data);
      } catch (error) {
        logger.error(
          `Error in SaveCityConsumer.process: ${JSON.stringify(error, null, 2)}`,
        );
        reject(error);
      }
    });
  }

  private saveCity(cityName: string, searchCity: string) {
    return new Promise(async (resolve, reject) => {
      try {
        // save cityName and save city search from city variable
        const city = await CitiesModel.findOrCreate({
          where: {
            cityName,
          },
          defaults: {
            cityName,
          },
        }).then(([city]) => city);

        const citySearches = await CitySearchesModel.create({
          search: searchCity,
          cityId: city.get('id'),
        });
        citySearches.save();

        resolve(city);
      } catch (err) {
        logger.error(
          `Error in SaveCityConsumer.saveCity: ${JSON.stringify(err, null, 2)}`,
        );
        reject(err);
      }
    });
  }
}
