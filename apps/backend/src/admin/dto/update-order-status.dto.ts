import { IsIn, IsString } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsString()
  @IsIn(['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded'])
  status: string;
}
