import { Test, TestingModule } from '@nestjs/testing';
import { AIService } from '../ai.service';
import { ProviderService } from '../providers/provider.service';
import { ConversationService } from '../core/conversation.service';
import { RetrieverService } from '../rag/retriever.service';
import { WorkflowContextService } from '../workflow-context/workflow-context.service';

describe('AIService', () => {
  let service: AIService;
  let provider: ProviderService;
  let conversations: ConversationService;
  let retriever: RetrieverService;
  let workflowContext: WorkflowContextService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIService,
        {
          provide: ProviderService,
          useValue: {
            streamChat: jest.fn(async (prompt, onToken) => {
              onToken('Test');
              onToken(' response');
            }),
          },
        },
        {
          provide: ConversationService,
          useValue: {
            createMessage: jest.fn(async () => ({ id: '1' })),
            getHistory: jest.fn(async () => []),
          },
        },
        {
          provide: RetrieverService,
          useValue: {
            retrieve: jest.fn(async () => []),
          },
        },
        {
          provide: WorkflowContextService,
          useValue: {
            getContext: jest.fn(async () => 'Test prompt'),
          },
        },
      ],
    }).compile();

    service = module.get<AIService>(AIService);
    provider = module.get<ProviderService>(ProviderService);
    conversations = module.get<ConversationService>(ConversationService);
    retriever = module.get<RetrieverService>(RetrieverService);
    workflowContext = module.get<WorkflowContextService>(WorkflowContextService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should process message and stream response', async () => {
    const onToken = jest.fn();

    const result = await service.processMessage(
      'Test message',
      'general',
      'conv-1',
      'user-1',
      onToken
    );

    expect(result).toBe('Test response');
    expect(conversations.createMessage).toHaveBeenCalledTimes(2);
    expect(provider.streamChat).toHaveBeenCalled();
  });

  it('should call workflow context with module', async () => {
    const onToken = jest.fn();

    await service.processMessage(
      'Test',
      'marketplace',
      'conv-1',
      'user-1',
      onToken
    );

    expect(workflowContext.getContext).toHaveBeenCalledWith('marketplace');
  });

  it('should retrieve context from RAG', async () => {
    const onToken = jest.fn();

    await service.processMessage(
      'Test query',
      'general',
      'conv-1',
      'user-1',
      onToken
    );

    expect(retriever.retrieve).toHaveBeenCalledWith('Test query', 'general');
  });

  it('should save user message before processing', async () => {
    const onToken = jest.fn();

    await service.processMessage(
      'Test message',
      'general',
      'conv-1',
      'user-1',
      onToken
    );

    const firstCall = (conversations.createMessage as jest.Mock).mock.calls[0];
    expect(firstCall[0]).toBe('conv-1');
    expect(firstCall[1]).toBe('user');
    expect(firstCall[2]).toBe('Test message');
  });

  it('should save assistant response after processing', async () => {
    const onToken = jest.fn();

    await service.processMessage(
      'Test',
      'general',
      'conv-1',
      'user-1',
      onToken
    );

    const secondCall = (conversations.createMessage as jest.Mock).mock.calls[1];
    expect(secondCall[1]).toBe('assistant');
    expect(secondCall[2]).toBe('Test response');
  });
});
