import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { WS_URL } from "../config/env";

// Keep one live STOMP client instance so we can subscribe/unsubscribe cleanly.
let stompClient = null;

export const connectNotificationsSocket = ({
  token,
  onNotification,
  onUnreadCount,
}) => {
  if (!token) return null;

  // SockJS matches the backend's configured /ws endpoint.
  stompClient = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    connectHeaders: {
      // Backend expects the JWT in STOMP connect headers.
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 5000,
    debug: () => {},
    onConnect: () => {
      // Personal notification stream for the signed-in user.
      stompClient?.subscribe("/user/queue/notifications", (message) => {
        onNotification?.(JSON.parse(message.body));
      });

      // Separate unread count channel keeps the header badge fast and simple.
      stompClient?.subscribe(
        "/user/queue/notifications/unread-count",
        (message) => {
          onUnreadCount?.(JSON.parse(message.body));
        }
      );
    },
  });

  stompClient.activate();
  return stompClient;
};

export const disconnectNotificationsSocket = async () => {
  if (!stompClient) return;
  // Graceful shutdown prevents duplicate socket subscriptions.
  await stompClient.deactivate();
  stompClient = null;
};
