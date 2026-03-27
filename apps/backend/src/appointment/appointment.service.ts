import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentEntity } from '../database/entities';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(AppointmentEntity)
    private readonly appointmentRepo: Repository<AppointmentEntity>,
  ) {}

  async getAvailableSlots(storeId: string, date: string) {
    const booked = await this.appointmentRepo.find({
      where: { storeId, date, status: 'confirmed' },
    });
    const allSlots = this.generateTimeSlots('09:00', '18:00', 30);
    const bookedTimes = new Set(booked.map((a) => a.startTime));
    const data = allSlots.map((slot) => ({
      ...slot,
      isAvailable: !bookedTimes.has(slot.start),
    }));
    return { success: true, data };
  }

  async create(userId: string, dto: Record<string, unknown>) {
    const appointment = this.appointmentRepo.create({ ...dto, userId });
    const saved = await this.appointmentRepo.save(appointment);
    return { success: true, data: saved };
  }

  async getByUserId(userId: string, page: number) {
    const limit = 20;
    const [data, total] = await this.appointmentRepo.findAndCount({
      where: { userId },
      order: { date: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async cancel(id: string) {
    const appointment = await this.appointmentRepo.findOne({ where: { id } });
    if (!appointment) throw new NotFoundException('Randevu bulunamadı');
    await this.appointmentRepo.update(id, { status: 'cancelled' });
    return { success: true, message: 'Randevu iptal edildi' };
  }

  private generateTimeSlots(start: string, end: string, durationMinutes: number) {
    const slots: { start: string; end: string; isAvailable: boolean }[] = [];
    let [h, m] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    while (h < endH || (h === endH && m < endM)) {
      const slotStart = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      m += durationMinutes;
      if (m >= 60) { h += Math.floor(m / 60); m %= 60; }
      const slotEnd = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      slots.push({ start: slotStart, end: slotEnd, isAvailable: true });
    }
    return slots;
  }
}
