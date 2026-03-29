import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { UserEntity, AddressEntity } from '../database/entities';

const mockUserRepo = {
  findOne: jest.fn(),
};

const mockAddressRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(UserEntity), useValue: mockUserRepo },
        { provide: getRepositoryToken(AddressEntity), useValue: mockAddressRepo },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      const user = { id: '1', email: 'test@test.com', password: 'hashed', name: 'Test', surname: 'User' };
      mockUserRepo.findOne.mockResolvedValue(user);
      mockAddressRepo.find.mockResolvedValue([]);

      const result = await service.getProfile('1');

      expect(result.success).toBe(true);
      expect(result.data).not.toHaveProperty('password');
      expect(result.data.email).toBe('test@test.com');
      expect(result.data.addresses).toEqual([]);
    });

    it('should throw NotFoundException for invalid user', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.getProfile('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAddresses', () => {
    it('should return user addresses', async () => {
      const addresses = [{ id: 'a1', title: 'Ev', city: 'İstanbul' }];
      mockAddressRepo.find.mockResolvedValue(addresses);

      const result = await service.getAddresses('1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(addresses);
    });
  });

  describe('createAddress', () => {
    it('should create and return address', async () => {
      const dto = { title: 'Ev', city: 'İstanbul', district: 'Kadıköy', street: 'Test Sok', fullName: 'Test', phone: '555' };
      const created = { id: 'a1', userId: '1', ...dto };
      mockAddressRepo.create.mockReturnValue(created);
      mockAddressRepo.save.mockResolvedValue(created);

      const result = await service.createAddress('1', dto);

      expect(result.success).toBe(true);
      expect(result.data.city).toBe('İstanbul');
    });

    it('should reset other defaults when isDefault is true', async () => {
      const dto = { title: 'İş', isDefault: true, city: 'Ankara', district: 'Çankaya', street: 'X', fullName: 'A', phone: '5' };
      mockAddressRepo.create.mockReturnValue({ id: 'a2', userId: '1', ...dto });
      mockAddressRepo.save.mockResolvedValue({ id: 'a2', userId: '1', ...dto });

      await service.createAddress('1', dto);

      expect(mockAddressRepo.update).toHaveBeenCalledWith({ userId: '1' }, { isDefault: false });
    });
  });

  describe('deleteAddress', () => {
    it('should delete address', async () => {
      const address = { id: 'a1', userId: '1' };
      mockAddressRepo.findOne.mockResolvedValue(address);

      const result = await service.deleteAddress('1', 'a1');

      expect(result.success).toBe(true);
      expect(mockAddressRepo.remove).toHaveBeenCalledWith(address);
    });

    it('should throw NotFoundException for invalid address', async () => {
      mockAddressRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteAddress('1', 'invalid')).rejects.toThrow(NotFoundException);
    });
  });
});
