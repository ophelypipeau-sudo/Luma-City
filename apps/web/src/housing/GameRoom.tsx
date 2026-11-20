import { homeOwner } from "../../../../packages/contracts/src/index";
import { Room } from "../Room";
import { HomeRoom, type HomeRoomProps } from "./HomeRoom";

export function GameRoom(props: HomeRoomProps) {
  const { onHomeBalance, ...roomProps } = props;
  return homeOwner(props.roomId)
    ? <HomeRoom key={`${props.roomId}:${props.me}:${props.generation}`} {...props} />
    : <Room {...roomProps} />;
}
