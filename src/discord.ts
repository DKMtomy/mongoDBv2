import { world } from "@minecraft/server";
import { HttpRequest, HttpRequestMethod, HttpHeader, HttpResponse, http } from "@minecraft/server-net";

export class MinecraftServer {
  private baseURL: string = "http://localhost:3000";
  private apiKey: string = "your-api-key";  // If needed for other use cases
  private dataSource: string = "data-source"; // Replace with relevant data source

  // Method to start long-polling the server for messages from Discord
  public async pollServer() {
    console.log("pollServer");
      try {
        console.log("Polling server for messages from Discord...");
          const response = await this.makeRequest("minecraft", HttpRequestMethod.Get, "", "", {});

          if (response.status === 200) {
              const data = JSON.parse(response.body);
              console.log(`Received message from Discord: ${data.message}`);

              // Broadcast the message to all players
              this.broadcastMessage(`Message from Discord: ${data.message}`);
          }
      } catch (error) {
          console.error("Error polling server:", error);
      } finally {
          // Continue polling after the current request is completed (or if an error occurs)
          this.pollServer(); // Automatically starts a new request after a response is received
      }
  }

  // Helper method to make HTTP requests (same as your provided structure)
  private async makeRequest(
      endpoint: string,
      method: HttpRequestMethod,
      database: string,
      collection: string,
      body: any
  ): Promise<HttpResponse> {
      const req = new HttpRequest(`${this.baseURL}/${endpoint}`);
      req.setMethod(method);
      req.setBody(
          JSON.stringify({
              ...body,
              dataSource: this.dataSource,
              database,
              collection,
          })
      );
      req.setHeaders([
          new HttpHeader("Content-Type", "application/json"),
          new HttpHeader("api-key", this.apiKey), // Optional if you're using an API key
      ]);

      return await http.request(req);
  }

  // Broadcast the message to all players
  private broadcastMessage(message: string) {
     world.sendMessage(message);
  }
}