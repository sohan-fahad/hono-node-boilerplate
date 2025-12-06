import { Injectable } from "@wilt/index.js";

@Injectable()
export class UtilsService {
  constructor() { }

  /**
   * Helper function to convert base64 decoded byte string to Uint8Array
   */
  private byteStringToUint8Array(byteString: string): Uint8Array {
    const uint8Array = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }
    return uint8Array;
  }

  async getNewOtpCode(
    phone: string,
    mysecretkey: string,
    expiryMin = 2
  ) {
    try {
      const encoder = new TextEncoder();
      const secretKeyData = encoder.encode(mysecretkey);

      const otp = [
        Math.floor(Math.random() * 9) + 1,
        ...Array.from(crypto.getRandomValues(new Uint8Array(5)))
          .map((num) => (num % 10).toString()),
      ].join("");


      const ttl = expiryMin * 60 * 1000;
      const expires = Date.now() + ttl;
      const data = `${phone}.${otp}.${expires}`;
      const key = await crypto.subtle.importKey(
        "raw",
        secretKeyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
      const hash = btoa(String.fromCharCode(...new Uint8Array(mac)));
      const fullHash = `${hash}.${expires}`;
      return { hash: fullHash, otp };
    } catch (error: any) {
      throw new Error(`Failed to generate OTP: ${error.message}`);
    }
  };

  async verifyOTPCode(
    phone: string,
    fullHash: string,
    otp: string,
    mysecretkey: string
  ): Promise<boolean> {
    try {
      const encoder = new TextEncoder();
      const secretKeyData = encoder.encode(mysecretkey);

      const [hash, expires] = fullHash.split(".");
      const now = Date.now();

      // Check if OTP is expired
      if (now > Number(expires)) {
        return false;
      }

      const key = await crypto.subtle.importKey(
        "raw",
        secretKeyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
      );

      const data = `${phone}.${otp}.${expires}`;
      const receivedMac = this.byteStringToUint8Array(atob(hash));

      // Verify the HMAC
      const isValid = await crypto.subtle.verify(
        "HMAC",
        key,
        new Uint8Array(receivedMac),
        encoder.encode(data)
      );

      return isValid;
    } catch (error) {
      return false;
    }
  }
}