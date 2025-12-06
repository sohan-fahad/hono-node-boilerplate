import { Injectable } from "@wilt/index.js";
import * as bcrypt from 'bcrypt';
@Injectable()
export class BcryptService {
  private readonly saltRounds: number;

  constructor() {
    this.saltRounds = 10;
  }

  async hash(plainText: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.saltRounds);
    return await bcrypt.hash(plainText, salt);
  }

  async compare(plainText: string, hashString: string): Promise<boolean> {
    return await bcrypt.compare(plainText, hashString);
  }
}