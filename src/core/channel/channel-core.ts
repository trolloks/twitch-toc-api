import { Channel, ChannelDTO } from "./channel-models";
import * as channelRepo from "../../repo/channel";
import { getBroadcasters, getBroadcaster } from "../../gateway/twitch-gateway";

const { NODE_SECRET } = process.env;

export async function listChannels(game_id: string): Promise<Channel[]> {
  const dataUsers = await channelRepo.listChannels(game_id);
  if (dataUsers) {
    return dataUsers;
  }
  return [];
}

export async function fetchChannels(
  name: string,
  game_id?: string
): Promise<any[]> {
  const ids = await getBroadcasters(name, game_id);
  if (ids) {
    return ids;
  }
  return [];
}

export async function getChannelByTwitchId(
  twitch_id: string
): Promise<Channel | null> {
  const channel = await channelRepo.getChannelByTwitchId(twitch_id);
  return channel;
}

export async function createChannel(channelDTO: ChannelDTO): Promise<void> {
  const channel = await getBroadcaster(channelDTO.broadcaster_id);
  if (!channel) {
    return;
  }
  console.log(channel);
  if (channelDTO.game_id) {
    channel.game_id = channelDTO.game_id;
  }
  await channelRepo.upsertChannel(channel);
}

export async function deleteOne(twitch_id: string): Promise<void> {
  await channelRepo.removeOne(twitch_id);
}

export async function deleteAll(): Promise<void> {
  await channelRepo.removeAll();
}
