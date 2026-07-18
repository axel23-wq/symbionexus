import { v4 as uuidv4 } from 'uuid';

export abstract class DomainEvent {
  public readonly id: string;
  public readonly occurredOn: Date;

  constructor() {
    this.id = uuidv4();
    this.occurredOn = new Date();
  }

  abstract get eventName(): string;
}
