import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, AddressEntity } from '../database/entities';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(AddressEntity)
    private readonly addressRepo: Repository<AddressEntity>,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');
    const { password, ...profile } = user;
    const addresses = await this.addressRepo.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
    return { success: true, data: { ...profile, addresses } };
  }

  async getAddresses(userId: string) {
    const addresses = await this.addressRepo.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
    return { success: true, data: addresses };
  }

  async createAddress(userId: string, dto: Record<string, unknown>) {
    if (dto.isDefault) {
      await this.addressRepo.update({ userId }, { isDefault: false });
    }
    const address = this.addressRepo.create({ ...dto, userId });
    const saved = await this.addressRepo.save(address);
    return { success: true, data: saved };
  }

  async updateAddress(userId: string, addressId: string, dto: Record<string, unknown>) {
    const address = await this.addressRepo.findOne({ where: { id: addressId, userId } });
    if (!address) throw new NotFoundException('Adres bulunamadı');
    if (dto.isDefault) {
      await this.addressRepo.update({ userId }, { isDefault: false });
    }
    await this.addressRepo.update(addressId, dto);
    const updated = await this.addressRepo.findOne({ where: { id: addressId } });
    return { success: true, data: updated };
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await this.addressRepo.findOne({ where: { id: addressId, userId } });
    if (!address) throw new NotFoundException('Adres bulunamadı');
    await this.addressRepo.remove(address);
    return { success: true, message: 'Adres silindi' };
  }
}
