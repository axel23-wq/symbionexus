import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, ConflictException } from '@nestjs/common';
import { CreateUserCommand } from '../commands/create-user.command';
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { UserEntity } from '../../domain/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: CreateUserCommand): Promise<string> {
    const existingUser = await this.userRepository.findByEmail(command.email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const userId = uuidv4();
    const user = new UserEntity(
      userId,
      command.email,
      command.passwordHash,
      command.firstName,
      command.lastName,
      command.roleId || null,
      command.companyId,
      true,
      new Date(),
      new Date(),
    );

    await this.userRepository.save(user);

    // Later: Emit UserCreatedEvent for the EventBus
    return userId;
  }
}
