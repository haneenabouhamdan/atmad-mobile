import { useEffect, useState } from "react";
import {
  Image,
  LayoutChangeEvent,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { spacing } from "../theme/tokens";

type Props = {
  uri: string;
  posterUri?: string | null;
  /** width 100%; height = width / aspectRatio (clamped) */
  aspectRatio: number;
  useNativeControls?: boolean;
};

/**
 * Uses `expo-video` (Expo SDK 54 + New Architecture). `expo-av` Video is
 * deprecated here and often fails to show a picture on RN’s new arch.
 */
export function EditorialVideoPlayer({
  uri,
  posterUri,
  aspectRatio,
  useNativeControls = true,
}: Props) {
  const { width: screenW } = useWindowDimensions();
  const [measuredW, setMeasuredW] = useState(0);
  const [posterHidden, setPosterHidden] = useState(false);

  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });

  useEffect(() => {
    setPosterHidden(false);
  }, [uri]);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setMeasuredW(w);
  };

  const estimatedW = Math.max(160, screenW - spacing.xl * 2);
  const boxW = measuredW > 0 ? measuredW : estimatedW;
  const rawH = boxW / aspectRatio;
  const height = Math.max(180, Math.min(rawH, boxW * 1.5));

  const poster = posterUri?.trim() ?? "";
  const showPoster = Boolean(poster) && !posterHidden;

  return (
    <View
      onLayout={onLayout}
      style={{
        width: "100%",
        height,
        backgroundColor: "#0A0A0A",
        overflow: "hidden",
      }}
    >
      <VideoView
        player={player}
        style={[StyleSheet.absoluteFillObject, { backgroundColor: "#000" }]}
        nativeControls={useNativeControls}
        contentFit="cover"
        onFirstFrameRender={() => {
          if (poster) setPosterHidden(true);
        }}
      />
      {showPoster ? (
        <Image
          source={{ uri: poster }}
          style={[StyleSheet.absoluteFillObject, { zIndex: 1 }]}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : null}
      {!poster ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { zIndex: 2, alignItems: "center", justifyContent: "center" },
          ]}
        >
          <Feather name="play-circle" size={56} color="rgba(255,255,255,0.9)" />
        </View>
      ) : null}
    </View>
  );
}
