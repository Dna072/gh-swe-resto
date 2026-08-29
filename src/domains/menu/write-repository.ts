import type { HomepageContent } from "@/domains/content/models";
import type { MenuItem } from "./models";
import type { MenuRepository } from "./repository";

export interface MenuWriteRepository extends MenuRepository {
  saveItem(item: MenuItem): Promise<MenuItem>;
  getHomepage(restaurantId: string): Promise<HomepageContent | null>;
  saveHomepage(content: HomepageContent): Promise<HomepageContent>;
}
