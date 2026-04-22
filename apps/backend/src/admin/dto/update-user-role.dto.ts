import { IsIn, IsString } from 'class-validator';

export class UpdateUserRoleDto {
  @IsString()
  @IsIn(['customer', 'store_owner', 'admin'])
  role: string;
}
