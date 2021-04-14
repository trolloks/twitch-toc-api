import { Channel, ChannelDTO } from "./channel-models";
import * as channelRepo from "../../repo/channel";
import { getBroadcasterId } from "../../gateway/twitch-gateway";

const { NODE_SECRET } = process.env;

export async function listChannels(): Promise<Channel[]> {
  const dataUsers = await channelRepo.listChannels();
  if (dataUsers) {
    return dataUsers;
  }
  return [];
}

export async function createChannel(channelDTO: ChannelDTO): Promise<void> {
  const channel: Channel = { ...channelDTO };
  const id = await getBroadcasterId(channel.name);
  if (!id) {
    return;
  }
  channel.twitch_id = id;
  await channelRepo.upsertChannel(channel);
}

export async function deleteAll(): Promise<void> {
  await channelRepo.removeAll();
}
