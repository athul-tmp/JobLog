import * as signalR from "@microsoft/signalr";
import { JobApplication } from "@/types/types";

const HUB_URL =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5264") +
  "/hubs/jobapplications";

export function isBenignSignalRError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("stopped during negotiation");
}

export function buildJobApplicationHubConnection(
  onJobCreated: (job: JobApplication) => void
) {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, { withCredentials: true })
    .withAutomaticReconnect()
    .build();

  connection.on("JobApplicationCreated", onJobCreated);

  return connection;
}
