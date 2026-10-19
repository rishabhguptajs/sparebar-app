"use client";

import { track } from "@/components/analytics";

type Props = React.VideoHTMLAttributes<HTMLVideoElement> & { name: string };

/** A video that reports when someone starts playing it. */
export function TrackedVideo({ name, ...rest }: Props) {
  // eslint-disable-next-line jsx-a11y/media-has-caption
  return <video {...rest} onPlay={() => track("video_played", { video: name })} />;
}
