import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    findById: jest.fn(),
    updateProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      mockUsersService.findById.mockResolvedValue(mockUser);
      
      const req = { user: { sub: 'user-1' } };
      const result = await controller.getProfile(req);
      
      expect(result).toEqual(mockUser);
      expect(service.findById).toHaveBeenCalledWith('user-1');
    });
  });

  describe('updateProfile', () => {
    it('should update and return user profile', async () => {
      const mockUpdatedUser = { id: 'user-1', firstName: 'Jean' };
      const updateDto: UpdateProfileDto = { firstName: 'Jean' };
      mockUsersService.updateProfile.mockResolvedValue(mockUpdatedUser);
      
      const req = { user: { sub: 'user-1' } };
      const result = await controller.updateProfile(req, updateDto);
      
      expect(result).toEqual(mockUpdatedUser);
      expect(service.updateProfile).toHaveBeenCalledWith('user-1', updateDto);
    });
  });

  describe('getUserById', () => {
    it('should return a user by id', async () => {
      const mockUser = { id: 'user-2' };
      mockUsersService.findById.mockResolvedValue(mockUser);
      
      const result = await controller.getUserById('user-2');
      
      expect(result).toEqual(mockUser);
      expect(service.findById).toHaveBeenCalledWith('user-2');
    });
  });
});
