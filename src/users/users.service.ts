import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  private readonly users = [
    {
      id: 1,
      username: 'sAdmin',
      role: 'SUPER_ADMIN',
      password: 'qaz123!@#',
    },
    {
      id: 2,
      username: 'support',
      role: 'SUPPORT',
      password: 'VibeTech@2024',
    },
  ];

  async findOne(username: string): Promise<any> {
    return this.users.find((user) => user.username === username);
  }
}
