import { EventEmitter } from "stream";
import { GameStatus } from "./games-status";

export const gameEventHandler = new (class GameEvent extends EventEmitter {
  sendStatus(status: GameStatus): void {
    super.emit("status", status);
  }

  onStatus(cb: (status: GameStatus) => void): void {
    super.on("status", cb);
  }

  leave(cb: (status: GameStatus) => void): void {
    super.removeListener("status", cb);
  }
})();
