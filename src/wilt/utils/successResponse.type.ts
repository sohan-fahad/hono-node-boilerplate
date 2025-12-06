export class SuccessResponse {
  public success: boolean;
  public statusCode: number;
  public message: string;
  public data: any;
  public duration?: number;
  public meta?: {
    total?: number;
    limit?: number;
    page?: number;
    skip?: number;
  };

  constructor(
    message: string,
    data?: any,
    statusCode?: number,
    meta?: {
      total?: number;
      limit?: number;
      page?: number;
      skip?: number;
    },
    duration?: number,
  ) {
    this.success = true;
    this.statusCode = statusCode || 200;
    this.message = message || 'Success';
    if (meta) {
      this.meta = meta;
    }
    this.data = data || null;
    this.duration = duration;
  }
}
