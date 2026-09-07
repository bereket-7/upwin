import { NotFoundException } from '@nestjs/common';
import { Profile } from '../interfaces/profile.interface';

/** Fail closed: missing or mismatched profile.userId is treated as not found. */
export function assertProfileOwnedByUser(profile: Profile, userId: string): void {
  if (!profile.userId || profile.userId !== userId) {
    throw new NotFoundException(`Profile with ID ${profile.id} not found`);
  }
}
