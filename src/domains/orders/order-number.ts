import { formatPublicOrderNumber } from "@/lib/ids";

export interface SequenceStore {
  next(restaurantId: string): Promise<number>;
}

export class OrderNumberService {
  constructor(
    private readonly sequences: SequenceStore,
    private readonly prefix = "GH",
  ) {}

  async next(restaurantId: string): Promise<string> {
    const sequence = await this.sequences.next(restaurantId);
    return formatPublicOrderNumber(sequence, this.prefix);
  }
}
