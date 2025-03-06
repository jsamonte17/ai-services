import { Inject, Injectable, Logger } from '@nestjs/common';
import { ReportsDTO } from './dto/reports.dto';
import { LeadsModel } from '@models/leads.model';
import { Op } from 'sequelize';
import * as _ from 'lodash';
import { OpenaiExtractionService } from '@modules/openai/openai.extraction.service';
import * as Promise from 'bluebird';
import { IntercomConversationsService } from '@modules/intercom/intercom.conversations.service';
import { GetReportsInterface } from './interface/reports.interface';
import { SearchConversationInterface } from '@modules/intercom/interface/search.conversations.interface';
import { CitySearchesModel } from '@models/city.searches.model';
import { CitiesModel } from '@models/cities.model';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

const logger = new Logger('ReportsService');

@Injectable()
export class ReportsService {
  public reports: ReportsDTO;
  public leads: LeadsModel[];
  public pages: any;
  public ratings: any[];

  constructor(
    private readonly openaiExtractionService: OpenaiExtractionService,
    private readonly intercomConversationsService: IntercomConversationsService,
    @InjectQueue('queueSaveCityConsumer')
    private readonly queueSaveCityConsumer: Queue,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.reports = new ReportsDTO();
  }

  // a. No. of Clients Served
  // b. Sex
  // c. Age Range
  // d. Place of Residence/Dwelling Place at the time of receipt of the query/ies
  // e. Type of Employment (private/public/informal worker, others)
  // f. Tally of Satisfaction Rate with Percentage
  totalsReportService(post: GetReportsInterface): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.getClientsServed(post);
        await this.getSex();
        await this.getCitys();
        await this.getEmploymentSectors();
        await this.getAgeRange();
        this.computeRatings(); // TODO: computeRatings

        resolve(this.reports);
      } catch (error) {
        logger.error(
          `Error in totalsReportService: ${JSON.stringify(error, null, 2)}`,
        );
        reject(error);
      }
    });
  }

  private getClientsServed(payload: GetReportsInterface): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const { startDate: start, endDate: end } = payload;
        this.reports.clientsServed = 0;

        // check result from cache
        const key = `${start}-${end}-${payload.perPage}-${payload.page}`;
        const ttl = 10 * 60 * 1000;
        const leadsKey = `${key}-leads`;
        const cacheLeads = (await this.cacheManager.get(
          leadsKey,
        )) as LeadsModel[];
        const reportsKey = `${key}-reports`;
        const cacheReports = await this.cacheManager.get(reportsKey);
        const conversationsKey = `${key}-conversations`;
        const cacheConversations =
          await this.cacheManager.get(conversationsKey);
        // console.log({ cacheLeads, cacheReports, cacheConversations });
        if (cacheLeads && cacheReports && cacheConversations) {
          logger.log(`from cache: ${key}`);

          this.reports.clientsServed = cacheLeads.length;
          this.leads = cacheLeads;
          this.reports = cacheReports;
          return resolve(cacheReports);
        }

        const startDate = new Date(start);
        const endDate = new Date(end);

        const searchPayload: SearchConversationInterface = {
          ...payload,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
        };

        const interConversations =
          await this.intercomConversationsService.searchConversationsService(
            searchPayload,
          );

        const conversations: any[] = interConversations.conversations;

        await this.cacheManager.set(conversationsKey, conversations, ttl);

        const contactIds = _.map(conversations, (conversation) => {
          const contacts = conversation.contacts.contacts;
          const contactId = contacts[0]?.id;
          const ratings = conversation.conversation_rating;
          const currentRatings = this.ratings || [];
          this.ratings = currentRatings.concat(ratings?.rating || 'Undefined');

          return contactId;
        });

        if (interConversations?.pages) {
          this.pages = interConversations.pages;
        }

        await LeadsModel.findAll({
          where: {
            contactId: {
              [Op.in]: contactIds,
            },
          },
        }).then(async (leads) => {
          const leadsJson = leads.map((lead) => {
            return lead.toJSON();
          });

          this.leads = leads;
          await this.cacheManager.set(leadsKey, leads, ttl);

          this.reports.clientsServed = leadsJson.length;

          return leadsJson;
        });

        await this.cacheManager.set(reportsKey, this.reports, ttl);

        resolve(this.reports);
      } catch (error) {
        reject(error);
      }
    });
  }

  private getSex() {
    const leads = this.leads.map((lead) => {
      const parsed = lead.toJSON();

      return { ...parsed };
    });

    const sex = _.uniqBy(leads, 'sex').map((lead) => ({
      name: lead.sex === null ? 'Unspecified' : lead.sex,
      counts: _.filter(leads, (l) => l.sex === lead.sex).length,
    }));

    this.reports.sex = sex;

    return sex;
  }

  private async getCitys() {
    const leads = this.leads.map((lead) => {
      const parsed = lead.toJSON();

      return { ...parsed };
    });

    const parsedCities = await Promise.map(leads, async (lead) => {
      const searchCity = lead.city === null ? 'Unspecified' : lead.city;

      if (searchCity === 'Unspecified') {
        return { city: 'Unspecified' };
      }

      // Find city in city_searches, and return Cities name
      const citySearch = await CitySearchesModel.findOne({
        where: {
          search: {
            [Op.like]: `%${searchCity}%`,
          },
        },
      });

      if (citySearch) {
        const city = await CitiesModel.findOne({
          where: {
            id: citySearch.get('cityId'),
          },
        });
        return { city: city.get('cityName') };
      }

      const cityName =
        await this.openaiExtractionService.openAiExtractCitys(searchCity);

      if (cityName === 'Unspecified') {
        return { city: 'Unspecified' };
      }

      logger.log(`queueSaveCityConsumer cityName: ${cityName}`);
      this.queueSaveCityConsumer.add('queueSaveCityConsumer', {
        cityName,
        searchCity,
      });

      return { city: cityName };
    });

    const cities = _.uniqBy(parsedCities, 'city');
    const cityCounts = _.countBy(parsedCities.map((city) => city.city));
    this.reports.city = cities.map((city) => ({
      name: city.city,
      counts: cityCounts[city.city],
    }));

    return this.reports;
  }

  private getEmploymentSectors() {
    const leads = this.leads.map((lead) => {
      const parsed = lead.toJSON();

      return { ...parsed };
    });

    const sectors = _.uniqBy(leads, 'employmentSector');
    this.reports.employmentSector = sectors.map((sector) => ({
      name:
        sector.employmentSector === null
          ? 'Unspecified'
          : sector.employmentSector,
      counts: _.filter(
        leads,
        (lead) => lead.employmentSector === sector.employmentSector,
      ).length,
    }));

    return this.reports;
  }

  private getAgeRange() {
    const leads = this.leads.map((lead) => {
      const parsed = lead.toJSON();

      return { ...parsed };
    });

    const ageRanges = _.uniqBy(leads, 'age');
    this.reports.age = ageRanges.map((age) => ({
      name: age.age === null ? 'Unspecified' : age.age,
      counts: _.filter(leads, (lead) => lead.age === age.age).length,
    }));

    return this.reports;
  }

  private computeRatings() {
    // compute ratings[]
    const ratings = _.countBy(this.ratings);
    const ratingsArray = Object.keys(ratings).map((key) => ({
      name: key,
      counts: ratings[key],
    }));

    // count unrated conversations
    const unratedConversations = ratingsArray.find(
      (rating) => rating.name === 'Undefined',
    );

    // get the average rating from ratingss with value
    // remove undefined
    const ratingsWithoutUndefined = ratingsArray.filter(
      (rating) => rating.name !== 'Undefined',
    );

    const totalRatings = ratingsWithoutUndefined.reduce(
      (a, b) => a + b.counts,
      0,
    );
    const averageRating =
      ratingsWithoutUndefined.reduce((a, b: any) => a + b.counts * b.name, 0) /
      totalRatings;

    const satisfactionRate = (averageRating / 5) * 100;

    this.reports.satisfactionRate = [
      {
        name: 'Rated Conversations',
        counts: totalRatings,
        averageRating: averageRating.toFixed(2),
        satisfactionRate: satisfactionRate.toFixed(2) + '%',
      },
      {
        name: 'Unrated Conversations',
        counts: unratedConversations.counts,
      },
    ];

    return satisfactionRate.toFixed(2);
  }
}
