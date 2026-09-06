import { NotFoundException } from '@nestjs/common';
import { Profile } from '../interfaces/profile.interface';

/** Defense-in-depth: profile-service already scopes by JWT; assert claim match when userId is present. */
export function assertProfileOwnedByUser(profile: Profile, userId: string): void {
  if (profile.userId && profile.userId !== userId) {
    throw new NotFoundException(`Profile with ID ${profile.id} not found`);
  }
}
