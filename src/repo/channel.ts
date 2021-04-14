import { Channel } from "../core/channel/channel-models";
import ChannelModel, { IChannel } from "./models/Channel";

function toChannel(channel: IChannel): Channel {
  const actualUser: Channel = {
    id: channel._id,
    name: channel.name,
    twitch_id: channel.twitch_id,
  };
  return actualUser;
}

export async function upsertChannel(channel: Channel): Promise<Channel | null> {
  const upsertChannel = await ChannelModel.findOneAndUpdate(
    { twitch_id: channel.twitch_id },
    {
      ...channel,
    },
    { upsert: true, new: true }
  );

  return toChannel(upsertChannel);
}

export async function getChannelById(id: string): Promise<Channel | null> {
  const existingChannel = await ChannelModel.findById(id);
  return existingChannel && toChannel(existingChannel);
}

export async function listChannels(): Promise<Channel[]> {
  const existingChannels = await ChannelModel.find();
  return existingChannels.map((existingChannel) => toChannel(existingChannel));
}

export async function removeAll(): Promise<void> {
  await ChannelModel.deleteMany({});
}
