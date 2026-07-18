import { Controller, Post, Body } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateUserCommand } from '../../../application/commands/create-user.command';
import * as bcrypt from 'bcryptjs';

@ApiTags('Core - Users')
@Controller('core/users')
export class UsersController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'The user has been successfully created.' })
  @ApiResponse({ status: 409, description: 'Email already exists.' })
  async createUser(@Body() dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    
    const command = new CreateUserCommand(
      dto.email,
      passwordHash,
      dto.firstName,
      dto.lastName,
      dto.companyId,
      dto.roleId,
    );

    const userId = await this.commandBus.execute(command);
    
    return {
      success: true,
      data: { id: userId },
      message: 'User created successfully',
    };
  }
}
