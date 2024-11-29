import {
  http,
  HttpRequest,
  HttpHeader,
  HttpRequestMethod,
  HttpResponse,
} from "@minecraft/server-net";

interface MongoDBOptions {
  baseURL: string;
  apiKey: string;
  dataSource: string;
}

type MongoDBAction = 
  | 'insertOne' | 'insertMany' | 'findOne' | 'find'
  | 'updateOne' | 'updateMany' | 'deleteOne' | 'deleteMany'
  | 'count' | 'aggregate';

  
  function log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      console.log(`Calling ${propertyKey} with arguments:`, JSON.stringify(args));
      return originalMethod.apply(this, args);
    };
    return descriptor; // Ensure the descriptor is returned.
  }
  

class MongoDB {
  private baseURL: string;
  private apiKey: string;
  private dataSource: string;

  constructor(options: MongoDBOptions) {
    this.baseURL = options.baseURL;
    this.apiKey = options.apiKey;
    this.dataSource = options.dataSource;
  }

  private async makeRequest<T>(
    action: MongoDBAction,
    database: string,
    collection: string,
    body: any
  ): Promise<T> {
    const req = new HttpRequest(`${this.baseURL}/action/${action}`);
    req.setMethod(HttpRequestMethod.Post);
    req.setBody(JSON.stringify({
      ...body,
      dataSource: this.dataSource,
      database,
      collection,
    }));
    req.setHeaders([
      new HttpHeader("Content-Type", "application/json"),
      new HttpHeader("api-key", this.apiKey),
    ]);

    const response = await http.request(req);
    return JSON.parse(response.body);
  }

  @log
  async insertOne<T>(database: string, collection: string, document: T): Promise<{ insertedId: string }> {
    return this.makeRequest('insertOne', database, collection, { document });
  }

  @log
  async insertMany<T>(database: string, collection: string, documents: T[]): Promise<{ insertedIds: string[] }> {
    return this.makeRequest('insertMany', database, collection, { documents });
  }

  @log
  async findOne<T>(database: string, collection: string, filter: Partial<T>): Promise<T | null> {
    return this.makeRequest('findOne', database, collection, { filter });
  }

  @log
  async find<T>(database: string, collection: string, filter: Partial<T>): Promise<T[]> {
    return this.makeRequest('find', database, collection, { filter });
  }

  @log
  async updateOne<T>(database: string, collection: string, filter: Partial<T>, update: Partial<T>): Promise<{ matchedCount: number; modifiedCount: number }> {
    return this.makeRequest('updateOne', database, collection, { filter, update });
  }

  @log
  async updateMany<T>(database: string, collection: string, filter: Partial<T>, update: Partial<T>): Promise<{ matchedCount: number; modifiedCount: number }> {
    return this.makeRequest('updateMany', database, collection, { filter, update });
  }

  @log
  async deleteOne<T>(database: string, collection: string, filter: Partial<T>): Promise<{ deletedCount: number }> {
    return this.makeRequest('deleteOne', database, collection, { filter });
  }

  @log
  async deleteMany<T>(database: string, collection: string, filter: Partial<T>): Promise<{ deletedCount: number }> {
    return this.makeRequest('deleteMany', database, collection, { filter });
  }

  @log
  async count<T>(database: string, collection: string, filter: Partial<T>): Promise<number> {
    const result = await this.makeRequest<{ count: number }>('count', database, collection, { filter });
    return result.count;
  }

  @log
  async aggregate<T, R>(database: string, collection: string, pipeline: any[]): Promise<R[]> {
    return this.makeRequest('aggregate', database, collection, { pipeline });
  }
}

export { MongoDB };