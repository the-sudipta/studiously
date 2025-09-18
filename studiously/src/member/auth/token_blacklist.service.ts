import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { MemberService } from '../member.service';

@Injectable()
export class TokenBlacklistService {
  private blacklistedTokens: Set<string> = new Set();

  constructor(
    @Inject(forwardRef(() => MemberService))
    private readonly memberService: MemberService,
  ) {}

  async addToBlacklist(email: string, token: string): Promise<boolean> {
    try {
      const currentDate = new Date();
      const dateString = currentDate.toISOString(); // Convert date to ISO string

      const decision: boolean = await this.memberService.addToBlacklist(
        token,
        dateString,
        email,
      );

      if (decision) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      throw new InternalServerErrorException(
        `addToBlacklist TokenBlacklistService Error = ${e instanceof Error ? e.message : String(e)}`,
        { cause: e instanceof Error ? e : undefined },
      );
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    // return this.blacklistedTokens.has(token);
    const data = await this.memberService.get_token_by_token(token);
    return !!data;
  }
}
